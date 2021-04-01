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
function searchBusiness(page = 0, searchTerm, organicCodes, category, hrs, paymentTypes, address, coordinates) {
    const SCORE_AND_POINTS_SORTING = [ "_score",  { "points": { "order": "desc" } }].concat(alphabeticalOrder());
    let should = [], filter = [];
    filter = filter.concat(
        getAddressFilter(address, coordinates),
        organicCodes ? [{ match: { listingtype: organicCodes.join(' ') } }] : [],
        category ? [{ match: { "Appearances.Appearance.categoryid": category } }] : [],
    );

    if (!searchTerm.length) {
        return sendRequest(page, { "query": { "bool": { filter } } }, [{ "points": { "order": "desc" } }].concat(alphabeticalOrder()), organicCodes);
    }
    searchTerm = stopPhrases(searchTerm);

    return getRelatedCategories(searchTerm).then(categories => {
        if (categories.hits.total.value) {
            should = should.concat(categoryQuery(categories));
        }
        var requestBody = {
            "query": {
                "bool": {
                    "must": {
                        "bool": {
                            should: [
                                {
                                    "match_phrase": {
                                        "bn.keyword": { 
                                            "query": searchTerm, 
                                            "_name": "nombre del negocio  exacto",
                                            "boost": 3
                                        }
                                    }
                                },
                                {
                                    "match": {
                                        "bn": {
                                            "query": searchTerm, 
                                            "_name": "nombre de negocio parcial",
                                            "operator": "or"
                                        }
                                    }
                                },
                                {
                                    "match_phrase": {
                                        "categoryname_full_text": {
                                            "query": searchTerm,
                                            "_name": "categoria completa"
                                        }
                                    }
                                },
                                {
                                    "match_phrase": {
                                        "Appearances.Appearance.categoryname.spanish": {
                                            "query": searchTerm,
                                            "_name": "categoria fuzzy"
                                        }
                                    }
                                },
                                {
                                    "match_phrase": {
                                        "productservices.prdserv.keyword": {
                                            "query": searchTerm,
                                            "_name": "servicios exactos"
                                        }
                                    }
                                },
                                {
                                    "match": {
                                        "productservices.prdserv.spanish": {
                                            "query": searchTerm,
                                            "operator": "and",
                                            "_name": "servicios con sinonimos o plurales"
                                        }
                                    }
                                }
                            ]
                        }
                    },
                    filter
                }
            }
        }
        return sendRequest(page, requestBody, SCORE_AND_POINTS_SORTING, organicCodes);
       
    });
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
function categoryQuery(categories) {
    categories = categories.hits.hits.map(category => {
        return category;
    });
    return categories = categories.map(category => {
        return JSON.parse(`{
            
                        "match_phrase": {
                            "categoryname_full_text": { 
                                "query": "${category._source.category}" ,
                            "_name": "${category._source.category}__cat"
                        }
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
                                "category.keyword": {
                                    "query": searchTerm,
                                    "_name": "exact_cat"
                                    , "boost": 10
                                }
                            }
                        },
                        {
                            "match_phrase": {
                                "text": {
                                    "query": searchTerm,
                                    "_name": "by_text_exact"
                                    , "boost": 10
                                }
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
            size: 200
        }
    }
    // console.log(JSON.stringify(body));
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

module.exports = { getAddressFilter, searchBusiness, businessByBrand, businessByID, getSuggestion, getAutocompleteSuggestion, getMeaningfulTerm }
