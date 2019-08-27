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
const bodyParser = require('body-parser')
const check = require('./config/check');
const config = require('./config');
const cors = require("cors");

app.use(cors());
app.use(bodyParser.json())

app.get('/node', (req, res) => {
    res.status(200).send({
        msj: 'Restringido API BK'
    });
})

app.post('/alexa', check.valid, (req, res) => {
    let data = req.body;
    if (req.status == 'OK') {
        proceso.search(data.tx, data.lat, data.lng).then((json) => {
            elastic.negocios(0, json.neg.ctg, json.neg.pys, json.neg.bn, json.neg.hrs, json.neg.pay, json.where).then((resp) => {
                res.send({
                    status: true,
                    info: json,
                    data: resp
                });
            });
        });
    }
    else {
        res.status(404).send({
            status: false,
            message: 'Error en la autentificacion'
        })
    }
})


app.get('/business', (req, res) => {
    let lista = [];
    proceso.search(req.query.searchTerm, parseFloat(req.query.lat), parseFloat(req.query.lng)).then((json) => {
        elastic.negocios(0, json.neg.ctg, json.neg.pys, json.neg.bn, json.neg.hrs, json.neg.pay, json.where).then((resp) => {
            for (let op of resp.info) lista.push(op.listadoid);
            res.status(200).send( resp)
        });
    })
});

io.on('connection', function (socket) {
    socket.on('home', (data) => {
        home.inicio().then((resp) => {
            //console.log(resp);
            socket.emit('home-resp', resp);
        })
    })

    socket.on('new-home', (data) => {
        home.inicio2().then((resp) => {
            socket.emit('home-resp', resp);
        })
    })

    socket.on('autocomplete', (data) => {
        auto.autocomplete(data.texto).then((resp) => {
            socket.emit('autocomplete-resp', {
                info: resp
            })
        })
    })

    socket.on('other-page', (data) => {
        let json = data.json;
        let lista = [];
        console.log(JSON.stringify(data));
        if (data.tipo == 'neg') {
            elastic.negocios(data.page, json.neg.ctg, json.neg.pys, json.neg.bn, json.neg.hrs, json.neg.pay, json.where).then((resp) => {

                for (let op of resp.info) lista.push(op.listadoid);
                socket.emit('search-negocios', resp);
                //return cmt.allComments(lista);
                //}).then((resp) => {
                //socket.emit('search-comments',{info:resp});
            })
        }
        else if (data.tipo == 'claro') {
            elastic.claro_shop(data.page, json.claro.marcas, json.claro.ctg, json.claro.bn, json.claro.price, json.claro.tx).then((resp) => {
                socket.emit('search-claro_shop', resp);
            });
        }
        else if (data.tipo == 'blog') {
            elastic.blog(data.page, json.texto, json.blog.tags, json.blog.ctg, json.where).then((resp) => {
                socket.emit('search-blog', resp);
            })
        }
    })

    socket.on('search', (data) => {
        clear();

        proceso.search(data.tx, data.lat, data.lng).then((json) => {
            let lista = [];
            socket.emit('search-json', { info: json });

            elastic.claro_shop(0, json.claro.marcas, json.claro.ctg, json.claro.bn, json.claro.price, json.claro.tx).then((resp) => {
                socket.emit('search-claro_shop', resp);
            });
            pl.getPlaces(json).then((resp) => {
                //console.log(resp);
                socket.emit('search-places', { info: resp });
            })
            elastic.blog(0, json.texto, json.blog.tags, json.blog.ctg, json.where).then((resp) => {
                socket.emit('search-blog', resp);
            })
            elastic.negocios(0, json.neg.ctg, json.neg.pys, json.neg.bn, json.neg.hrs, json.neg.pay, json.where).then((resp) => {

                for (let op of resp.info) lista.push(op.listadoid);
                socket.emit('search-negocios', resp);
            })

            clima.getClima(json.where).then((resp) => {
                socket.emit('search-clima', { info: resp });
            });
        })
    })

    socket.on('app-alexa', (data) => {
        proceso.search(data.tx, data.lat, data.lng).then((json) => {
            elastic.negocios(0, json.neg.ctg, json.neg.pys, json.neg.bn, json.neg.hrs, json.neg.pay, json.where).then((resp) => {
                socket.emit('app-alexa-resp', {
                    info: json,
                    data: resp
                });
            });
        });
    })

})

/**
 * @param {port} 
 */
http.listen(port = 3008, function () {
    const envName = process.argv.slice(2)[0] || 'prod';
    process.env = Object.assign(process.env, config[envName])
    console.log("servidor corriendo en ambiente ", envName);
});