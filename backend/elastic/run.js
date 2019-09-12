'use strict'
const syn = require('../info/syn_where');
const client = require('./client');

/**
 * @param {number} page - Page number to search in elastic db 
 * @param {string} searchTerm - searchTerm
 * @param {object} hrs - business schedule 
 * @param {string} hrs.hrs - business schedule 
 * @param {string} hrs.valor - business schedule 
 * @param {string[]} hrs.day - business schedule 
 * 
 * @param {string} paymentTypes -  payment types of business
 * @param {object} calculatedAddress - business calculatedAddress
 * @param {string} calculatedAddress.city - 
 * @param {string} calculatedAddress.colony - 
 * @param {string} calculatedAddress.estado - 
 * @param {string} calculatedAddress.street - 
 * @param {object} calculatedAddress.maps -
 * @param {number} calculatedAddress.maps.lng - 
 * @param {number} calculatedAddress.maps.lat - 
 * @param {object} calculatedAddress.maps.dir -
 * @param {string} calculatedAddress.maps.dir.city -
 * @param {string} calculatedAddress.maps.dir.colony -
 * @param {string} calculatedAddress.maps.dir.estado -
 * @param {object} coordinates - coordinates privided by the browser
 * @param {string} coordinates.lat - latitude
 * @param {string} coordinates.lng - longitude
 * 
 * 
 * @return {Promise<>}.
 */
exports.searchBusiness = function (page = 0, searchTerm, hrs, paymentTypes, calculatedAddress, coordinates ) {
    let must = [], should = [], filter = [];

    return searchCategoryAndServices(searchTerm).then(categoriesAndService => {
/*         const paymentQuery = getPaymentQuery(paymentTypes);
        const scheduleQuery = getScheduleQuery(hrs); */
        /* const addressQuery = getAddressQuery(calculatedAddress); */
        const query = {
            bool: {
                must,
                should,
                filter
            }
        };
        const requestBody = {
            "index": process.env.negocios,
            "body": {
                "from": page * 20,
                "size": 20,
                "query": query,
                sort: [
                    { points: "desc" },
                    { "bn.order": "asc" }
                ]
            }
        }
        console.log(JSON.stringify(requestBody));
        return client.getClient().search(requestBody);
    });
}

function getScheduleQuery(hrs) {
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
        };
        filtro = filtro.concat(nv);
    }
}

function getPaymentQuery(payments) {
    if (payments) {
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

        });
    }
}

function getAddressQuery(location) {
    if (location.maps.lat && location.maps.lng) {
        location.estado = location.maps.dir.estado;
        ub = setWhere(location);
        if (location.maps && location.maps.dir.estado) {
            filtro.push({
                bool: {
                    should: [
                        {
                            match: {
                                statename: location.maps.dir.estado
                            }
                        },
                        {
                            "geo_distance": {
                                "distance": "5km",
                                "pin": [location.maps.lng, location.maps.lat]
                            }
                        }
                    ]
                }
            });
        }
        else {
            filtro.push({
                "geo_distance": {
                    "distance": "5km",
                    "pin": [location.maps.lng, location.maps.lat]
                }
            });
        }
    }
    else if (validWhere(location) && validPys(pys, location) && validCategory(category, location)) {
        ub = setWhere(location)
    }
    else if (location.lat && location.lng) {
        filtro.push({
            "geo_distance": {
                "distance": "10km",
                "pin": [location.lng, location.lat]
            }
        })
    }
}

/**
 * @param {string} brandname - name of the business
 * @description Returns all business related by brandname in elastic
 */
exports.businessByBrand = function (brandname) {
    const body = {
        "index": process.env.negocios,
        "body": {
            "query": {
                "term": {
                    "brands.brandname.keyword": brandname
                }
            }
        }
    }
    return client.getClient().search(body);
}

/**
 * 
 * @param {string} searchTerm - term searched in api
 * @returns {Promise<>} - elasticsearch result 
 */
function searchCategoryAndServices(searchTerm) {
    const request = {
        "index": process.env.taxonomias,
        "body": {
            "query": {
                "bool": {
                    "must": [
                        {
                            "match_phrase": {
                                "relacion": searchTerm
                            }
                        }
                    ],
                    "should": [
                        {
                            "match_phrase": {
                                "valor": searchTerm
                            }
                        }
                    ],
                    "filter": {
                        "term": {
                            "fuente": "negocios"
                        }
                    }
                }
            },
            "size": 30,
            sort: [
                { "_score": "asc" }
            ]
        }
    }
    return client.getClient().search(request);
}

exports.claro_shop = function (page = 0, marcas, ctg, bn, price, tx) {
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

            client.getClient().search({
                "index": process.env.claro_shop,
                "body": {
                    "from": 10 * page,
                    "size": 10,
                    "query": content
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

exports.blog = function (page = 0, tx, tags, ctg, where) {
    let promesa = new Promise((resolve, reject) => {

        let busq = [];
        let filtro = [];

        if (where.state) {
            filtro.push({
                "nested": {
                    "path": "categories",
                    "query": {
                        "match": { "categories.slug": where.state }
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

        if (tags.length > 0 || ctg.length > 0) {
            client.getClient().search({
                "index": process.env.blog,
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

function getAbrevWhere(estado) {
    for (let op of syn.data) {
        if (op.valor == estado) {
            return op.simb;
        }
    }
    return null;
}