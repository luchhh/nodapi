const {URL} = require('url');

var iniVar = "ini"; //el nombre de la variable que tiene la página actual

/**
 * @description Paginador HATEOAS para construir links a páginas siguientes
 * y anteriores
 * @param {Object} req el objecto request recibido de HTTP Server
 * 
 * */
var paginador = function(req) {
    this.req = req;
}

/**
 * @description Devuelve la URL modificada para ver la siguiente pagina
 * @returns {string} url
 * 
 */        
paginador.prototype.next = function(){
        var url = new URL(this.req.url, "http://example.com/");
        var ini = 1; //número página por defecto
        var iniParam = url.searchParams.get(iniVar);
        if(iniParam){
            ini = parseInt(iniParam);
            ini = (Number.isInteger(ini) && ini>0)? ini: 1;
        }

        var iniNext = ++ini;
        //pdte calcular si existen elementos realmente en la siguiente pagina
        //necesario nro de filas en tabla

        url.searchParams.set(iniVar, iniNext);
        var nuevaUrl = url.pathname+url.search;
        return nuevaUrl;
}

/**
 * @description Devuelve la URL modificada para ver la pagina anterior
 * @returns {string} url
 * 
 */
paginador.prototype.prev = function(){
        var url = new URL(this.req.url, "http://example.com/");
        var ini = 1; //número página por defecto
        var iniParam = url.searchParams.get(iniVar);
        if(iniParam){
            ini = parseInt(iniParam);
            ini = (Number.isInteger(ini) && ini>0)? ini: 1;
        }

        var iniPrev = --ini;
        if(iniPrev<1) return null;

        url.searchParams.set(iniVar, iniPrev);
        var nuevaUrl = url.pathname+url.search;
        return nuevaUrl;
}

/**
 * @description Devuelve un objeto con la paginación según la convención HATEOAS
 * @returns {Object[]} Array 
 *      [
 *       0 : {rel: self, href: self}, 
 *       1 : {rel: next, href: next},  
 *       2 : {rel: prev, href: prev}
 *      ] 
 * en donde self hace referencia a la URL visitada actualmente, 
 * next a la página siguiente y prev a la página anterior.
 * Si estamos en la página 1 entonces prev no se muestra
 * 
 */
paginador.prototype.getLinks = function (){
        var links = [];
        var next = this.next();
        var prev = this.prev();
        links.push({
            rel: "self",
            href: this.req.url
        });
        if(next){
            links.push({
                rel: "next",
                href: next
            });
        }
        if(prev){
            links.push({
                rel: "prev",
                href: prev
            });
        }
        return links;
}

module.exports = paginador;
