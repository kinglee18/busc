const express = require('express');
const routes = express.Router();
const http = require('http').Server(express);
const proceso = require('./app');
const elastic = require('./elastic/run');
const blog = require('./elastic/blog');
const products = require('./elastic/products');

/**
 * @desc Retrieves all business related by name, category, products and services from elasticsearch
 * @param {string} req.query.searchTerm - businessname, category or location or  product
 * @param {string} req.query.lat - browser detected latitude
 * @param {string} req.query.lng - browser detected longitude
 * @param {string} req.query.organic - a flag that determines if the query will contain business with certain packages
 * @param {string} req.query.physicalstate -filter query by state
 * @param {string} req.query.physicalcity -filter query by city
 * @param {string} req.query.colony -filter query by colony
 * @param {number} req.query.category_id - filter by category using their own id 
 * @param {string} req.query.show_business - if boolean is false , the server 
 * will just return the analyzed search term and address in diferent fields 
 * @returns {object} responseObj - f
 * 
 */
routes.get('/node', (req, res) => {
    const showBusiness = req.query.show_business == 'false' ? false : true;
    const validation = validParams(req.query);
    const address = req.query.physicalstate || req.query.physicalcity || req.query.colony ? {
        physicalstate: req.query.physicalstate,
        physicalcity: req.query.physicalcity,
        colony: req.query.colony
    } : undefined;
    const coordinates = req.query.lat && req.query.lng ? { lat: parseFloat(req.query.lat), lng: parseFloat(req.query.lng) } : undefined;
    const organicCodes = ['BRO', 'BRP', 'DIA', 'ORO', 'PIP', 'PLA', 'SPN'];
    if (validation.valid) {
        proceso.analisys(req.query.searchTerm).then((json) => {
            Promise.all([
                showBusiness ? elastic.searchBusiness(
                    req.query.page,
                    json.newSearchTerm,
                    req.query.organic ? organicCodes : undefined,
                    req.query.category_id,
                    json.schedule,
                    json.payments,
                    address || json.location,
                    coordinates,
                    req.query.size
                ) : null,
                elastic.getSuggestion(json.newSearchTerm)]
            ).then((response) => {
                const businessInfo = response[0];
                const textSuggest = response[1];
                res.status(200).send(createResponseBody(businessInfo, textSuggest, showBusiness, json));
            }).catch(error => {
                console.error(error);
                res.status(500).send(error);
            });
        });
    } else {
        res.status(400).send(validation);
    }
});


const getCompleteState = (initials) => {
    console.log(initials);
    const states = [
        { name: "AGUASCALIENTES", initials: "AGS" } ,
        { name: "BAJA CALIFORNIA", initials: "BC" } ,
        { name: "BAJA CALIFORNIA SUR", initials: "BCS" } ,
        { name: "CAMPECHE", initials: "CAMP" } ,
        { name: "CHIHUAHUA", initials: "CHIH" } ,
        { name: "CHIAPAS", initials: "CHIS" } ,
        { name: "COAHUILA", initials: "COAH" } ,
        { name: "COLIMA", initials: "COL" } ,
        { name: "DISTRITO FEDERAL", initials: "DF" } ,
        { name: "DURANGO", initials: "DGO" } ,
        { name: "GUERRERO", initials: "GRO" } ,
        { name: "GUANAJUATO", initials: "GTO" } ,
        { name: "HIDALGO", initials: "HGO" } ,
        { name: "JALISCO", initials: "JAL" } ,
        { name: "MEXICO", initials: "MEX" } ,
        { name: "MICHOACAN", initials: "MICH" } ,
        { name: "MORELOS", initials: "MOR" } ,
        { name: "NAYARIT", initials: "NAY" } ,
        { name: "NUEVO LEON", initials: "NL" } ,
        { name: "OAXACA", initials: "OAX" } ,
        { name: "PUEBLA", initials: "PUE" } ,
        { name: "QUINTANA ROO", initials: "QR" } ,
        { name: "QUERETARO", initials: "QRO" } ,
        { name: "SINALOA", initials: "SIN" } ,
        { name: "SAN LUIS POTOSI", initials: "SLP" } ,
        { name: "SONORA", initials: "SON" } ,
        { name: "TABASCO", initials: "TAB" } ,
        { name: "TAMAULIPAS", initials: "TAMS" } ,
        { name: "TLAXCALA", initials: "TLAX" } ,
        { name: "VERACRUZ", initials: "VER" } ,
        { name: "YUCATAN", initials: "YUC" } ,
        { name: "ZACATECAS", initials: "ZAC" }
    ];
    if(states.filter(x => x.initials === initials).map(x=> x.name).length){
       return states.filter(x => x.initials === initials)[0].name
    }
};
/**
 * 
 * @param {object} businessInfo - elasticsearch response that contains query results and aggregations
 * @param {object} textSuggest - text suggestion related with the search term
 * @param {boolean} showBusiness - flag that indicates if it is just and a text analysis or complete query
 * @param {object} analysis - address obtained in the analysis process provided by elasticsearch 
 */
