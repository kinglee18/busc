const elastic = require('../elastic/analyzer_where');
const maps = require('../maps/address');
const cls = require('./clear');
const gram = require('../info/gramatica');


exports.where = function (initText) {

    let address = {
        state: null,
        city: null,
        colony: null,
        street: null
    };

    return new Promise((resolve, reject) => {
        let nv = findPrepLug(initText);
        if (nv.lug) {
            maps.search(nv.lug).then((address) => {
                resolve({
                    address,
                    newSearchTerm: address ? nv.texto : initText
                })
            })
        }
        else {
            resolve({
                newSearchTerm: initText
            });
        }

    });
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
        lug: lug
    };
}