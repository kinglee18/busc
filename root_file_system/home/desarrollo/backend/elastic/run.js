'use strict'
const syn = require('../info/syn_where');
const com = require('../http/comments');
const config = require('../config');

const elasticsearch = require('elasticsearch');
const client = new elasticsearch.Client({
    host: config.ip
});


exports.negocios = function (page, ctg, pys, bn, hrs, pay, where) {

    let promesa = new Promise((resolve, reject) => {
        let busq = [];
        let filtro = [];
        let ub = [];
        let busqCtg = []
        //console.log(where);
        if (ctg.length > 0) {
            let arr = [];
            let arr2 = [];
            for (let op of ctg) {
                arr.push({
                    "match_phrase": {
                        'Appearances.Appearance.categoryname': op
                    }
                });
            }
            //busqCtg = arr;
            busq = busq.concat(arr);
            //filtro = filtro.concat(arr2);
        }
        if (pys.length > 0) {
            let arr1 = [];
            let arr2 = [];

            for (let op of pys) {
                arr1.push({
                    "match_phrase": {
                        'productservices.prdserv': op
                    }
                })
                arr2.push({
                    "match": {
                        "productservices.prdserv": op
                    }
                })
            }

            //arr1 = arr1.concat(busqCtg);

            /*let pos =  {
                "bool": {
                  "should": arr1
                }
            }*/
            if (ctg.length == 0 && bn.length == 0) {
                busq = busq.concat(arr1);
            }
            else {
                busq = busq.concat(arr1);
                //filtro = filtro.concat(arr1);
            }
            //

        }
        if (bn.length > 0) {
            let arr = [];
            let arr2 = [];
            for (let op of bn) {
                arr.push({
                    "match_phrase": {
                        "bn": op
                    }
                })

                arr2.push({
                    "match_phrase": {
                        "bn": op
                    }
                })
            }


            busq = busq.concat(arr);
            //filtro = filtro.concat(arr2);
        }



        if (hrs) {
            let ops = [];



            if (hrs.hrs) {
                if (hrs.day[0] == 'monday' || hrs.day[0] == 'tuesday' || hrs.day[0] == 'wednesday' || hrs.day[0] == 'thursday' || hrs.day[0] == 'friday') {
                    ops.push({
                        "range": {
                            "weekDayOpen": {
                                "lte": "16:46:00"
                            }
                        }
                    })
                    ops.push({
                        "range": {
                            "weekDayClose": {
                                "gte": "16:46:00"
                            }
                        }
                    })

                }

                ops = ops.concat(asigDay(hrs.day, hrs.hrs, hrs))
            }
            else {
                if (hrs.day[0] == 'monday' || hrs.day[0] == 'tuesday' || hrs.day[0] == 'wednesday' || hrs.day[0] == 'thursday' || hrs.day[0] == 'friday') {
                    ops.push({
                        "exists": {
                            "field": "weekDayOpen"
                        }
                    })
                }

                ops = ops.concat(asigDaySn(hrs.day))
            }


            let nv = {
                "bool": {
                    "should": ops
                }
            }
            filtro = filtro.concat(nv);
        }

        if (pay) {
            let nv = pay.toUpperCase();
            filtro.push({
                "nested": {
                    "path": "features",
                    "query": {
                        "bool": {
                            "must": [
                                { "match": { "features.type.feature.content": nv } }
                            ]
                        }
                    }
                }

            })
        }

        if (where.maps.lat && where.maps.lng) {
            //if(!where.estado) {
            where.estado = where.maps.dir.estado;
            console.log('Estado Asignado: ' + where.estado);
            ub = setWhere(where)
            //}
            if (where.maps && where.maps.dir.estado) {
                filtro.push({
                    bool: {
                        should: [
                            {
                                match: {
                                    statename: where.maps.dir.estado
                                }
                            },
                            {
                                "geo_distance": {
                                    "distance": "5km",
                                    "pin": [where.maps.lng, where.maps.lat]
                                }
                            }
                        ]
                    }
                })
            }
            else {
                filtro.push({
                    "geo_distance": {
                        "distance": "5km",
                        "pin": [where.maps.lng, where.maps.lat]
                    }
                })
            }


        }
        else if (validWhere(where) && validPys(pys, where) && validCtg(ctg, where)) {
            ub = setWhere(where)
        }
        else if (where.lat && where.lng) {
            filtro.push({
                "geo_distance": {
                    "distance": "10km",
                    "pin": [where.lng, where.lat]
                }
            })
        }

        let content = {};

        //console.log('Validacion Where: '+validWhere(where));
        content = {
            bool: {
                must: [
                    {
                        bool: {
                            must: [
                                {
                                    bool: {
                                        should: busq
                                    }
                                }
                            ],
                            should: ub
                        }
                    }
                ],
                filter: filtro
            }
        };
        /*
    
        if( ((ctg.length > 0 || pys.length > 0) || bn.length > 0) &&  validWhere(where)) {
            //console.log('Entro CTG BN y Where')
            content = {
                bool: {
                    must: [
                        {
                            bool: {
                                must: [
                                    {
                                        bool: {
                                            should: busq
                                        }
                                    }
                                ],
                                should: ub
                            }
                        }
                    ],
                    filter: filtro
                }
            };
        }
        else if( (ctg.length == 0 && bn.length == 0) &&  validWhere(where)) {
            content = {
                bool: {
                    must: [
                        {
                            bool: {
                                should: ub
                            }
                        }
                    ],
                    filter: filtro
                }
            };
        }
        else if( (ctg.length > 0 || bn.length > 0) &&  !validWhere(where)) {
            content = {
                bool: {
                    must: [
                        {
                            bool: {
                                must: [
                                    {
                                        bool: {
                                            should: busq
                                        }
                                    }
                                ]
                            }
                        }
                    ],
                    filter: filtro
                }
            };
        }
        */

        console.log(JSON.stringify(content));



        if (ctg.length > 0 || bn.length > 0 || pys.length > 0 || validWhere(where)) {
            let lat = null;
            let lng = null;
            if (Object.keys(where.maps).length > 0 && where.maps.lat && where.maps.lng) {
                lat = where.maps.lat;
                lng = where.maps.lng
            }
            else if (where.lat && where.lng) {
                lat = where.lat;
                lng = where.lng;
            }

            let td = {}

            if (lat && lng) {
                td = {
                    "index": config.negocios,
                    "body": {
                        "from": page * 10,
                        "size": 10,
                        "query": content,
                        /*"sort" : [
                            {
                                "_geo_distance" : {
                                    "pin" : [lng, lat],
                                    "order" : "asc",
                                    "unit" : "km"
                                }
                            }
                        ]*/

                    }
                }
            }
            else {
                td = {
                    "index": config.negocios,
                    "body": {
                        "from": page * 10,
                        "size": 6,
                        "query": content

                    }
                }
            }

            //console.log(JSON.stringify(td));

            client.search(td).then((resp) => {

                let arr = [];
                let lista = [];
                let sort = [];
                if (resp.hits.total > 0) {
                    for (let op of resp.hits.hits) lista.push(op._source.listadoid);
                    for (let i in resp.hits.hits) {
                        let nv = resp.hits.hits[i]._source;
                        nv.sort = resp.hits.hits[i].hasOwnProperty('sort') ? resp.hits.hits[i].sort : null;
                        arr.push(nv);
                    }
                    /*findComments(lista).then((comments) => {
                        for(let i in resp.hits.hits) {
                            resp.hits.hits[i]._source.comments = comments[i];
                            //console.log(resp.hits.hits[i]._source.comments);
                            arr.push(resp.hits.hits[i]._source);
                            
                        }
                        resolve(arr);
                    });*/
                    resolve({
                        info: arr,
                        total: resp.hits.total
                    });


                }
                else {
                    resolve({
                        info: [],
                        total: 0
                    });
                }


            })
        }
        else resolve({
            info: [],
            total: 0
        });
    })

    return promesa;


}

