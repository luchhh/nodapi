controlador = require("./controller");

console.log("inicializando ruteador");
var ruteador = {};

//aquí ir asociando URLs y Controllers
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

ruteador.procesar = function(req, res){
    console.log("sobre la base de req llamar al controller adecuado");
    url = req.url;
    for (let ruta of rutas) {
        console.log("URL visitada ",url," ruta evaluada ",ruta.url, "resultado de regex ",url.search(ruta.url));
        if(req.method == ruta.metodo && url.search(ruta.url)!=-1){
            ruta.controlador(req,res);
            break;
        }
    }
}

module.exports = ruteador;