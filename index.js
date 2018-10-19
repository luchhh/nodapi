global.gConfig = require('./config.json');
var http = require('http');
var ruteador = require('./router');

// Creamos el servidor
var server = http.createServer(function (req, res) {
  res.on('error', (err) => {
    console.error("Error enviando respuesta: "+err);
  });

  ruteador.procesar(req, res);
});

// Iniciar servidor
server.listen(global.gConfig.server.port);
console.log('Servidor escuchando en puerto ',global.gConfig.server.port);