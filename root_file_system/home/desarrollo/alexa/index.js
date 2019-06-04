const app = require('express')();
const http = require('http').Server(app);
const bodyParser = require('body-parser');
const check = require('./check');
const proceso = require('./app');
const elastic = require('./elastic/run');
const home = require('./elastic/analyzer_where');
const cors = require("cors");

app.use(cors());
app.use(bodyParser.json())

app.get('/amazon', check.valid, (req, res) => {
    elastic.limt_neg().then((resp) => {
        if (resp) {
            console.log('Tamaño de Arreglo: ' + resp.length)
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

app.post('/all-amazon', check.valid, (req, res) => {

    let listados = 1592;
    let body = req.body;
    let page = parseInt(body.id);
    if (Number.isInteger(page) && page <= listados && req.status == 'OK') {
        elastic.limt_neg_2(page).then((resp) => {
            if (resp) {
                console.log('Tamaño de Arreglo: ' + resp.length)
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
    }
    else {
        res.status(401).send({
            msg: 'El valor de pagina o el token no es valido',
            data: []
        });
    }



})

app.post('/alexa-dev', check.valid, (req, res) => {
    let data = req.body;
    if (req.status == 'OK') {
        proceso.search(data.tx, data.lat, data.lng).then((json) => {
            if (json.texto && json.texto.length > 0) {
                elastic.negocios(0, json.neg.ctg, json.neg.pys, json.neg.bn, null, null, json.where).then((resp) => {
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

app.post("/search_business", check.valid, (req, res) => {
    if (req.status == "OK") {
        elastic
            .businessDetail(req.body.id)
            .then(data => {
                const business = data.hits.hits[0]._source;
                const statename = business.statename || business.state;
                let obj = {
                    name: business.bn,
                    address: `${business.fullstreet}, ${business.colony}, ${statename}, ${business.zip}`,
                    city: business.city,
                    category: business.Appearances.Appearance.categoryname
                };
                if (business.items.llg) {
                    obj.logo_url = `https://graficos.seccionamarilla.com.mx${
                        business.items.llg
                        }`;
                }
                if (business.phones.phone.length) {
                    obj.phone_number = business.phones.phone[0].number
                }

                res.status(200).send(obj);
            })
            .catch(error => {
                res.status(500).send();
            });
    } else {
        res.status(403).send({
            msg: "El token no es valido"
        });
    }
});


app.post('/sucursalPakmail', (req, res) => {
    home.getPakmailByText(req.body.busqueda).then(data => {
        data.hits.hits = data.hits.hits.map(item => {
            return item._source;
        });
        res.send(data.hits.hits)
    }).catch(error => {
        console.error(error);
    });
});

app.post('/sucursalesPakmailCoordinates', (req, res) => {
    home.getPakmailCoordinates(req.body.lon, req.body.lat).then(data => {
        data.hits.hits = data.hits.hits.map(item => {
            item._source.distance = item.sort[0];
            return item._source;
        });
        res.send(data.hits.hits)
    }).catch(error => {
        console.error(error);
    });
});

app.get('/sucursalesPakmail', (req, res) => {
    home.getPakmail().then(data => {
        data.hits.hits = data.hits.hits.map(item => {
            return item._source;
        });
        res.send(data.hits.hits)
    }).catch(error => {
        console.error(error);
    });
})


app.listen(3002, () => {
    console.log('Servidor Corriendo');
})

