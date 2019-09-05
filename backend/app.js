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
    neg: {},
    claro: {},
    blog: {},
    pln: {},
    ruta: null
}

exports.search = function (texto, lat = null, lng = null) {

    let promesa = new Promise((resolve, reject) => {

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
            json.texto = resp.texto;
            json.where = resp.ub;
            return negocios.neg(json.texto);
        }).then((resp) => {
            resp.hrs = json.pln.hrs;
            resp.pay = json.pln.pay;
            json.neg = resp;
            json.neg.bn = json.texto;
            return clr1.claro_shop(json.texto);
        }).then((resp) => {
            resp.price = json.pln.price;
            resp.desc = json.pln.desc;
            json.claro = resp
            return bg.blog(json.texto);
        }).then((resp) => {
            json.blog = resp
            json.ruta = prob.calcPrio(json);
            resolve(json);
        });

    });
    return promesa;
}

