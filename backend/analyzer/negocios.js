const sw = require('stopword')
const elastic = require('../elastic/analyzer_neg');
const cls = require('./clear');

exports.neg = function (searchTerm) {

    return new Promise((resolve, reject) => {
        Promise.all([
            elastic.query_neg_ctg(searchTerm),
            elastic.query_neg_pys(searchTerm)
        ]).then((resp) => {
            resolve({
                ctg: resp[0].hits.hits,
                pys: resp[1].hits.hits
            });
        })
    });
}

function findNegAll(tx, arr1, arr2) {
    let ctg = [];
    let pys = [];
    let bn = [];
    for (let op of arr1) {
        if (op._source.valor.length <= tx.length) {
            let nv = cls.onlyLetters(op._source.valor)
            let reg = new RegExp("\\b" + nv + "\\b");
            let matches = tx.match(reg);
            if (matches && !ctg.includes(nv)) {
                ctg.push(nv)
            }
        }
    }

    for (let op of arr2) {
        for (let op2 of op._source.relacion) {
            op2 = cls.onlyLetters(op2);
            let reg = new RegExp("\\b" + op2 + "\\b");
            let matches = tx.match(reg);
            if (matches && op2.length > 0) {
                if (!pys.includes(op2) && !ctg.includes(op2) && validWord(pys, op2)) pys.push(op2);
            }

        }
    }
    return {
        ctg: ctg,
        pys: pys
    }
}

function validWord(arreglo, nv) {
    let ind = true;
    let pos = nv.split(' ');
    for (let p of arreglo) {
        let ref = p.split(' ');
        for (let op of pos) {
            if (ref.includes(op)) ind = false;
        }

        if (!ind) break;
    }
    return ind;
}


function probCtg(a, b) {
    a = sw.removeStopwords(a, sw.es);
    b = sw.removeStopwords(a, sw.es);
    let palabras1 = Array.from(a);
    let palabras2 = Array.from(b);

}
