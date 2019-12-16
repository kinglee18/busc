'use strict'
const client = require('./client');

/**
 * @param {number} page - Page number to search in elastic db 
 * @param {string} searchTerm - searchTerm
 * @param {string[]} organicCodes - list of organic package codes to filter 
 * @param {object} hrs - business schedule 
 * @param {string} hrs.hrs - business schedule 
 * @param {string} hrs.valor - business schedule 
 * @param {string[]} hrs.day - business schedule 
 * @param {string []} paymentTypes -  payment types of business
 * @param {object} address - business address in previous analisys
 * @param {string} address.colony - 
 * @param {string} address.physicalcity - 
 * @param {string} address.physicalstate - 
 * @param {string} address.initials - 
 * @param {object} coordinates - coordinates privided by the browser
 * @param {string} coordinates.lat - latitude
 * @param {string} coordinates.lng - longitude
 * 
 * 
 * @return {Promise<>}.
 */
function searchBusiness(page = 0, searchTerm, organicCodes, category, hrs, paymentTypes, address, coordinates) {

    const SCORE_AND_POINTS_SORTING = ["_score", { "points": { "order": "desc" } }].concat(alphabeticalOrder());
    let should = [], filter = [];

    /*         const paymentQuery = getPaymentQuery(paymentTypes);
            const scheduleQuery = getScheduleQuery(hrs); */
    filter = filter.concat(
        getAddressFilter(address, coordinates),
        organicCodes ? [{ match: { listingtype: organicCodes.join(' ') } }] : [],        
        category ? [{ match: { "Appearances.Appearance.categoryid": category} }] : [],        
    );
    searchTerm = stopPhrases(searchTerm);

    return getRelatedCategories(searchTerm).then(categories => {

        categories = categories.hits.hits.map(category => {
            return category._source;
        });

        if (categories.length) {
            should = should.concat(categoryQuery(categories, 'match'));
            var requestBody = {
                "query": {
                    "bool": {
                        "must": {
                            "bool": {
                                should
                            }
                        },
                        filter
                    }
                }
            }
            return sendRequest(page, requestBody, SCORE_AND_POINTS_SORTING, organicCodes).then(response => {
                if (response.hits.hits === 0) {
                    return multisearch(page, searchTerm, filter, organicCodes);
                } else {
                    return new Promise((resolve, reject) => {
                        resolve(response);
                    });
                }
            });
        } else {
            return multisearch(page, searchTerm, filter, organicCodes);
        }
    });
}

function multisearch(page, searchTerm, filter, organicCodes) {
    const requestBody = {
        "query": {
            "bool": {
                must: {
                    bool: {
                        should: [
                            {
                                "match_phrase": {
                                    "bn.keyword": { "query": searchTerm, "_name": "match_phrase_bn", "boost": 5 }
                                }
                            },
                            {
                                "match": {
                                    "bn.spanish": { "query": searchTerm, "_name": "match_phrase_bn", "boost": 2, "operator": "and" }
                                }
                            },
                            {
                                "match": {
                                    "Appearances.Appearance.categoryname.spanish": {
                                        "query": searchTerm,
                                        "operator": "and",
                                        "_name": "match_phrase_cat",
                                        "boost": 4,
                                        "fuzziness": "1"
                                    }
                                }
                            },
                            {
                                "match": {
                                    "productservices.prdserv.spanish": {
                                        "query": searchTerm,
                                        "operator": "and",
                                        "_name": "match_phrase_prdserv", "boost": 2
                                    }
                                }
                            },
                            {
                                "match": {
                                    "productservices.prdserv.keyword": {
                                        "query": searchTerm,
                                        "_name": "match_phrase_prdserv", "boost": 5
                                    }
                                }
                            },
                            {
                                "multi_match": {
                                    "query": searchTerm,
                                    "type": "cross_fields",
                                    "fields": ["productservices.prdserv.spanish", "Appearances.Appearance.categoryname.spanish"],
                                    "operator": "and"
                                }
                            }
                        ]
                    }
                },
                filter
            }
        }
    }
    return sendRequest(page, requestBody, ["_score"].concat(alphabeticalOrder()), organicCodes, true);
}