exports.claro_shop = function (page, marcas, ctg, bn, price, tx) {
    //console.log('Entro al ClaroShop')
    let promesa = new Promise((resolve, reject) => {

        let busq = [];
        let filtro = [];



        if (marcas.length > 0) {
            let arr1 = [];
            let arr2 = [];
            for (let op of marcas) {
                arr1.push({
                    "match_phrase": {
                        "brand": op
                    }
                })
            }

            let nv = '';
            for (let i in marcas) {
                if (i == 0) {
                    nv += '(' + marcas[i] + ')';
                }
                else {
                    nv += ' OR (' + marcas[i] + ')';
                }
            }

            arr2.push({
                "query_string": {
                    "default_field": 'brand',
                    "query": nv
                }
            })

            busq = busq.concat(arr1);
            filtro = filtro.concat(arr2);
        }



        if (ctg.length > 0) {
            let arr = [];
            for (let op of ctg) {
                arr.push({
                    "match_phrase": {
                        'google_product_category': op
                    }
                })
            }
            busq = busq.concat(arr);
        }

        if (bn.length > 0) {
            let arr = [];
            for (let op of bn) {
                arr.push({
                    "match": {
                        'title': op
                    }
                })
                arr.push({
                    "match": {
                        "description": tx
                    }
                })
                /*arr.push({
                    "match": {
                        "product_type": op
                    }
                })*/
            }
            busq = busq.concat(arr)
        }
        else {
            let arr = [];
            arr.push({
                "match": {
                    'title': tx
                }
            })
            arr.push({
                "match": {
                    "description": tx
                }
            })
            busq = busq.concat(arr)
        }

        if (price) {
            filtro.push({
                "range": {
                    "price": {
                        "gte": price.min,
                        "lte": price.max
                    }
                }
            })
        }



        let content = {}
        if (marcas.length > 0 || ctg.length > 0 || bn.length > 0) {

            content = {
                "bool": {
                    "should": busq,
                    "filter": filtro
                }

            }

            console.log(JSON.stringify(content));

            client.search({
                "index": config.claro_shop,
                "body": {
                    "from": 9 * page,
                    "size": 9,
                    "query": content,
                    /*"aggs": {
                        "min_price": {
                          "min": {
                            "field": "price"
                          }
                        },
                        "max_price": {
                          "max": {
                            "field": "price"
                          }
                        }
                    }*/
                }
            }).then((resp) => {
                let arr = [];
                //console.log(JSON.stringify(resp));
                if (resp.hits.total > 0) {
                    for (let op of resp.hits.hits) {
                        let nv = op._source;
                        //nv.min_price = resp.aggregations.min_price.value;
                        //nv.max_price = resp.aggregations.max_price.value;
                        arr.push(nv);
                    }
                }

                resolve({
                    info: arr,
                    total: resp.hits.total
                });
            })
        }
        else resolve({
            info: [],
            total: 0
        });



    });

    return promesa;
}

