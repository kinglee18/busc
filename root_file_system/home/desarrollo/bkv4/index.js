const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const proceso = require('./app');
const pl = require('./http/places');
const elastic = require('./elastic/run');
const cmt = require('./http/comments');
const home = require('./elastic/home');
const auto = require('./http/autocomplete');
const clear = require('clear');
const clima = require('./http/clima');


app.get('/',(req,res) => {
    res.status(200).send({
        msj: 'Hola Mundo'
    });
})

io.on('connection', function(socket) {

    socket.on('home',(data) => {
        home.inicio().then((resp) => {
            //console.log(resp);
            socket.emit('home-resp',resp);
        })
    })

    socket.on('autocomplete',(data) => {
        auto.autocomplete(data.texto).then((resp) => {
            socket.emit('autocomplete-resp',{
                info:resp
            })
        })
    })

    socket.on('search',(data) => {
        clear();
        proceso.search(data.tx,data.lat,data.lng).then((json) => {
            let lista = [];
            socket.emit('search-json',{info:json});
            elastic.claro_shop(json.claro.marcas,json.claro.ctg,json.claro.bn,json.claro.price,json.claro.tx).then((resp) => {
                socket.emit('search-claro_shop',{info:resp});
            });
            pl.getPlaces(json).then((resp) => {
                //console.log(resp);
                socket.emit('search-places',{info:resp});
            })
            elastic.blog(json.texto,json.blog.tags,json.blog.ctg,json.where).then((resp) => {
                socket.emit('search-blog',{info:resp});
            })
            elastic.negocios(json.neg.ctg,json.neg.pys,json.neg.bn,json.neg.hrs,json.neg.pay,json.where).then((resp) => {
                
                for(let op of resp) lista.push(op.listadoid);
                socket.emit('search-negocios',{info:resp});
                return cmt.allComments(lista);
            }).then((resp) => {
                socket.emit('search-comments',{info:resp});
            })

            clima.getClima(json.where).then((resp) => {
                socket.emit('search-clima',{info:resp});
            })
            
            
            
            
            
        })
    })

})


http.listen(3008, function(){
    console.log('listening on *:3000');
});