const ub = require('./analyzer/wheres');
let json = {}

exports.analisys = function (searchTerm) {
    return new Promise((resolve, reject) => {
        searchTerm = searchTerm.replace(/-/g, " ");
        ub.where(searchTerm).then((resp) => {
            json.newSearchTerm = resp.newSearchTerm;
            json.location = resp.address;
            resolve(json);
        });
    });
}