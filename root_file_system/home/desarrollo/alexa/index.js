const app = require('express')();
const http = require('http').Server(app);
const bodyParser = require('body-parser');
const check = require('./check');
const proceso = require('./app');
const elastic = require('./elastic/run');

app.use(bodyParser.json())


app.get('/',check.valid,(req,res) => {
    res.status(200).send({
        msj: 'Servicio de Alexa Amazon'
    });
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

