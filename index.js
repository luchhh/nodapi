var http = require('http');
var ruteador = require('./router');
const config = require('./config.json');
global.gConfig = config;

// Creamos el servidor
var server = http.createServer(function (req, res) {
  ruteador.procesar(req, res);
});

// Iniciar servidor
server.listen(global.gConfig.server.port);
console.log('Servidor escuchando en puerto ',global.gConfig.server.port);