const maps = require('../services/maps');
const gram = require('../info/gramatica');
const businessApi = require('../elastic/run.js')

/**
 * @param {string} searchTerm 
 */
exports.where = function (searchTerm) {

    return new Promise((resolve, reject) => {
        let nv = findPrepLug(searchTerm);
        if (!nv.place) {
            businessApi.getMeaningfulTerm(searchTerm).then(response => {
                if (response.hits.total.value >= 1) {
                    resolve({ address: undefined, newSearchTerm: searchTerm })
                } else {
                    maps.search(nv.place, searchTerm).then((address) => {
                        resolve({ address, newSearchTerm: extractPlace(address, searchTerm) })
                    });
                }
            }).catch(err=> {
                console.error(err);
            })
        } else {
            maps.search(nv.place, searchTerm).then((address) => {
                resolve({ address, newSearchTerm: address ? nv.texto : searchTerm })
            });
        }
    });
}
/**
 * 
 * @param {object} place 
 * @param {string} searchTerm 
 */
function extractPlace(place, searchTerm) {
    for (let term in place) {
        if (place[term]) {
            searchTerm = searchTerm.toLowerCase().replace(place[term].toLowerCase(), " ");
        }
    }
    ["cdmx", "ciudad de mexico"].map(word => {
        searchTerm = searchTerm.replace(word, " ").trim();
    });
    return searchTerm = searchTerm.replace(/\s+/g, " ").trim();
}

function findPrepLug(tx) {
    tx = tx.toLowerCase();
    for (let op of gram.prep_lug) {
        let reg = new RegExp(`(?<what>.+)\\s${op}\\s(?<where>.+)`);
        let groups = reg.exec(tx);
        if (groups) {
            return {
                texto: groups.groups.what,
                place: groups.groups.where
            };
        }
    }
    return {};
}