exports.blog = function (page, tx, tags, ctg, where) {
    //console.log('Entro al Blog')
    let promesa = new Promise((resolve, reject) => {

        let busq = [];
        let filtro = [];

        if (where.estado) {
            filtro.push({
                "nested": {
                    "path": "categories",
                    "query": {
                        "match": { "categories.slug": where.estado }
                    }
                }
            });
        }

        busq.push({
            "match": {
                "title": tx
            }
        })
        busq.push({
            "match": {
                "excerpt": tx
            }
        })

        if (tags.length > 0) {
            let nv = '';
            for (let i in tags) {
                busq.push({
                    "match": {
                        "tags.slug": tags[i]
                    }
                })
            }

        }

        for (let i in ctg) {
            busq.push({
                "match": {
                    "categories.slug": ctg[i]
                }
            })
        }


        let query = {
            "bool": {
                "should": busq,
                "filter": filtro
            }
        }

        //console.log(JSON.stringify(query));

        if (tags.length > 0 || ctg.length > 0) {
            client.search({
                "index": config.blog,
                "body": {
                    "from": 10 * page,
                    "size": 10,
                    "query": query
                }
            }).then((resp) => {
                let arr = [];
                if (resp.hits.total > 0) {
                    for (let op of resp.hits.hits) {
                        arr.push(op._source);
                    }
                }

                resolve({
                    info: arr,
                    total: resp.hits.total
                });
            })
        }
        else resolve({
            info: [],
            total: 0
        });



    });

    return promesa;
}

