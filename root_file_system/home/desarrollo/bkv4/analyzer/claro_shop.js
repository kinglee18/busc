
const elastic = require('../elastic/analyzer_claro_shop');
const cls = require('./clear');
const prob = require('./prob');

exports.claro_shop = function(tx) {
    
    let claro = {
        marcas: [],
        ctg: [],
        bn: [],
        tx: null
    }

    let promesa = new Promise((resolve,reject) => {
        
        elastic.query_claro_shop_marca(tx)
        .then((resp) => {
            //console.log('Marcas')
            claro.marcas = findMarca(tx,resp.hits.hits);
            tx = deleteMarcas(tx,claro.marcas);
            claro.tx = tx;
            return Promise.all([
                elastic.query_claro_shop_prod(tx,claro.marcas),
                elastic.query_claro_shop_esp(tx,claro.marcas)
            ]);
        }).then((resp) => {
            //console.log('Marcas: '+claro.marcas);
            let data = findProd(tx,resp[0].hits.hits,resp[1].hits.hits);
            //claro.marcas = claro.marcas.concat(data.marcas);
            claro.ctg = data.ctg;
            claro.bn = data.bn;
            resolve(claro);
        })

    });

    return promesa;

}

function deleteMarcas(tx,marcas) {
    for(let op of marcas) {
        tx = sust(tx,op);
        tx = cls.clearStopWord(tx);
    }

    return tx;
}

function sust(a,b) {
    a = a.replace(b,'');
    a.trim();
    return a;
}

function findMarca(tx,arr) {
    let marcas = [];
    for(let op of arr) {
        if(op._source.valor.length <= tx.length) {
            let reg = new RegExp("\\b"+op._source.valor+"\\b");
            let matches = tx.match(reg);
            if(matches && !marcas.includes(op._source.valor)) {
                marcas.push(op._source.valor);
            }
        }
    }

    return marcas;
}

function findProd(tx,arr1,arr2) {
    let ctg = [];
    let bn = [];
    for(let op of arr1) {
        for(let op2 of op._source.relacion) {
            if(op2.length <= tx) {
                let reg = new RegExp("\\b"+op2+"\\b");
                let matches = tx.match(reg);
                if(matches) {
                    ctg.push(op2);
                    if(!ctg.includes(op2)) ctg.push(op2);
                    //if(!marcas.includes(op._source.valor)) marcas.push(op._source.valor);
                }
            }
            else {
                let reg = new RegExp("\\b"+tx+"\\b");
                let matches = op2.match(reg);
                if(matches) {
                    //let ind = prob.probWords(tx,op2);
                    //console.log('Probalidad: '+ind+'----'+op2);
                    let inicio = op2.split(' ')[0];
                    if(!ctg.includes(op2) && tx.includes(inicio)) ctg.push(op2);
                    //if(!marcas.includes(op._source.valor)) marcas.push(op._source.valor);
                }
            }
        }
    }
    

    for(let op of arr2) {
        let titu = cls.clearTexto(op._source.title);
        let brand = cls.clearTexto(op._source.brand);
        if(titu.length <= tx) {
            let reg = new RegExp("("+titu+")");
            let matches = tx.match(reg);
            if(matches) {
                if(!bn.includes(titu)) bn.push(titu)
                //if(!marcas.includes(brand)) marcas.push(brand);
            }
        }
        else {
            let reg = new RegExp("("+tx+")");
            let matches = titu.match(reg);
            if(matches) {
                if(!bn.includes(tx)) bn.push(tx)
                //if(!marcas.includes(brand)) marcas.push(brand);
            }
        }
    }
    
    return {
        ctg:ctg,
        bn: bn
    }


    
}