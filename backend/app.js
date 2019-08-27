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
        let old = null;

        stg_clear.cls(texto).then((resp) => {
            console.log('##########################=>>Despues del Limpiar');
            json.texto = resp;
            json.old = resp;
            console.log(json.texto);
            return pln.pln(json.texto);
        }).then((resp) => {
            console.log('##########################=>>Despues del Natural Lenguaje');
            json.pln = resp;
            console.log(json.pln);
            json.texto = resp.texto;
            return ub.where(json.texto);
        }).then((resp) => {
            console.log('##########################=>>Despues de Bsucar Wheres');
            resp.ub.lat = lat;
            resp.ub.lng = lng;
            console.log(JSON.stringify(resp, undefined, 2));
            json.texto = resp.texto;
            json.where = resp.ub;
            return negocios.neg(json.texto);
        }).then((resp) => {
            console.log('##########################=>>Despues de Bsucar Negocios');
            resp.hrs = json.pln.hrs;
            resp.pay = json.pln.pay;
            console.log(JSON.stringify(resp));
            json.neg = resp;
            return clr1.claro_shop(json.texto);
        }).then((resp) => {
            console.log('##########################=>>Despues de Bsucar Claro Shop');
            resp.price = json.pln.price;
            resp.desc = json.pln.desc;
            console.log(JSON.stringify(resp));
            json.claro = resp
            return bg.blog(json.texto);
        }).then((resp) => {
            console.log('##########################=>>Despues de Bsucar Blog');
            json.blog = resp
            console.log(JSON.stringify(resp));
            json.ruta = prob.calcPrio(json);
            resolve(json);
        });

    });
    return promesa;
}

