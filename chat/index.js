const express = require('express');  
const app = express();  
const server = require('http').createServer(app);  
const io = require('socket.io')(server);

//app.use(express.static(__dirname + '/bower_components'));  
app.get('/node', function(req, res,next) {  
    res.send({
        msj: 'Permiso Denegado.'
    })
});

module.exports.io = io;
require('./sockets/socket')

server.listen(3004,() => {
    console.log('Corriendo Servidor');
});  
