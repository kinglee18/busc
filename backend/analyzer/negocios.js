const sw = require('stopword')
const elastic = require('../elastic/analyzer_neg');
const cls = require('./clear');

exports.neg = function(tx) {

    let promesa = new Promise((resolve,reject) => {
        //tx = cls.clearAllStopWords(tx);
        Promise.all([
            elastic.query_neg_ctg(tx),
            elastic.query_neg_pys(tx),
            elastic.query_neg_bn(tx)
        ]).then((resp) => {
            let data = findNegAll(tx,resp[0].hits.hits,resp[1].hits.hits,resp[2].hits.hits);
            resolve(data);
        })

    });

    return promesa;

}

function findNegAll(tx,arr1,arr2,arr3) {
    let ctg = [];
    let pys = [];
    let bn = [];
    //console.log('Entrando All: '+tx);
    //console.log('Tamaño CTG: '+arr1.length);
    for(let op of arr1) {
        //console.log('*************'+op._source.valor+'***********'+tx);
        if(op._source.valor.length <= tx.length) {
            let nv = cls.onlyLetters(op._source.valor)
            let reg = new RegExp("\\b"+nv+"\\b");
            let matches = tx.match(reg);
            if(matches && !ctg.includes(nv)) {
                ctg.push(nv)
            }
        }
        /*else {
            let reg = new RegExp("\\b"+tx+"\\b");
            let matches = op._source.valor.match(reg);
            console.log('Maches');
            console.log(matches);
            if(matches && !ctg.includes(op._source.valor)) {
                ctg.push(op._source.valor)
            }
        }*/
    }

    //console.log('Termino ARR1');
    //console.log(JSON.stringify(arr2));
    let txClear = cls.clearAllStopWords(tx);
    let palabras = txClear.split(' ');

    for(let op of arr2) {
        for(let op2 of op._source.relacion) {
            if(op2.length <= tx.length) {
                op2 = cls.onlyLetters(op2);
                let reg = new RegExp("\\b"+op2+"\\b");
                let matches = tx.match(reg);
                //console.log('matches: '+matches+'===>'+op2+'<===');
                if(matches && op2.length > 0) {
                    //console.log('('+op2+')=>>'+op._source.valor+'*************'+op2+'***********'+tx);
                    //if(ctg.length == 0) ctg.push(op._source.valor)
                    if(!pys.includes(op2) && !ctg.includes(op2) && validWord(pys,op2)) pys.push(op2);
                }
            }
            else {
                /*
                for(let p of palabras) {
                    if(op2.includes(p) && ctg.length == 0) {
                        console.log(op._source.valor+'*************'+op2+'***********'+tx);
                        ctg.push(op._source.valor)
                    }
                }
                */
                
            }
            
        }
    }


    //console.log('Termino ARR2');
    //console.log(JSON.stringify(arr3,undefined,2));

    for(let op of arr3) {
        let nom = cls.clearTexto(op._source.bn)
        if(nom.length <= tx.length) {
            nom = cls.onlyLetters(nom);
            let reg = new RegExp("\\b"+nom+"\\b");
            let matches = tx.match(reg);
            if(matches) {
                let nv = matches[0];
                console.log(nom+'*******'+nv+'********'+tx);
                if(!bn.includes(nv) && !ctg.includes(nv) && !pys.includes(nv)) bn.push(nv)
            }
        }
        else {
            let reg = new RegExp("\\b"+tx+"\\b");
            let matches = nom.match(reg);
            if(matches) {
                let nv = matches[0];
                //console.log(nom+'*******'+ctg.includes(nv)+'********'+tx);
                if(!bn.includes(nv) && !ctg.includes(nv)) bn.push(nv)
            }
        }
    }

    //console.log('Termino ARR3');

    return {
        ctg: ctg,
        pys:pys,
        bn:bn
    }
}

function validWord(arreglo,nv) {
    let ind = true;
    let pos = nv.split(' ');
    for( let p of arreglo) {
        let ref = p.split(' ');
        for(let op of pos) {
            if(ref.includes(op)) ind = false;
        }

        if(!ind) break;
    }

    return ind;
}


function probCtg(a,b) {
    a = sw.removeStopwords(a, sw.es);
    b = sw.removeStopwords(a, sw.es);
    let palabras1 = Array.from(a);
    let palabras2 = Array.from(b);
    
}
