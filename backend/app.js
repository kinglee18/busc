const stg_clear = require('./analyzer/clear');
const ub = require('./analyzer/wheres');
const pln = require('./analyzer/pln');

let json = {}

exports.analisys = function (texto) {

    return new Promise((resolve, reject) => {

        stg_clear.cls(texto).then((parcedText) => {
            return pln.pln(parcedText);
        }).then((pln) => {
            json.pln = pln;
            return ub.where(pln.texto);
        }).then((resp) => {
            json.newSearchTerm = resp.newSearchTerm;
            json.location = resp.address;
            json.schedule = json.pln.hrs;
            json.price = json.pln.price;
            resolve(json);
        });
    });
}

