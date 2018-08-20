'use strict'
const accents = require('remove-accents');
const fs = require('fs');
const wheres = require('./data/syn_where').data;

const elasticsearch = require('elasticsearch');
const client = new elasticsearch.Client({
    host: '172.18.1.96:9200'
});

let ctgAll = [];
let stateAll = [];
let cityAll = [];

let json = {
    ctgs: [],
    state_city: [],
    city_colony: [],
    state_zip: [],
    hrs: [],
    payment: []
}

function getElastic(page) {
    return client.search({
        "index": "negocios_secam",
        "body": {
            "size": 10000,
            "from": page*10000,
            "query": {
                "match_all":{}
            }
        }
    })
}

//exports.runNeg = function(page) {
function runNeg(page) {
    let total = 0;
    //let page = 0;
    let promesa = new Promise((resolve,reject) => {
        getElastic(page).then((resp) => {
            let datos = resp.hits.hits;
            let total = resp.hits.total;
    
    
            for(let op of datos) {
    
                let ctg = clear(op._source.Appearances.Appearance.categoryname)
                //console.log('Estado---'+op._source.statename+'---'+op._source.state+'---'+op._source.city+'---'+op._source.colony+'---'+op._source.zip)
                let state = op._source.statename.length > 0 ? clear(op._source.statename) : findAbrev(clear(op._source.state));
                let city = op._source.city.length > 0 ? clear(op._source.city):null;
                let colony = op._source.colony.length > 0 ? clear(op._source.colony):null;
                let zip = op._source.zip.length > 0 ? clear(op._source.zip):null;
                
    
                if(!ctgAll.includes(ctg)) {
                    ctgAll.push(ctg)
                    json.ctgs.push({
                        ctg:ctg,
                        info: []
                    })
                }
                //console.log('Existe Servivios: '+op._source.productservices.hasOwnProperty('prdserv'))
                if(op._source.productservices.hasOwnProperty('prdserv')) {
                    let tipo = typeof op._source.productservices.prdserv;
                    let pys = [];
                    if(tipo == 'object') pys = op._source.productservices.prdserv;
                    else if(tipo == 'string' && op._source.productservices.prdserv.includes(',')) getOther(op._source.productservices.prdserv);
                    
                    for(let op2 of json.ctgs) {
                        if(op2.ctg == ctg) {
                            for(let op3 of pys) {
                                let nv = clear(op3);
                                if(!op2.info.includes(nv)) op2.info.push(nv);
                            }
                        }
                    }
                }
                //console.log('Estado: '+state+'---'+colony+'---'+zip)
                
                
                if(state && !stateAll.includes(state)) {
                    stateAll.push(state);
                    json.state_city.push({
                        state:state,
                        info: []
                    })
                    json.state_zip.push({
                        state:state,
                        info: []
                    })
                }
    
                if(city && !cityAll.includes(city)) {
                    cityAll.push(city);
                    json.city_colony.push({
                        city:city,
                        info: [],
                        tipo: state
                    })
                }
    
                if(city && stateAll.length > 0) {
                    for(let op2 of json.state_city) {
                        if(op2.state == state && !op2.info.includes(city)) op2.info.push(city);
                    }
                    
                    if(zip) {
                        for(let op2 of json.state_zip) {
                            if(op2.state == state && !op2.info.includes(zip)) op2.info.push(zip);
                        }
                    }
                }
    
                if(colony && json.city_colony.length > 0) {
                    for(let op2 of json.city_colony) {
                        if(op2.city == city && !op2.info.includes(colony)) {
                            op2.info.push(colony);
                        }
                    }
                    
                }
                
                
                
                /*if(op._source.features.hasOwnProperty('type') && op._source.features.type.length > 0) {
                    for(let op2 of op._source.features.type) {
                        if(op2.name == 'txtschedule') {
                            for(let op3 of op2.feature) {
                                let nv =  clear(op3.value);
                                if(!json.hrs.includes(nv)) json.hrs.push(nv);
                            }
                        }
    
                        if(op2.name == 'paymenttype') {
                            for(let op3 of op2.feature) {
                                let nv =  clear(op3.content);
                                if(!json.payment.includes(nv)) json.payment.push(nv);
                            }
                        }
                    }
                }*/
                
                
            }
    
            if( ( (page + 1) * 10000) <= total) {
                page++;
                console.log('Analizados: '+((page + 1)*10000)+' de '+total);
                return runNeg(page);
            }else {
                //console.log(JSON.stringify(json));
                insertarCtg(json['ctgs']).then(() => {
                    return insertarState1(json['state_city'])
                }).then(() => {
                    return insertarState2(json['state_zip'])
                }).then((resp) => {
                    return insertarCity(json['city_colony'])
                }).then((resp) => {
                    console.log('Terminos Negocios');
                    resolve();
                });
                //insertarState1(json['state_city']);
                //insertarState2(json['state_zip']);
                //insertarCity(json['city_colony']);
                //let tx = 'module.exports = ['+JSON.stringify(json)+']';
                /*let tx = '['+JSON.stringify(json)+']';
                fs.appendFile('../machine/data/negocios.js', tx, (err) => {
                    if (err) throw err;
                    console.log('Termino Data de Blog');
                });*/
            }
    
        })
    })

    return promesa;
    
}

