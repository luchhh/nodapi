const mysql = require("mysql2");
const moment = require('moment');

//nombre de la tabla en BD
var _tabla = "libro";

/**
 * @description Constructor de un Repositorio de Libros. 
 */
var repositorioLibros = function() {
    this.error = "";
}

/** 
 * @description retorna el libro a partir de ID consultando la base de datos
 * @param {string} id
 * @param {function} callback con la firma (error, libro) donde libro
 * es el objeto encontrado en base de datos, NULL si no existe.
 */
repositorioLibros.prototype.getPorId = function(id, callback){
    id = id.trim();
    const con = mysql.createConnection({
        host: global.gConfig.db.host,
        user: global.gConfig.db.usuario,
        password: global.gConfig.db.password,
        database: global.gConfig.db.nombre,
    });

    var sql = "SELECT * FROM "+_tabla+" WHERE id = ?";

    rpta = con.execute(sql, [id], (err, results, fields) => {
            if(results.length==0){
                callback("Libro no encontrado "+err, null);
            }else{
                //Creamos un objeto config con los resultados
                //obtenidos de la base de datos y lo pasamos
                //a la factoría de libros
                var config = {};
                config.nombre = results[0].name;
                config.descripcion = results[0].description;
                config.url = results[0].url;
                config.creada = results[0].created;
                config.modificada = results[0].modified;
                config.id = id;
                var nl=this.crearLibro(config);
                if(nl){
                    callback(null, nl);
                }else{
                    callback(getUltimoError(), null);
                }
            }
        });
}

/** 
 * @description retorna un array de libros conforme a config consultando la base de datos
 * @param {object} config con las propiedades 
 *          - config.q  : Una query para buscar libros. Busca en las propiedades nombre y descripcion
 *          - config.ini: El número de página a mostrar. Por defecto 1.
 *          - config.lim: El número de resultados por página. Por defecto 10.
 *          - config.ord: El orden en que deben ordenarse los recursos antes de ser paginados. 
 *                      Es posible utilizar las propiedades del libro: `nombre`, `descripcion`, 
 *                      `url`,`creada` y `modificada`. 
 *                      Pueden concatenarse varias propiedades con una coma `,` entre ellas. 
 *                      El signo menos `-` antes de la propiedad significa orden descendente
 * @param {function} callback con la firma (error, libros) donde libros
 * es un array de objetos libro encontrados en base de datos. Array vacío 
 * si ningún libro coincide
*/
repositorioLibros.prototype.buscar = function(config, callback){
    
    const con = mysql.createConnection({
        host: global.gConfig.db.host,
        user: global.gConfig.db.usuario,
        password: global.gConfig.db.password,
        database: global.gConfig.db.nombre,
    });

    //construimos la consulta para buscar en base de datos según parámetros
    var sql = "SELECT id, name, description, url FROM "+_tabla+" WHERE 1";
    var params = [];
    if(config.q){
        sql = sql + ' AND (name LIKE ? OR description LIKE ?)';
        params.push("%"+config.q+"%");
        params.push("%"+config.q+"%");
    }
    var lim = 10;
    if(config.lim){
        lim = parseInt(config.lim);
        lim = (Number.isInteger(lim) && lim<50)? lim: 10;
    }
    var limIni = 0;
    if(config.ini){
        ini = parseInt(config.ini);
        limIni = (Number.isInteger(ini) && ini>0)? (ini-1)*lim: 0;
    }
    var orderBy = "";
    if(config.ord){
        var configOrdenes = config.ord.split(",");
        var columnasValidas = {
            nombre: "name",
            descripcion: "description",
            url: "url",
            creada: "created",
            modificada: "modified"
        }
        configOrdenes.forEach( function(directiva){
            var op = directiva.charAt(0)
            var columna;
            if(op=="-"){
                columna = directiva.substring(1);
                op = "DESC";
            }else{
                columna = directiva;
                op = "ASC";
            }
            if(columnasValidas.hasOwnProperty(columna)){
                var separador = (orderBy.length==0)? " ORDER BY":",";
                orderBy = orderBy+separador+" "+columnasValidas[columna]+" "+op;
            }
        });
    }
    sql = sql + orderBy;
    sql = sql + " LIMIT "+limIni+","+lim;
    
    //array de libros vacío y ejecución de consulta
    var libros = [];
    rpta = con.execute(sql, params,
        (err, results, fields) => {
            if(results.length==0){
                callback("Ningún libro encontrado "+err, libros);
            }else{
                results.forEach(
                    (fila) => {
                        var config = {};
                        config.nombre = fila.name;
                        config.descripcion = fila.description;
                        config.url = fila.url;
                        config.creada = fila.created;
                        config.modificada = fila.modified;
                        config.id = fila.id;
                        var nl=this.crearLibro(config);
                        
                        if(nl){
                            libros.push(nl);
                        }else{
                            //fallo silencioso
                        }
                    }
                );
                callback(null, libros);
            }
        });
}