function sendRequest(page, request, sort, randomSorting, scoreSum = false) {
    sort = randomSorting ? {} : sort;
    const pagination = {
        "from": page * 20,
        "size": 20,
    };
    const requestBody = {
        body: Object.assign({
            query: {
                "function_score": Object.assign(
                    {},
                    request,
                    randomSorting ? { "random_score": {} } : {},
                    (!randomSorting && scoreSum) ? {
                        "boost_mode": "sum",
                        "script_score": {
                            "script": {
                                "source": "doc['points'].size() > 0 ? doc['points'].value: 10"
                            }
                        }
                    } : {}
                )
            },
            sort
        },
            pagination,
            {
                "aggs": {
                    "physicalcity": {
                        "terms": { "field": "Appearances.Appearance.city.keyword", "size": 10000, "order": { "_key": "asc" } }
                    },
                    "colony": {
                        "terms": { "field": "colony.keyword", "size": 10000, "order": { "_key": "asc" } }
                    },
                    "categoryIds": {
                        "terms": { "field": "Appearances.Appearance.categoryid", "size": 10000, "order": { "_key": "asc" } },
                        "aggs": {
                            "categoryNames": {
                                "terms": { "field": "categoryname_full_text", "size": 10000, "order": { "_key": "asc" } }
                            }
                        }
                    },
                    "state": {
                        "terms": { "field": "statename.keyword", "size": 10000, "order": { "_key": "asc" } }
                    }
                }
            }
        ),
        index: process.env.negocios,
        searchType: 'dfs_query_then_fetch',
        "track_total_hits": true
    };
    //console.log(JSON.stringify(requestBody));
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
            return JSON.parse(`{
                "constant_score":{
                    "filter": {
                        "match": {
                            "categoryname_full_text": { "query": "${category.category}", "_name": "match_${category.category}" }
                        }
                    },
                        "boost": "${category.score || boost}"
            }}`);
        
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
            ],
            size: 20
        }
    }
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
        if (location.physicalcity) {
            address.push({
                "match": {
                    "Appearances.Appearance.city.synonyms": {
                        "query": location.physicalcity
                    }
                }
            });
        }
        if (location.physicalstate) {
            address.push({
                "match": {
                    "Appearances.Appearance.state": {
                        "query": location.initials || location.physicalstate, 
                        analyzer: "states_analyzer"
                    }
                }
            });
        }
    } else if (coordinates) {
        address.push({
            "geo_distance": {
                "distance": "5km",
                "pin": [coordinates.lng, coordinates.lat]
            }
        });
    }
    return address;
}

/**
 * @param {string} brandname - name of the business
 * @description Returns all business related by brandname in elastic
 */
function businessByBrand(brandname) {
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
function businessByID(id) {
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

/**
 * 
 * @param {string} term - name of the category to search
 * @param {string} place - name of the place to seach in cities and states (optional)
 */
function getAutocompleteSuggestion(prefix, place) {
    let request = {
        "index": process.env.autocomplete,
        body: {
            "suggest": {
                "category": {
                    "prefix": place || prefix,
                    "completion": {
                        "field": "term",
                        "skip_duplicates": true,
                        "fuzzy": {
                            "fuzziness": 1
                        },
                        "contexts": {
                            "type": [place ? 'location' : 'category']
                        }
                    }
                }
            }
        }
    }
    return client.getClient().search(request);
}

/**
 * 
 * @param {string} term - search term to search in categories, products and services
 */
function getSuggestion(term) {
    const request = {
        "index": process.env.negocios,
        body: {
            "_source": "",
            "suggest": {
                "services": {
                    "text": term,
                    "term": {
                        "field": "productservices.prdserv.keyword",
                        "max_edits": 2
                    }
                }
            }
        }
    }
    return client.getClient().search(request);
}

module.exports = { getAddressFilter, searchBusiness, businessByBrand, businessByID, getSuggestion, getAutocompleteSuggestion }
