'use strict'
const accents = require('remove-accents');
const fs = require('fs');

const elasticsearch = require('elasticsearch');
const client = new elasticsearch.Client({
    host: '172.18.1.96:9200'
});

let marcasAll = [];

let json = {
    //marcas: [],
    ctg: []
}

function getElastic(page) {
    return client.search({
        "index": "claro_shop",
        "body": {
            "size": 10000,
            "from": page*10000,
            "query": {
                "match_all":{}
            }
        }
    })
}

//exports.runProd = function(page) {
function runProd(page) {
    let total = 0;
    //let page = 0;
    let promesa = new Promise((resolve) => {
        getElastic(page).then((resp) => {
            let datos = resp.hits.hits;
            let total = resp.hits.total;
    
    
            for(let op of datos) {
                let marca = clear(op._source.brand)
                if(!marcasAll.includes(marca)) {
                    marcasAll.push(marca);
                    json.ctg.push({
                        marca:marca,
                        info: []
                    })
                }
    
                
    
                for(let op2 of json.ctg) {
                    if(op2.marca == marca) {
                        for(let op3 of op._source.product_type) {
                            let ctg = clear(op3);
                            if(!op2.info.includes(ctg)) op2.info.push(ctg);
                        }
                    }
                }
            }
    
    
    
            if( ( (page + 1) * 10000) <= total) {
                console.log('Analizados: '+((page + 1)*10000)+' de '+total);
                page++;
                return runProd(page);
            }else {
                
                //let tx = 'module.exports = ['+JSON.stringify(json)+']';
                insertData(json.ctg).then((resp) => {
                    console.log('Termino Claro Shop')
                    resolve();
                })
            }
    
        })
    })

    return promesa;
    
}

function clear(tx) {
    tx = tx.trim();
    tx = tx.toLowerCase();
    tx = accents.remove(tx);
    if(tx.includes('-')) {
        let palabras = Array.from(tx);
        for(let i in palabras) {
            if(palabras[i] == '-') palabras[i] = ' ';
        }
        tx = palabras.join('');
    }
    return tx;

}

async function insertData(datos) {
    let total = datos.length;
    let i= 0;
    for(let op of datos) {
            i++;
            console.log('Insertado: '+i+' de '+total);
            await client.create({
                index: 'taxonomias_globales',
                type: 'default',
                id: new Date().getTime(),
                body: {
                    fuente: 'claro_shop',
                    valor: op.marca,
                    relacion: op.info,
                    tipo: 'claro_marca'
                }
            });
       }
       return;
     
}

runProd(0);

//clear('cuidad-de-mexico')