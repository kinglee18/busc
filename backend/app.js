const ub = require('./analyzer/wheres');
let json = {}

exports.analisys = function (texto) {
    return new Promise((resolve, reject) => {
        ub.where(texto).then((resp) => {
            json.newSearchTerm = resp.newSearchTerm;
            json.location = resp.address;
            resolve(json);
        });
    });
}