async function insertarCtg(arreglo) {
    //let promesa = new Promise((resolve,reject) => {
        let total = arreglo.length;
        let i = 0;
        for(let op of arreglo) {
            i++;
            await client.create({
                index: 'taxonomias_globales',
                type: 'default',
                id: new Date().getTime(),
                body: {
                    fuente: 'negocios',
                    valor: op.ctg,
                    relacion: op.info,
                    tipo: 'categorias'
                }
            })
            //console.log('Neocios-Ctg: '+i+' de '+total);
            
        }

        return;
    //})

    //return promesa;
}

async function insertarState1(arreglo) {
    //let promesa = new Promise((resolve,reject) => {
        let total = arreglo.length;
        let i = 0;
        for(let op of arreglo) {
            i++;
            await client.create({
                index: 'taxonomias_globales',
                type: 'default',
                id: new Date().getTime(),
                body: {
                    fuente: 'lugares_city',
                    valor: op.state,
                    relacion: op.info,
                    tipo: 'state_city'
                }
            })//.then((resp) => {
                //console.log('Neocios-State1: '+i+' de '+total);
                
            //})
            
        }
        return;
    //})

    //return promesa;
}

async function insertarState2(arreglo) {
    //let promesa = new promesa((resolve,reject) => {
        let total = arreglo.length;
        let i = 0;
        for(let op of arreglo) {
            i++;
            await client.create({
                index: 'taxonomias_globales',
                type: 'default',
                id: new Date().getTime(),
                body: {
                    fuente: 'lugares_zip',
                    valor: op.state,
                    relacion: op.info,
                    tipo: 'state_zip'
                }
            })//.then((resp) => {
                //console.log('Neocios-State2: '+i+' de '+total);
               
            //})
            
        }

        return;

    //})

    //return promesa;
}

async function insertarCity(arreglo) {
    //let promesa = new Promise((resolve,reject) => {
        let total = arreglo.length;
        let i = 0;
        for(let op of arreglo) {
            i++;
            await client.create({
                index: 'taxonomias_globales',
                type: 'default',
                id: new Date().getTime(),
                body: {
                    fuente: 'lugares_colony',
                    valor: op.city,
                    relacion: op.info,
                    tipo: op.tipo
                }
            })//.then((resp) => {
                //console.log('Neocios-City: '+i+' de '+total);
                
            //})
            
        }

        return;
    //})

    //return promesa;
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

function getOther(tx) {
    let palabras = tx.split(',')
    let arr = [];
    for(let op of palabras) {
        arr.push(op.trim());
    }

    return arr;

}

function findAbrev(abrev) {
    let ind = null;
    for(let op of wheres) {
        if(op.simb == abrev) {
            ind = op.valor;
            break;
        }
    }
    
    return ind;
}


runNeg(0);





//clear('cuidad-de-mexico')