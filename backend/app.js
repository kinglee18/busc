const ub = require('./analyzer/wheres');


/**
 * @param {string} searchTerm
 */
exports.analisys = function (searchTerm) {
    return new Promise((resolve, reject) => {
        if (searchTerm && searchTerm.length > 0) {
            ub.where(searchTerm).then((resp) => {
                resolve(
                    {
                        newSearchTerm: resp.newSearchTerm,
                        location: resp.address
                    }
                );
            });
        } else {
            resolve({
                newSearchTerm: ""
            });
        }
    });
}