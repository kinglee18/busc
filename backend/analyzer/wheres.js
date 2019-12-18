const maps = require('../services/maps');
const cls = require('./clear');
const gram = require('../info/gramatica');

/**
 * @param {string} searchTerm 
 */
exports.where = function (searchTerm) {

    return new Promise((resolve, reject) => {
        let nv = findPrepLug(searchTerm);
        maps.search(nv.place,  searchTerm).then((address) => {
            if (!nv.place){
                resolve({ address, newSearchTerm: extractPlace(address, searchTerm) })
            }
            resolve({ address, newSearchTerm: address ? nv.texto : searchTerm })
        });
    });
}
/**
 * 
 * @param {object} place 
 * @param {string} searchTerm 
 */
function extractPlace(place, searchTerm){
    for( let term in place)
    {   
        if(place[term])
        {
            searchTerm = searchTerm.toLowerCase().replace(place[term].toLowerCase(), " ");

        }
    }
    return searchTerm = searchTerm.replace(/\s+/g, " ").trim();
}

function sust(a, b) {
    a = a.replace(b, '');
    a.trim();
    return a;
}

function findPrepLug(tx) {
    let texto = null;
    let lug = null;
    for (let op of gram.prep_lug) {
        if (op.length <= tx.length) {
            let reg = new RegExp("\\b" + op + "\\b");
            let matches = tx.match(reg);
            if (matches) {
                let nv = matches[0];
                let palabras = nv.split(' ');
                let pos = palabras[0];
                let palabrasTexto = tx.split(' ');
                let index = palabrasTexto.findIndex((ele) => {
                    return ele == pos;
                })
                let arrTxt = palabrasTexto.splice(index);
                lug = arrTxt.join(' ');
                texto = sust(tx, lug).trim();
                texto = cls.clearStopWord(texto);
                lug = sust(lug, nv).trim();
                break;
            }
        }
    }

    return {
        texto: texto,
        place: lug
    };
}