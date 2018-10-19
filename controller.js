const { URL } = require('url');
const jsonBody = require("body/json")

Paginador = require("./paginador");
RepositorioLibros = require ("./models/repositorio_libros");

var controller = {};

/**
 * @description sobre la base del objeto request busca un libro por su ID
 * y envía una respuesta al cliente
 */
controller.getLibroPorId = function getLibroPorId(req, res){
    console.log("Buscando un libro");
    path = req.url.split('/');
    var id = (path[path.length-1].length > 0)? path[path.length-1] : path[path.length-2];

    rl = new RepositorioLibros();
    rl.getPorId(id, function(error, libro){
        if (!libro) {
            if(error.sqlMessage){
                console.error(error.sqlMessage);
                res.writeHead(500, {'Content-Type': 'application/json; charset=UTF-8'});
                res.write(JSON.stringify({"msg":"Error de conexión con la base de datos"}));
                res.end();
            }else{
                res.writeHead(404, {'Content-Type': 'application/json; charset=UTF-8'});
                res.write(JSON.stringify({"msg":"Libro no encontrado"}));
                res.end();
            }
        }else{
            res.writeHead(200, {'Content-Type': 'application/json; charset=UTF-8'});
            res.write(JSON.stringify({"data":libro}));
            res.end();
        }
    });
}

/**
 * @description sobre la base del objeto request busca varios libros según parámetros
 * y envía una respuesta al cliente
 */
controller.getLibros = function getLibros(req, res){
    
    console.log("Buscando el repositorio y devolviendo varios libros");
    var url = new URL(req.url, "http://example.com/");
    var config = {}; //objeto con los parámetros de búsqueda
    for(var par of url.searchParams.entries()) {
        config[par[0]] = par[1];
    }

    rl = new RepositorioLibros();
    
    rl.buscar(config, function(error, libros){

        if(error){
            console.error(error.sqlMessage);
            res.writeHead(500, {'Content-Type': 'application/json; charset=UTF-8'});
            res.write(JSON.stringify({"msg":"Error de conexión con la base de datos"}));
            res.end();
            return;
        }

        if (libros.length == 0) {
            res.writeHead(404, {'Content-Type': 'application/json; charset=UTF-8'});
            res.write(JSON.stringify({"msg":"Ningún libro encontrado "}));
            res.end();
        }else{
            res.writeHead(200, {'Content-Type': 'application/json; charset=UTF-8'});
            libros.forEach(function(libro){
                libro.links = {
                    href: "/libros/"+libro.id,
                    rel: "libros",
                    type: "GET"
                }
                delete libro.descripcion; //el API de búsqueda de libros no incluye descripción
                delete libro.url; //ni URL, así que eliminamos estas propiedades del objeto
            });
            paginador = new Paginador(req)
            rpta = {"data":
                        {
                            "libros":libros,
                            "links": paginador.getLinks()
                        }
                    }
            res.write(JSON.stringify(rpta));
            res.end();
        }
    });
}

/**
 * @description sobre la base del objeto request crea un nuevo libro según body
 * y envía una respuesta al cliente
 */
controller.addLibro = function addLibro(req, res){
    console.log("Añadiendo un libro");
    jsonBody(req, res, function (jErr, body) {
        // jErr es probablemente un error JSON
        if (jErr) {
            res.writeHead(500, {'Content-Type': 'application/json; charset=UTF-8'});
            res.write(JSON.stringify({"msg":"Error en data. JSON mal formado"}));
            res.end();
            return;
        }
        rl = new RepositorioLibros();
        nl = rl.crearLibro(body.data);
        if(nl){
            nl.insertar(function(mErr, result){
                
                if (mErr){
                    console.error(mErr.sqlMessage);
                    res.writeHead(500, {'Content-Type': 'application/json; charset=UTF-8'});
                    res.write(JSON.stringify({"msg":"Error de conexión con la base de datos"}));
                    res.end();
                }else{
                    res.writeHead(200, {'Content-Type': 'application/json; charset=UTF-8'});
                    res.write(JSON.stringify({"data":nl}));
                    res.end();
                }
            });
        }else{
            res.writeHead(400, {'Content-Type': 'application/json; charset=UTF-8'});
            res.write(JSON.stringify({"msg":rl.getUltimoError()}));
            res.end();
        }
    });
}

/**
 * @description sobre la base del objeto request busca un libro y actualiza sus propiedades 
 * según body. Luego envía una respuesta al cliente
 */
controller.updateLibro = function updateLibro(req, res){
    console.log("Actualizando un libro");
    jsonBody(req, res, function (jErr, body) {
        if (jErr) {
            res.writeHead(500, {'Content-Type': 'application/json; charset=UTF-8'});
            res.write(JSON.stringify({"msg":"Error en data. JSON mal formado"}));
            res.end();
            return;
        }
        path = req.url.split('/');
        var id = (path[path.length-1].length > 0)? path[path.length-1] : path[path.length-2];

        rl = new RepositorioLibros();
        rl.getPorId(id, function(error, libro){
            if (!libro) {
                if(error && error.sqlMessage){
                    console.error(error.sqlMessage);
                    res.writeHead(500, {'Content-Type': 'application/json; charset=UTF-8'});
                    res.write(JSON.stringify({"msg":"Error de conexión con la base de datos"}));
                    res.end();
                }else{
                    res.writeHead(404, {'Content-Type': 'application/json; charset=UTF-8'});
                    res.write(JSON.stringify({"msg":"Libro no encontrado "}));
                    res.end();
                }
            }else{
                libro.actualizar(body.data, function(mErr, result){

                    if (mErr){
                        if(mErr.sqlMessage){
                            console.error(mErr.sqlMessage);
                            res.writeHead(500, {'Content-Type': 'application/json; charset=UTF-8'});
                            res.write(JSON.stringify({"msg":"Error de conexión con la base de datos"}));
                            res.end();
                        }else{
                            //error producido por parámetros incorrectos
                            res.writeHead(400, {'Content-Type': 'application/json; charset=UTF-8'});
                            res.write(JSON.stringify({"msg":"Parámetros incorrectos: "+mErr}));
                            res.end();
                        }
                    }else{
                        res.writeHead(200, {'Content-Type': 'application/json; charset=UTF-8'});
                        res.write(JSON.stringify({"data":libro}));
                        res.end();
                    }
                });
            }
        });
    });
}

module.exports = controller;