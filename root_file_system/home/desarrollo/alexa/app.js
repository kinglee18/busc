const stg_clear = require('./stages/clear');
const stg_where = require('./stages/wheres');
const stg_neg = require('./stages/negocios');

let json = {
    texto:null,
    where: {},
    neg: {},
    claro: {},
    blog: {},
    pln: {},
    ruta: null
}

exports.search = function(texto,lat,lng) {
    let promesa = new Promise((resolve,reject) => {

        stg_clear.cls(texto).then((resp) => {
            console.log('##########################=>>Despues del Limpiar');
            json.texto = resp;
            json.old = resp;
            console.log(JSON.stringify(json));
            return stg_where.where(json.texto);
        }).then((resp) => {
            console.log('##########################=>>Despues de Bsucar Wheres');
            resp.ub.lat = lat;
            resp.ub.lng = lng;
            console.log(JSON.stringify(resp,undefined,2));
            json.texto = resp.texto;
            json.where = resp.ub;
            return stg_neg.neg(json.texto);
        }).then((resp) => {
            console.log('##########################=>>Despues de Bsucar Negocios');
            json.neg = resp;
            resolve(json);
        });

    });

    return promesa;
}