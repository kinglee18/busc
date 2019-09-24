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
 * @param {object} calculatedAddress - business calculatedAddress in previous analisys
 * @param {string} calculatedAddress.city - 
 * @param {string} calculatedAddress.colony - 
 * @param {string} calculatedAddress.state - 
 * @param {object} coordinates - coordinates privided by the browser
 * @param {string} coordinates.lat - latitude
 * @param {string} coordinates.lng - longitude
 * 
 * 
 * @return {Promise<>}.
 */
exports.searchBusiness = function (page = 0, searchTerm, hrs, paymentTypes, calculatedAddress, coordinates) {
    let must = [], should = [], filter = [];
    let addressFilter;

    /*         const paymentQuery = getPaymentQuery(paymentTypes);
            const scheduleQuery = getScheduleQuery(hrs); */
    addressFilter = getAddressFilter(calculatedAddress, coordinates);
    if (addressFilter) {
        filter.push(addressFilter);
    }

    const pagination = {
        "from": page * 20,
        "size": 20,
    };
    const requestBody = {
        body: [
            {},
            Object.assign({
                "query": {
                    "bool": {
                        "must": [{ "match": { "bn_full_text": { "query": searchTerm, "_name": "match_exact_bn" } } }],
                        filter
                    }
                },
                "sort": [{ "points": { "order": "desc" } }, "_score"]
            }, pagination),
            {},
            Object.assign({
                "query": {
                    "bool": {
                        should: {
                            "match": {
                                "Appearances.Appearance.categoryname": { "query": searchTerm, "_name": "match_phrase_cat" }
                            }
                        },
                        filter,
                        "must_not": [{ "match": { "bn_full_text": { "query": searchTerm } } }]
                    }
                },
                "sort": [{ "points": { "order": "desc" } }, { "bn.order": { "order": "asc" } }]
            }, pagination)
        ],
        index: process.env.negocios
    }
    console.log(JSON.stringify(requestBody));
    return client.getClient().msearch(requestBody);

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
 * @param {object} location - previously calculated address 
 * @param {object} coordinates - browser coordinates
 * @returns {object} - constains a fragment for query filter options 
 */
function getAddressFilter(location, coordinates) {
    if (location) {
        if (location.colony) {
            return {
                "match_phrase": {
                    "colony": {
                        "query": location.colony
                    }
                }
            };
        }
        else if (location.municipality) {
            return {
                "match_phrase": {
                    "Appearances.Appearance.city": {
                        "query": location.municipality
                    }
                }
            };
        }
        return {
            "match_phrase": {
                "Appearances.Appearance.state": {
                    "query": location.state
                }
            }
        };
    } else if (coordinates.lat) {
        return {
            "geo_distance": {
                "distance": "10km",
                "pin": [coordinates.lng, coordinates.lat]
            }
        };
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

