'use strict'
const client = require('./client');

/**
 * @param {number} page - Page number to search in elastic db 
 * @param {string} searchTerm - searchTerm
 * @param {object} hrs - business schedule 
 * @param {string} hrs.hrs - business schedule 
 * @param {string} hrs.valor - business schedule 
 * @param {string[]} hrs.day - business schedule 
 * 
 * @param {string []} paymentTypes -  payment types of business
 * @param {object} address - business address in previous analisys
 * @param {string} address.city - 
 * @param {string} address.colony - 
 * @param {string} address.state - 
 * @param {string} address.physicalcity - 
 * @param {string} address.physicalstate - 
 * @param {object} coordinates - coordinates privided by the browser
 * @param {string} coordinates.lat - latitude
 * @param {string} coordinates.lng - longitude
 * 
 * 
 * @return {Promise<>}.
 */
function searchBusiness(page = 0, searchTerm, hrs, paymentTypes, address, coordinates) {
    const pagination = {
        "from": page * 20,
        "size": 20,
    };
    const SCORE_AND_POINTS_SORTING = ["_score", { "points": { "order": "desc" } }].concat(alphabeticalOrder());
    let should = [], filter = [];
    let addressFilter;

    /*         const paymentQuery = getPaymentQuery(paymentTypes);
            const scheduleQuery = getScheduleQuery(hrs); */
    addressFilter = getAddressFilter(address, coordinates);
    if (addressFilter) {
        filter = filter.concat(addressFilter);
    }

    searchTerm = stopPhrases(searchTerm);

    return getRelatedCategories(searchTerm).then(categories => {

        categories = categories.hits.hits.map(category => {
            return category._source;
        });

        if (categories.length) {
            should = should.concat(categoryQuery(categories, 'match'));
            var requestBody = {
                body:
                    Object.assign({
                        "query": {
                            "bool": {
                                "must": {
                                    "bool": {
                                        should: should.concat([
                                            {
                                                "match": {
                                                    "bn.spanish": {
                                                        "query": searchTerm,
                                                        "_name": "match_bn",
                                                        "boost": 0
                                                    }
                                                }
                                            },
                                            {
                                                "match_phrase": {
                                                    "productservices.prdserv.spanish": {
                                                        "query": searchTerm,
                                                        "_name": "match_phrase_prdserv_key",
                                                        "boost": 0
                                                    }
                                                }
                                            }
                                        ])
                                    }
                                },
                                filter
                            }
                        },
                        sort: SCORE_AND_POINTS_SORTING
                    }, pagination)
                ,
                index: process.env.negocios,
                searchType: 'dfs_query_then_fetch'
            }

            console.log('primer consulta ', JSON.stringify(requestBody));

            return client.getClient().search(requestBody).then(response => {
                if (response.hits.hits === 0) {
                    return multisearch(searchTerm, filter, pagination);
                } else {
                    return new Promise((resolve, reject) => {
                        console.log('query2 ', JSON.stringify(requestBody));
                        resolve(response);
                    });
                }
            });
        } else {
            return multisearch(searchTerm, filter, pagination);
        }
    });
}