/**
 * @description Factoria de libros. Para ser llamado así nuevoLibro = libros.crearLibro(config)
 * @param {object} config con las propiedades del libro a crear
 *          - config.id : un ID entero, opcional
 *          - config.nombre: String, obligatorio
 *          - config.descripcion: String, obligatorio
 *          - config.url: String, obligatorio
 *          - config.creada: fecha de creación, opcional
 *          - config.modificada: fecha de modificación, opcional
 * @returns nuevoLibro o null si es que alguno de los parámetros de config hace imposible 
 * crear el libro. Si es que la creación del libro falla se actualiza el último error registrado
 * en este repositorio
 */
repositorioLibros.prototype.crearLibro = function(config){
    var error;
    //creamos un objeto libro a partir de la configuración pasada
    var libro = Object.assign({},config);
    
    //validación de los parámetros
    if(libro.id){
        libro.id = parseInt(libro.id);
        if(!Number.isInteger(libro.id)) error = "ID debe ser entero";
    }
    if(!libro.nombre || libro.nombre.trim().length == 0) error = "Nombre inválido";
    if(!libro.descripcion || libro.descripcion.trim().length == 0) error = "Descripción inválida";
    if(!libro.url || libro.url.trim().length == 0) error = "URL inválida";

    //si hubo algún error se actualiza el último error del repositorio
    if(error){
        this.error = error; //this hace referencia a repositorioLibros
        return null;
    }

    //agregamos al objeto libro las funciones insertar, actualizar y eliminar

    /**
     * @description Inserta en la base de datos este libro
     * @param {function} callback con la firma (error, resultado). Esta firma
     * es la misma que el callback de execute de mysql
     */
    libro.insertar = function(callback){
        //this hace referencia al libro
        const con = mysql.createConnection({
            host: global.gConfig.db.host,
            user: global.gConfig.db.usuario,
            password: global.gConfig.db.password,
            database: global.gConfig.db.nombre,
        });
        var ahora = moment().format("YYYY-MM-DD HH:mm:ss");
        this.creada = ahora;
        var sql = "INSERT INTO "+_tabla+" (id, name, description, url, created) VALUES (NULL,?,?,?,?)";
        
        rpta = con.execute(
            sql, 
            [this.nombre, this.descripcion, this.url, this.creada], (error, resultado) => {
                //antes de llamar al callback asignamos a este libro
                //el nuevo ID
                if(resultado.insertId) this.id = resultado.insertId+"";
                callback(error, resultado);
            }
        );
    }

    /**
     * @description Actualiza en la base de datos este libro
     * @param {object} nConfig propiedades del libro que quieren modificarse
     *          - config.nombre: String, opcional
     *          - config.descripcion: String, opcional
     *          - config.url: String, opcional
     * @param {function} callback con la firma (error, resultado). Si alguno de
     * los parámetros es incorrecto error tendrá el mensaje
     */
    libro.actualizar = function(nConfig, callback){
        const con = mysql.createConnection({
            host: global.gConfig.db.host,
            user: global.gConfig.db.usuario,
            password: global.gConfig.db.password,
            database: global.gConfig.db.nombre,
        });
        //validamos que los parámetros pasados tengan un valor válido
        if(nConfig.nombre && nConfig.nombre.trim().length == 0) error = "Nombre inválido";
        if(nConfig.descripcion && nConfig.descripcion.trim().length == 0) error = "Descripción inválida";
        if(nConfig.url && nConfig.url.trim().length == 0) error = "URL inválida";

        if(error){
            callback(error, null);
            return;
        }

        //self es una copia de este libro + propiedades de nConfig
        self = Object.assign(this,nConfig);
        var ahora = moment().format("YYYY-MM-DD HH:mm:ss");
        self.modificada = ahora;
        var sql = "UPDATE "+_tabla+" SET name=?, description=?, url=?, modified=? WHERE id = ?";
        
        rpta = con.execute(sql, [self.nombre, self.descripcion, self.url, self.modificada, self.id], callback);
    }

    libro.eliminar = function(callback){
        //pdte implementar
    }
    return libro;
}

/**
 * @description Retorna el último error registrado en este Repositorio de Libros
 * @returns {string} mensaje de error
 */
repositorioLibros.prototype.getUltimoError = function(){
    return this.error;
}

module.exports = repositorioLibros;