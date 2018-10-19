var mysql = require("mysql");

var pools = {};

var db = {};

/**
 * @description Retorna un pool con 50 conexiones asociado a una URL
 * @param {string} url de conexión a base de datos
 */
db.pool = function(url){

    if(!pools[url]){
        pools[url] = mysql.createPool(url+"?connectionLimit=50");
    }
    return pools[url];
}

module.exports = db;