function multisearch(searchTerm, filter, pagination) {
    const requestBody = {
        body:
            Object.assign({
                "query": {
                    "function_score": {
                        "query": {
                            "bool": {
                                must: {
                                    bool: {
                                        should: [
                                            {
                                                "match_phrase": {
                                                    "bn.spanish": { "query": searchTerm, "_name": "match_phrase_bn", "boost": 5 }
                                                }
                                            },
                                            {
                                                "match": {
                                                    "bn.spanish": { "query": searchTerm, "_name": "match_phrase_bn", "boost": 2 }
                                                }
                                            },
                                            {
                                                "match": {
                                                    "Appearances.Appearance.categoryname.spanish": {
                                                        "query": searchTerm,
                                                        "_name": "match_phrase_cat",
                                                        "boost": 4
                                                    }
                                                }
                                            },
                                            {
                                                "match": {
                                                    "productservices.prdserv.spanish": {
                                                        "query": searchTerm,
                                                        "_name": "match_phrase_prdserv", "boost": 2
                                                    }
                                                }
                                            },
                                            {
                                                "match": {
                                                    "productservices.prdserv.keyword": {
                                                        "query": searchTerm,
                                                        "_name": "match_phrase_prdserv", "boost": 4
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                },
                                filter
                            }
                        },
                        "script_score": {
                            "script": {
                                "source": "doc['points'].value == 10 ? 0:  doc['points'].value"
                            }
                        },
                        "boost_mode": "multiply"
                    }
                },
                sort: ["_score"].concat(alphabeticalOrder())
            }, pagination)
        ,
        index: process.env.negocios
    }
    console.log('multisearch ', JSON.stringify(requestBody));
    return client.getClient().search(requestBody);
}

/* función para omitir ciertas busquedas */
function stopPhrases(searchTerm) {
    let phrases = [
        "interrupcion de embarazo",
        "embarazo no deseado",
        "clinica de aborto",
        "clinica de abortos",
        "clinicas de aborto",
        "clinicas de abortos",
        "clinica para aborto",
        "clinica para abortos",
        "clinicas para aborto",
        "clinicas para abortos"
    ];

    return searchTerm = (phrases.indexOf(searchTerm.replace(/([\ \t]+(?=[\ \t])|^\s+|\s+$)/g, '')) == -1) ? searchTerm : '';
}

/**
 * 
 * @param {Array<object>} categories - categories name to put in query 
 * @return {Array<object>}
*/
function categoryQuery(categories, matchType) {
    var boost = categories.length + 1;
    return categories.map(category => {
        boost--;
        if (category.score) {
            return JSON.parse(`{
                "constant_score":{
                    "filter": {
                        "match": {
                            "categoryname_full_text": { "query": "${category.category}", "_name": "match_${category.category}" }
                        }
                    },
                        "boost": "${category.score}"
            }}`);
        }
        return JSON.parse(`{
            "${matchType}": {
                "categoryname_full_text": { "query": "${category.category}", "_name": "match_${category.category}", "boost":"${boost}" }
            }
        }`);
    });
}

/**
 * 
 * @param {string} searchTerm - term to search 
 * @returns {Promise>} - Returns a elasticsearch result with the related categories from db
 */
function getRelatedCategories(searchTerm) {
    const body = {
        "index": 'mexobjectsdefinition',
        "body": {
            "query": {
                "bool": {
                    "should": [
                        {
                            "match_phrase": {
                                "category": {
                                    "query": searchTerm,
                                    "_name": "match_cat"
                                }
                            }
                        },
                        {
                            "match_phrase": {
                                "text": {
                                    "query": searchTerm,
                                    "_name": "match_phrase_text_full_text"
                                    , "boost": 10
                                }
                            }
                        },
                        {
                            "bool": {
                                "must": [
                                    {
                                        "match_phrase": {
                                            "category.keyword": {
                                                "query": searchTerm,
                                                "_name": "match_phrase_category",
                                                "boost": 15
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                }
            },
            "sort": [
                "_score",
                {
                    "score": {
                        "order": "desc"
                    }
                }
            ]
        }
    }
    console.log(searchTerm);
    console.log('mexobjectsdefinition ', JSON.stringify(body));
    return client.getClient().search(body);
}

function alphabeticalOrder() {
    return [{
        "_script": {
            "type": "number",
            "script": {
                "lang": "painless",
                "source": "return  doc['bn.keyword'].value.trim()==~ /\\d+.*/? 0: 1"
            },
            "order": "desc"
        }
    },
    {
        "_script": {
            "type": "string",
            "script": {
                "lang": "painless",
                "source": "return  doc['bn.keyword'].value.trim();"
            },
            "order": "asc"
        }
    }, {
        "physicalstate.keyword": {
            "order": "asc"
        },
    }, {
        "colony.keyword": {
            "order": "asc"
        },
    }, {
        "physicalcity.keyword": {
            "order": "asc"
        }
    }];
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

/**
 * @description - generates an object depending on the calculated address by 
 * the analisys or provided coordinates
 * @param {object} location (optional)- previously calculated address 
 * @param {object} coordinates (optional) - browser coordinates
 * @returns {Array} - constains a fragment for query filter options 
 */
function getAddressFilter(location, coordinates) {
    let address = [];
    if (location) {
        if (location.colony) {
            address.push({
                "match_phrase": {
                    "colony.spanish": {
                        "query": location.colony
                    }
                }
            });
        }
        if (location.city) {
            address.push({
                "match": {
                    "Appearances.Appearance.city.spanish": {
                        "query": location.city
                    }
                }
            });
        }
        if (location.state) {
            address.push({
                "match_phrase": {
                    "Appearances.Appearance.state.keyword": {
                        "query": location.state
                    }
                }
            });
        }
        if (location.physicalcity) {
            address.push({
                "match": {
                    "physicalcity.keyword": {
                        "query": location.physicalcity
                    }
                }
            });
        }
        if (location.physicalstate) {
            address.push({
                "match_phrase": {
                    "physicalstate.keyword": {
                        "query": location.physicalstate
                    }
                }
            });
        }
        return address;
    } else if (coordinates) {
        address.push({
            "geo_distance": {
                "distance": "5km",
                "pin": [coordinates.lng, coordinates.lat]
            }
        });
        return address;
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
 * @param {string} id - if of the business
 * @description Returns a business related by id
 */
exports.businessByID = function (id) {
    const body = {
        "index": process.env.negocios,
        "body": {
            "query": {
                "match_phrase": {
                    "_id": id
                }
            }
        }
    }
    return client.getClient().search(body);
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

module.exports = { getAddressFilter, searchBusiness }
