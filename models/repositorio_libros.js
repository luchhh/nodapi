const mysql = require("mysql2");
const moment = require('moment');

/***
 * libros.getPorId(id)   --- NULL si no hay nada. Arma el objeto config y lo pasa a la factoria
 * libros.buscar(config) --- un array de objetos, vacío si no encuentra nada
 * libros.crearLibro(config) --- factoria NULL si falla
 * libros.libro.insertar() //no hace falta hacer ninguna validacion, objeto confiable
 * libros.libro.actualizar(config) //solo validar config
 * libros.libro.eliminar() //solo validar que ID esté seteado internamente
 * 
 */
var repositorioLibros = function() {

//nombre de la tabla en BD
var tabla = "libro";

/** retorna el libro con Id, NULL si no existe*/
var getPorId = function(id, callback){
    id = id.trim();
    const con = mysql.createConnection({
        host: global.gConfig.db.host,
        user: global.gConfig.db.usuario,
        password: global.gConfig.db.password,
        database: global.gConfig.db.nombre,
    });

    var sql = "SELECT * FROM libro WHERE id = ?";

    rpta = con.execute(sql, [id],
        function(err, results, fields) {
            if(results.length==0){
                callback("Libro no encontrado "+err, null);
            }else{
                var config = {};
                config.nombre = results[0].name;
                config.descripcion = results[0].description;
                config.url = results[0].url;
                config.creada = results[0].created;
                config.modificada = results[0].modified;
                config.id = id;
                var nl=crearLibro(config);
                if(nl){
                    callback(null, nl);
                }else{
                    callback(getUltimoError(), null);
                }
            }
        });
}

/** retorna un array de libros conforme a config, 
 * array vacío si no hay ningún resultado */
var buscar = function(config, callback){
    const con = mysql.createConnection({
        host: global.gConfig.db.host,
        user: global.gConfig.db.usuario,
        password: global.gConfig.db.password,
        database: global.gConfig.db.nombre,
    });

    var sql = "SELECT id, name, description, url FROM libro WHERE 1";
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
    
    var libros = [];
    rpta = con.execute(sql, params,
        function(err, results, fields) {
            if(results.length==0){
                callback("Ningún libro encontrado "+err, libros);
            }else{
                results.forEach(
                    function(fila) {
                        var config = {};
                        config.nombre = fila.name;
                        config.descripcion = fila.description;
                        config.url = fila.url;
                        config.creada = fila.created;
                        config.modificada = fila.modified;
                        config.id = fila.id;
                        var nl=crearLibro(config);
                        
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
 * Factoria de libros. Para ser llamado así nuevoLibro = libros.crearLibro(config)
 * @param {nombre, descripcion} config 
 * @returns nuevoLibro 
 */
var crearLibro = function(config){
    
    /*propiedades del objeto libro
    var id;
    var nombre;
    var descripcion;
    var url;
    var creada;
    var modificada;
    ;*/
    var error;

    var libro = Object.assign({},config);
    
    if(libro.id){
        libro.id = parseInt(libro.id);
        if(!Number.isInteger(libro.id)) error = "ID debe ser entero";
    }
    if(!libro.nombre || libro.nombre.trim().length == 0) error = "Nombre inválido";
    if(!libro.descripcion || libro.descripcion.trim().length == 0) error = "Descripción inválida";
    if(!libro.url || libro.url.trim().length == 0) error = "URL inválida";
    //if(nl.creada && !Number.isDate(nl.creada)) error = "ID debe ser entero";
    //if(nl.modificada && !Number.isDate(nl.modificada)) error = "ID debe ser entero";

    if(error){
        this.error = error; //this hace referencia a repositorioLibros
        return null;
    }

    libro.insertar = function(callback){
        const con = mysql.createConnection({
            host: global.gConfig.db.host,
            user: global.gConfig.db.usuario,
            password: global.gConfig.db.password,
            database: global.gConfig.db.nombre,
        });

        var ahora = moment().format("YYYY-MM-DD HH:mm:ss");
        this.creada = ahora;
        this.modificada = ahora;
        var sql = "INSERT INTO libro (id, name, description, url, created) VALUES (NULL,?,?,?,?)";
        
        rpta = con.execute(sql, [this.nombre, this.descripcion, this.url, this.creada], callback);
    }

    libro.actualizar = function(nConfig, callback){
        const con = mysql.createConnection({
            host: global.gConfig.db.host,
            user: global.gConfig.db.usuario,
            password: global.gConfig.db.password,
            database: global.gConfig.db.nombre,
        });
        if(!nConfig.nombre || nConfig.nombre.trim().length == 0) error = "Nombre inválido";
        if(!nConfig.descripcion || nConfig.descripcion.trim().length == 0) error = "Descripción inválida";
        if(!nConfig.url || nConfig.url.trim().length == 0) error = "URL inválida";
        if(error){
            callback(error, null);
            return;
        }
        this.nombre = nConfig.nombre;
        this.descripcion = nConfig.descripcion;
        this.url = nConfig.url;
        var ahora = moment().format("YYYY-MM-DD HH:mm:ss");
        this.modificada = ahora;
        var sql = "UPDATE libro SET name=?, description=?, url=?, modified=? WHERE id = ?";
        
        rpta = con.execute(sql, [this.nombre, this.descripcion, this.url, this.modificada, this.id], callback);
    }

    libro.eliminar = function(){

    }
    return libro;
}

var getUltimoError = function(){
    return this.error;
}

return{
    getPorId: getPorId,
    buscar: buscar,
    crearLibro: crearLibro,
    getUltimoError: getUltimoError,    
}

};

module.exports = repositorioLibros;