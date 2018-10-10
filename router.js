controlador = require("./controller");

console.log("Inicializando ruteador");
var ruteador = {};

//array que asocia rutas y controladores a ser llamados
var rutas = [
    {   url: "^/libros($|/$|\\?|/\\?)", ///libros/
        metodo: "GET",
        controlador: controlador.getLibros
    },
    {   url: "^/libros($|/$|\\?|/\\?)", ///libros/
        metodo: "POST",
        controlador: controlador.addLibro
    },
    {   url: "^/libros/[A-Za-z0-9_]+($|/$)", ///libros/{id}
        metodo: "GET",
        controlador: controlador.getLibroPorId
    },
    {   url: "^/libros/[A-Za-z0-9_]+($|/$)", ///libros/{id}
        metodo: "PUT",
        controlador: controlador.updateLibro
    }
];

/**
 * @description llama al controlador correspondiente según la URL definida en Req.
 * El controlador es invocado con los mismos objetos Request y Response del servidor
 * HTTP.
 * Se asume ya definida la asociación rutas/controladores en un array rutas.
 */
ruteador.procesar = function(req, res){
    url = req.url;
    for (let ruta of rutas) {
        if(req.method == ruta.metodo && url.search(ruta.url)!=-1){
            console.log("URL visitada ",url," llamando al controlador ",ruta.controlador.name);
            ruta.controlador(req,res);
            return;
        }
    }
    res.writeHead(405, {'Content-Type': 'application/json; charset=UTF-8'});
    res.write(JSON.stringify({"msg":"Operación no permitada"}));
    res.end();
}

module.exports = ruteador;