function asigDay(days, hora) {
    let arr = [];
    for (let op of days) {
        if (op == 'sunday') {
            arr.push({
                "range": {
                    "sundayOpen": {
                        "lte": hora
                    }
                }
            })
            arr.push({
                "range": {
                    "sundayClose": {
                        "lte": hora
                    }
                }
            })
        }
        else if (op == 'monday') {
            arr.push({
                "range": {
                    "mondayOpen": {
                        "lte": hora
                    }
                }
            })
            arr.push({
                "range": {
                    "mondayClose": {
                        "lte": hora
                    }
                }
            })
        }
        else if (op == 'tuesday') {
            arr.push({
                "range": {
                    "tuesdayOpen": {
                        "lte": hora
                    }
                }
            })
            arr.push({
                "range": {
                    "tuesdayClose": {
                        "lte": hora
                    }
                }
            })
        }
        else if (op == 'wednesday') {
            arr.push({
                "range": {
                    "wednesdayOpen": {
                        "lte": hora
                    }
                }
            })
            arr.push({
                "range": {
                    "wednesdayClose": {
                        "lte": hora
                    }
                }
            })
        }
        else if (op == 'thursday') {
            arr.push({
                "range": {
                    "thursdayOpen": {
                        "lte": hora
                    }
                }
            })
            arr.push({
                "range": {
                    "thursdayClose": {
                        "lte": hora
                    }
                }
            })
        }
        else if (op == 'friday') {
            arr.push({
                "range": {
                    "fridayOpen": {
                        "lte": hora
                    }
                }
            })
            arr.push({
                "range": {
                    "fridayClose": {
                        "lte": hora
                    }
                }
            })
        }
        else if (op == 'saturday') {
            arr.push({
                "range": {
                    "saturdayOpen": {
                        "lte": hora
                    }
                }
            })
            arr.push({
                "range": {
                    "saturdayClose": {
                        "lte": hora
                    }
                }
            })
        }
    }

    return arr;
}

function asigDaySn(days) {
    let arr = [];
    for (let op of days) {
        if (op == 'sunday') {
            arr.push({
                "exists": {
                    "field": "sundayOpen"
                }
            })
        }
        else if (op == 'monday') {
            arr.push({
                "exists": {
                    "field": "mondayOpen"
                }
            })
        }
        else if (op == 'tuesday') {
            arr.push({
                "exists": {
                    "field": "tuesdayOpen"
                }
            })
        }
        else if (op == 'wednesday') {
            arr.push({
                "exists": {
                    "field": "wednesdayOpen"
                }
            })
        }
        else if (op == 'thursday') {
            arr.push({
                "exists": {
                    "field": "thursdayOpen"
                }
            })
        }
        else if (op == 'friday') {
            arr.push({
                "exists": {
                    "field": "fridayOpen"
                }
            })
        }
        else if (op == 'saturday') {
            arr.push({
                "exists": {
                    "field": "saturdayOpen"
                }
            })
        }
    }

    return arr;
}

async function findComments(arreglo) {
    let arr = [];
    for (let op of arreglo) {
        await com.getComment(op).then((info) => {
            arr.push(info);
        })
    }

    return arr;
}


function validPys(pys, where) {
    let ind = true;
    for (let op of pys) {
        //console.log('('+op+')==>'+where.city);
        if (where.estado == op || where.city == op || where.colony == op) {
            ind = false;
            break;
        }
    }
    console.log('Regresa: ' + ind);
    return ind;
}

function validCtg(ctg, where) {
    let ind = true;

    for (let op of ctg) {
        let palabras = op.split(' ');
        if (palabras.includes(where.estado) || palabras.includes(where.colony) || palabras.includes(where.city)) {
            ind = false;
            break;
        }
    }

    return ind;
}



function setWhere(where) {
    let arr = [];

    if (where.estado) {
        let abrev = getAbrevWhere(where.estado);
        arr.push({
            "match": {
                "statename": {
                    "query": where.estado,
                    "boost": 3
                }
            }
        })
        arr.push({
            "match": {
                "Appearances.Appearance.statename.synonyms": {
                    "query": where.estado,
                    "boost": 3
                }
            }
        })

        arr.push({
            "match": {
                "state.synonyms": {
                    "query": abrev,
                    "boost": 3
                }
            }
        })

        arr.push({
            "match": {
                "Appearances.Appearance.state.synonyms": {
                    "query": abrev,
                    "boost": 3
                }
            }
        })
    }

    if (where.city) {
        arr.push({
            "match": {
                "city": {
                    "query": where.city,
                    "boost": 3
                }
            }
        });
        arr.push({
            "match": {
                "Appearances.Appearance.city": {
                    "query": where.city,
                    "boost": 3
                }
            }
        })
    }

    if (where.colony) {
        arr.push({
            "match": {
                "Appearances.Appearance.colony": {
                    "query": where.colony,
                    "boost": 3
                }
            }
        })
        arr.push({
            "match": {
                "colony": {
                    "query": where.colony,
                    "boost": 3
                }
            }
        })
    }

    return arr;

}

function validWhere(where) {
    let ind = false;
    if (where.estado || where.city || where.colony) ind = true;
    return ind;
}

function getAbrevWhere(estado) {
    let abrev = null;
    for (let op of syn.data) {
        if (op.valor == estado) {
            abrev = op.simb;
            break;
        }
    }

    return abrev;
}