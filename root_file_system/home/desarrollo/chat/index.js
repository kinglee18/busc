const express = require('express');  
const app = express();  
const server = require('http').createServer(app);  
const io = require('socket.io')(server);

//app.use(express.static(__dirname + '/bower_components'));  
app.get('/chat', function(req, res,next) {  
    res.send({
        msj: 'Permiso Denegado. La policia llegara en 20 minutos.'
    })
});

module.exports.io = io;
require('./sockets/socket')

server.listen(3004,() => {
    console.log('Corriendo Servidor');
});  