function createResponseBody(businessInfo, textSuggest, showBusiness, analysis) {
    let responseObj = {};
    if (showBusiness) {
        responseObj = {
            total: businessInfo.hits.total.value,
            info: parseElasticElements(businessInfo.hits.hits),
            filters: {
                physicalcity: businessInfo.aggregations.physicalcity.buckets.map(e => e.key),
                colony: businessInfo.aggregations.colony.buckets.map(e => e.key),
                categories: businessInfo.aggregations.categoryIds.buckets.map((e, index) => {
                    return {
                        "id": e.key,
                        "name": e.categoryNames.buckets[0].key
                    }
                }),
                state: businessInfo.aggregations.state.buckets.map(e => getCompleteState(e.key)).filter(e => e != null)
            }
        };
    }

    if (analysis.location) {
        responseObj.location = {
            colony: analysis.location.colony,
            physicalcity: analysis.location.physicalcity,
            physicalstate: analysis.location.physicalstate,
            postal_code: analysis.location.postalCode,
            search_term: analysis.newSearchTerm
        }
    } else {
        responseObj.location = {
            search_term: analysis.newSearchTerm
        }
    }

    if (textSuggest.suggest.services[0].options.length) {
        responseObj.suggest = textSuggest.suggest.services[0].options[0].text;
    }
    return responseObj;
}

function parseElasticElements(elements) {
    return elements.map(obj => {
        obj._source.score = obj._score;
        obj._source.queries = obj.matched_queries;
        return obj._source;
    });
}

/**
 * 
 * @param {object} params - paremeters from query params
 * @param {number} params.lat - latitude provided by browser navigator
 * @param {number} params.lng - longitude provided by browser navigator
 */
function validParams(params) {
    if ((params.lat && !params.lng) || (!params.lat && params.lng)) {
        return { valid: false, msg: 'malformed coordinates' };
    }
    return { valid: true };
}

/**
 * @desc Retrieves all business related by brandname
 * @param {string} req.query.brandName - brandname to search in db
 */
routes.get('/node/business_by_brand', (req, res) => {
    elastic.businessByBrand(req.query.brandName).then((resp) => {
        res.status(200).send({
            total: resp.hits.total.value,
            businesses: parseElasticElements(resp.hits.hits)
        })
    }).catch(error => {
        console.error(error);
        res.status(500).send(error);
    });
});

/**
 * @desc Retrieves 
 * @param {string} req.query.id - 
 */
routes.get('/node/business/:id', (req, res) => {
    elastic.businessByID(req.params.id).then((resp) => {
        const business = resp.hits.hits.map(business => {
            return business._source;
        })

        if (business.length) {
            res.status(200).send(
                business[0]
            );
        } else {
            res.status(404).send()
        }

    }).catch(error => {
        console.error(error);
        res.status(500).send(error);
    });
});

/**
 * @desc Retrieves all blog articles from database
 * @param {string} req.query.search_term - business, category or location or  product
 */
routes.get('/node/blog', (req, res) => {
    blog.searchRelatedArticles(
        req.query.search_term,
        req.query.page,
        req.query.page_size,
        req.query.category
    ).then((resp) => {
        res.status(200).send({
            total: resp.hits.total.value,
            info: parseElasticElements(resp.hits.hits)
        });
    }).catch(error => {
        console.error(error);
        res.status(500).send(error);
    });
});

/**
 * @desc Retrieves all claro shop products
 * @param {string} req.query.search_term - business, category or location or  product
 */
routes.get('/node/claroshop', (req, res) => {
    products.searchRelatedProducts(req.query.search_term, req.query.page).then((resp) => {
        res.status(200).send({
            total: resp.hits.total.value,
            products: parseElasticElements(resp.hits.hits)
        });
    }).catch(error => {
        console.error(error);
        res.status(500).send(error);
    });
});

/**
 * @desc Endpoint for autocomplete in webpage, based in business categories in the business index
 * @param {string} search_term - word to search in categories 
 */
routes.get('/node/suggest', function (req, res) {
    let searchTerm = req.query.search_term;
    let place = undefined;
    if (searchTerm.match(/(.+)\s+en\s+(.+)/) !== null) {

        [, searchTerm, place] = searchTerm.match(/(.+)\s+en\s+(.+)/);
    }

    elastic.getAutocompleteSuggestion(req.query.search_term, place).then((resp) => {
        const ele = [];
        for (let type in resp.suggest) {
            resp.suggest[type][0].options.forEach(element => {
                if (place) {
                    if (element._source.state) {
                        ele.push(`${searchTerm} en ${element.text}, ${element._source.state}`.toUpperCase())
                    } else {
                        ele.push(`${searchTerm} en ${element.text}`.toUpperCase())
                    }
                } else {
                    ele.push(element.text.toUpperCase())
                }
            });
        }
        res.status(200).send(ele);

    }).catch(err => {
        res.status(500).send(err);
        console.error(err);
    });
});

module.exports = { routes, validParams };