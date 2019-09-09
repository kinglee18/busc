const stg_clear = require('./analyzer/clear');
const ub = require('./analyzer/wheres');
const negocios = require('./analyzer/negocios');
const clr1 = require('./analyzer/claro_shop');
const bg = require('./analyzer/blog');
const pln = require('./analyzer/pln');

const prob = require('./analyzer/prob');


let json = {
    texto: null,
    where: {},
    claro: {},
    blog: {},
    pln: {}
}

exports.analisys = function (texto, lat = null, lng = null) {

    return new Promise((resolve, reject) => {

        stg_clear.cls(texto).then((resp) => {
            json.texto = resp;
            json.old = resp;
            return pln.pln(json.texto);
        }).then((resp) => {
            json.pln = resp;
            json.texto = resp.texto;
            return ub.where(json.texto);
        }).then((resp) => {
            resp.ub.lat = lat;
            resp.ub.lng = lng;
            json.newSearchTerm = resp.texto;
            json.location = resp.ub;
            json.schedule = json.pln.hrs;
            json.payments = json.pln.pay;
            return clr1.claro_shop(json.newSearchTerm);
        }).then((resp) => {
            resp.price = json.pln.price;
            resp.desc = json.pln.desc;
            json.claro = resp
            return bg.blog(json.newSearchTerm);
        }).then((resp) => {
            json.blog = resp
            resolve(json);
        });

    });
}

