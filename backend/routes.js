const express = require('express');
const routes = express.Router();
const http = require('http').Server(express);
const proceso = require('./app');
const elastic = require('./elastic/run');
const blog = require('./elastic/blog');
const products = require('./elastic/products');

/**
 * @desc Retrieves all business related by name, category, products and services
 * @param {string} req.query.searchTerm -business, category or location or  product
 * @param {string} req.query.lat - browser detected latitude
 * @param {string} req.query.lng - browser detected longitude
 * @returns {object} responseObj - f
 * 
 */
routes.get('/node', (req, res) => {
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
                elastic.searchBusiness(
                    req.query.page,
                    json.newSearchTerm,
                    req.query.organic ? organicCodes : undefined,
                    json.schedule,
                    json.payments,
                    json.location || address,
                    coordinates
                ),
                elastic.getSuggestion(json.newSearchTerm)]
            ).then((response) => {
                const businessInfo = response[0];
                const textSuggest = response[1];
                console.log(JSON.stringify(textSuggest));
                
                let responseObj = {
                    total: businessInfo.hits.total.value,
                    info: parseElasticElements(businessInfo.hits.hits),
                    filters: {
                        physicalcity: businessInfo.aggregations.physicalcity.buckets.map(e => e.key),
                        colony: businessInfo.aggregations.colony.buckets.map(e => e.key),
                        category: businessInfo.aggregations.category.buckets.map(e => e.key),
                        state: businessInfo.aggregations.state.buckets.map(e => e.key)
                    }
                };
                if (json.location) {
                    responseObj.location = {
                        colony: json.location.colony,
                        physicalcity: json.location.city,
                        physicalstate: json.location.statename,
                        postal_code: json.location.postalCode,
                        search_term: json.newSearchTerm
                    }
                }
                res.status(200).send(responseObj);
            }).catch(error => {
                console.error(error);
                res.status(500).send(error);
            });
        });
    } else {
        res.status(400).send(validation);
    }
});

function parseElasticElements(elements) {
    return elements.map(obj => {
        return obj._source;
    });
}

function validParams(params) {
    if ((params.lat && !params.lng) || (!params.lat && params.lng)) {
        return { valid: false, msg: 'malformed coordinates' };
    }
    return params.searchTerm ? { valid: true } : { valid: false, msg: 'missing param: searchTerm' };
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
    proceso.analisys(req.query.search_term).then((analisys) => {
        products.searchRelatedProducts(req.query.page, claro.marcas, claro.ctg, claro.bn, analisys.price, claro.tx).then((resp) => {
            res.status(200).send(resp);
        }).catch(error => {
            console.error(error);
            res.status(500).send(error);
        });
    });
});

/**
 * @desc Endpoint for autocomplete in webpage, based in business categories in the business index
 * @param {string} search_term - word to search in categories 
 */
routes.get('/node/suggest', function (req, res) {
    const searchTerm = req.query.search_term;
    const place = searchTerm.match(/.+\s+en\s+.+/) !== null ? searchTerm.match(/.+\s+en\s+.+/)[1] : undefined;
    elastic.getAutocompleteSuggestion(req.query.search_term, place).then((resp) => {
        res.status(200).send(resp.suggest.autocomplete[0].options.map(el => el.text));
    }).catch(err => {
        console.error(err);
    });
});

module.exports = { routes, validParams };