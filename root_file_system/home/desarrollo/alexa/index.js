const app = require('express')();
const http = require('http').Server(app);
const bodyParser = require('body-parser');
const check = require('./check');
const proceso = require('./app');
const elastic = require('./elastic/run');

app.use(bodyParser.json())


app.get('/amazon',check.valid,(req,res) => {
    elastic.limt_neg().then((resp) => {
        if(resp) {
            console.log('Tamaño de Arreglo: '+resp.length)
            res.status(200).send({
                msg: 'Servicio de Alexa Amazon',
                data: resp
            });
        }
        else {
            res.status(404).send({
                msg: 'Error 404',
                data: []
            });
        }
    })
})

app.post('/alexa-dev',check.valid,(req,res) => {
    let data = req.body;
    if(req.status == 'OK') {
        proceso.search(data.tx,data.lat,data.lng).then((json) => {
            if(json.texto && json.texto.length > 0) {
                elastic.negocios(0,json.neg.ctg,json.neg.pys,json.neg.bn,null,null,json.where).then((resp) => {
                    res.send({
                        status: true,
                        info: json,
                        data: resp
                    })
                })

            }
            else {
                res.send({
                    status: true,
                    info: json,
                    data: []
                })
            }
        });
    }
    else {
        res.status(404).send({
            status: false,
            message: 'Error en la autentificacion'
        })
    }
})

app.listen(3002,() => {
    console.log('Servidor Corriendo');
})

