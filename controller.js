const { URL } = require('url');
const jsonBody = require("body/json")
RepositorioLibros = require ("./models/repositorio_libros");

var controller = {};

controller.getLibroPorId = function(req, res){
    console.log("Buscamos un libro");
    path = req.url.split('/');
    var id = (path[path.length-1].length > 0)? path[path.length-1] : path[path.length-2];

    rl = new RepositorioLibros();
    rl.getPorId(id, function(error, libro){
        if (!libro) {
            res.writeHead(404, {'Content-Type': 'application/json; charset=UTF-8'});
            res.write(JSON.stringify({"msg":"Libro no encontrado "}));
            res.end();
            return;
        }else{
            res.writeHead(200, {'Content-Type': 'application/json; charset=UTF-8'});
            res.write(JSON.stringify({"data":libro}));
            res.end();
        }
    });
}

controller.getLibros = function(req, res){
    
    console.log("Aqui buscamos el repositorio y devolvemos varios libros");
    var url = new URL(req.url, "http://foo.com/");
    config = {}; //objeto con los parámetros de búsqueda
    for(var par of url.searchParams.entries()) {
        config[par[0]] = par[1];
     }

     rl = new RepositorioLibros();
     rl.buscar(config, function(error, libros){
        if (libros.length == 0) {
            res.writeHead(404, {'Content-Type': 'application/json; charset=UTF-8'});
            res.write(JSON.stringify({"msg":"Ningún libro encontrado "}));
            res.end();
            return;
        }else{
            res.writeHead(200, {'Content-Type': 'application/json; charset=UTF-8'});
            libros.forEach(function(libro){
                libro.links = {
                    href: "/libros/"+libro.id,
                    rel: "libros",
                    type: "GET"
                }
                delete libro.descripcion;
                delete libro.url;
            });
            res.write(JSON.stringify({"data":{"libros":libros}}));
            res.end();
        }
     });
}

controller.addLibro = function(req, res){
    console.log("Añadiendo un libro");
    jsonBody(req, res, function (jErr, body) {
        // jErr is probably an invalid json error
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
                    res.writeHead(400, {'Content-Type': 'application/json; charset=UTF-8'});
                    res.write(JSON.stringify({"msg":"Error al insertar en la base de datos: "+mErr}));
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

controller.updateLibro = function(req, res){
    //config = qs.parse(req.url);
    console.log("Aqui actualizamos un libro");
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
                res.writeHead(404, {'Content-Type': 'application/json; charset=UTF-8'});
                res.write(JSON.stringify({"msg":"Libro no encontrado "}));
                res.end();
                return;
            }else{
                libro.actualizar(body.data, function(mErr, result){
                    if (mErr){
                        res.writeHead(400, {'Content-Type': 'application/json; charset=UTF-8'});
                        res.write(JSON.stringify({"msg":"Error al actualizar en la base de datos: "+mErr}));
                        res.end();
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