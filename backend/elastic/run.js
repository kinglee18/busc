'use strict'
const client = require('./client');

/**
 * @async
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
function searchBusiness(page = 0, searchTerm, organicCodes, category, hrs, paymentTypes, address, coordinates, pageSize = 20) {
    const SCORE_AND_POINTS_SORTING = [ "_score",{ "points": { "order": "desc" } },].concat(alphabeticalOrder());
    if (!searchTerm.length) {
        searchTerm = address.physicalstate;
        address = null;
        }
    let filter = [];
    filter = filter.concat(
        getAddressFilter(address, coordinates),
        organicCodes ? [{ match: { listingtype: organicCodes.join(' ') } }] : [],
        category ? [{ match: { "Appearances.Appearance.categoryid": category } }] : [],
    );
    return getRelatedCategories(searchTerm).then(categories => {
        categories =  categories.hits.hits.map( c => ({
            name: c._source.category,
            score: c._source.score
        }));

        var requestBody = {
            "query": {
                "bool": {
                    "must": {
                        "bool": {
                            should: [
                                constantScore('match', 'or', searchTerm, 'Appearances.Appearance.categoryname.spanish', 100, `categoria parcial(${100})`, 1),
                                constantScore('match_phrase', 'and', searchTerm, 'bn.keyword', 3, `nombre exacto(${3})`),
                                constantScore('match_phrase', 'and', searchTerm, 'productservices.prdserv.spanish', 1, `servicios(${1})`),
                                constantScore('match_phrase', 'and', searchTerm, 'Appearances.Appearance.categoryname', 20, 'frase(20)'),
                                {
                                    "constant_score": {
                                        "filter": {
                                            "multi_match": {
                                                "query": searchTerm,
                                                "type": "cross_fields",
                                                "fields": [
                                                    "Appearances.Appearance.categoryname.spanish",
                                                    "bn.spanish",
                                                    "productservices.prdserv.spanish"
                                                ],
                                                "operator": "and"
                                            }
                                        },
                                        "boost": 101,
                                        "_name": 'match con cruce(101)',
                                    }
                                }
                                    
                            ].concat(categories.length ?
                                [ ...categories.map(c => constantScore('match_phrase', 'and', c.name, 'Appearances.Appearance.categoryname.keyword', 140, `cat personalizada ${c.name} (140)`))] :                                
                                constantScore('match', 'and', searchTerm, 'Appearances.Appearance.categoryname.clean_keyword', 140, 'categoria exacta(140)'),
                            ).concat(searchTerm.split(' ').length > 1 ? 
                                [...searchTerm.split(' ').map(w =>  constantScore('match', 'or', w, 'bn.spanish', 1, `match palabra 1(${w})`, 1))] : 
                                constantScore('match', 'or', searchTerm, 'bn.spanish', 1, `nombre parcial(${1})`, 0)),
                        }
                    },
                    filter
                }
            }
        }
        return sendRequest(page, requestBody, SCORE_AND_POINTS_SORTING, organicCodes, pageSize);
    })


    
}

function getRelatedCategories(searchTerm) {
    const body = {
        "index": 'mexobjectsdefinition',
        "body": {
            "query": {
                bool: {
                    must: [
                        {

                            "query_string": {
                                "default_field": "text",
                                "query": searchTerm
                              }
                        },
                        {
                            "range": {
                                "score": {
                                  "gte": 1
                                }
                              }
                        }
                    ]
                }
            },
            size: 20
        }
    };
    return client.getClient().search(body);
}

function searchBusiness2(page = 0, searchTerm, organicCodes, category, hrs, paymentTypes, address, coordinates, pageSize=20) {
    const SCORE_AND_POINTS_SORTING = [ "_score",{ "points": { "order": "desc" } },].concat(alphabeticalOrder());
    if (!searchTerm.length) {
        searchTerm = address.physicalstate;
        address = null;
        }
    let filter = [];
    filter = filter.concat(
        getAddressFilter(address, coordinates),
        organicCodes ? [{ match: { listingtype: organicCodes.join(' ') } }] : [],
        category ? [{ match: { "Appearances.Appearance.categoryid": category } }] : [],
    );

    return getRelatedCategories(searchTerm).then(categories => {

        categories =  categories.hits.hits.map( c => ({
            name: c._source.category,
            score: c._source.score
        }));

        var requestBody = {
            "query": {
                "bool": {
                    "must": {
                        "bool": {
                            should: [
                                constantScore('match', 'or', searchTerm, 'Appearances.Appearance.categoryname.spanish', 100, `categoria parcial(${100})`, 2),
                                constantScore('match_phrase', 'and', searchTerm, 'productservices.prdserv.spanish', 1, `servicios(${1})`),
                                constantScore('match_phrase', 'and', searchTerm, 'Appearances.Appearance.categoryname', 20, 'frase(20)'),
                                {
                                    "constant_score": {
                                        "filter": {
                                            "multi_match": {
                                                "query": searchTerm,
                                                "type": "cross_fields",
                                                "fields": [
                                                    "Appearances.Appearance.categoryname.spanish",
                                                    "bn.spanish",
                                                    "productservices.prdserv.spanish"
                                                ],
                                                "operator": "and"
                                            }
                                        },
                                        "boost": 101,
                                        "_name": 'match con cruce(101)',
                                    }
                                },
                                {
                                    bool: {
                                        must: [
                                            constantScore('match', 'and', searchTerm, 'Appearances.Appearance.categoryname.clean_keyword', 140, 'categoria exacta(140)'),
                                        ],
                                        must_not: [
                                            constantScore('match', 'or', searchTerm, 'bn.spanish', 2, `nombre parcial(${2})`, 1),
                                            constantScore('match_phrase', 'and', searchTerm, 'bn.keyword', 3, `nombre exacto(${3})`)
                                        ]
                                    }
                                },
                                {
                                    bool: {
                                        must: [
                                            constantScore('match', 'and', searchTerm, 'Appearances.Appearance.categoryname.clean_keyword', 140, 'categoria exacta(140)'),
                                        ],
                                        must_not: [
                                            constantScore('match', 'or', searchTerm, 'bn.spanish', 2, `nombre parcial(${2})`),
                                            constantScore('match_phrase', 'and', searchTerm, 'bn.keyword', 3, `nombre exacto(${3})`)
                                        ]
                                    }
                                }  
                            ]
                        }
                    },
                    filter
                }
            }
        }
        return sendRequest(page, requestBody, SCORE_AND_POINTS_SORTING, organicCodes, pageSize);
    })
    
}
function sendRequest(page, request, sort, randomSorting, pageSize) {
    sort = randomSorting ? {} : sort;
    const pagination = {
        "from": page * pageSize,
        "size": pageSize,
    };
    const requestBody = {
        body: Object.assign({
            query: {
                "function_score": Object.assign(
                    {},
                    request,
                    randomSorting ? { "random_score": {} } : {},
                    randomSorting ? {} :{
                        "boost_mode": "sum",
                        "script_score": { 
                            "script": {
                                "source": "(doc['points'].size() != 0  && doc['points'].value > 10) ? doc['points'].value + 10: 0"
                            }
                        }
                    }
                )
            },
            sort
        },
            pagination,
            {
                "aggs": {
                    "physicalcity": {
                        "terms": { "field": "Appearances.Appearance.city", "size": 10000, "order": { "_key": "asc" } }
                    },
                    "colony": {
                        "terms": { "field": "colony", "size": 10000, "order": { "_key": "asc" } }
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
                        "terms": { "field": "Appearances.Appearance.state", "size": 10000, "order": { "_key": "asc" } }
                    }
                }
            }
        ),
        index: process.env.negocios,
        searchType: 'dfs_query_then_fetch',
        "track_total_hits": true
    };
    console.log(JSON.stringify(requestBody));
    return client.getClient().search(requestBody);
}


/**
 * 
 * @param {Array<object>} categories - categories name to put in query 
 * @return {Array<object>}
*/
function constantScore(matchType, operator,query, field, boost = 1, name, fuzziness=0) {
    return {
        "constant_score":{
            "filter": {
                [matchType]: {
                    [field]: { 
                        query,
                        operator: matchType === 'match' ? operator : undefined,
                        fuzziness: matchType === 'match' ? fuzziness : undefined
                    }
                }
            },
            boost,
            "_name": name
        }
    };
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
        "Appearances.Appearance.state.keyword": {
            "order": "asc"
        },
    }, {
        "Appearances.Appearance.city.keyword": {
            "order": "asc"
        }
    },
    {
        "colony.keyword": {
            "order": "asc"
        },
    }];
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
                "match_phrase": {
                    "Appearances.Appearance.city.synonyms": {
                        "query": location.physicalcity
                    }
                }
            });
        }
        if (location.physicalstate) {
            address.push({
                "match": {
                    "Appearances.Appearance.state.synonyms": {
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
 * @param {string} term - name of the business
 * @description Returns -------
 */
function getMeaningfulTerm(term) {
    const body = {
        "index": process.env.meaningfulTerms,
        "size": 0,
        "body": {
            "query": {
                "match": {
                    "term.keyword": term
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
 * @description  contains suggestion based in products and services of the business in db
 * @param {string} term - search term to search in categories, products and services
 * @returns {Promise<object>} - elasticsearch result  
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

module.exports = { getAddressFilter, searchBusiness, searchBusiness2, businessByBrand, businessByID, getSuggestion, getAutocompleteSuggestion, getMeaningfulTerm }
