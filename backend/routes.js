const express = require('express');
const routes = express.Router();
const http = require('http').Server(express);
const io = require('socket.io')(http);
const proceso = require('./app');
const elastic = require('./elastic/run');
const auto = require('./services/autocomplete');
const blog = require('./elastic/blog');
const clr1 = require('./analyzer/claro_shop');


/**
 * @desc Retrieves all business related by name, category, products and services
 * @param {string} req.query.searchTerm -business, category or location or  product
 * @param {string} req.query.lat - browser detected latitude
 * @param {string} req.query.lng - browser detected longitude
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
            elastic.searchBusiness(
                req.query.page,
                json.newSearchTerm,
                req.query.organic ? organicCodes : undefined,
                json.schedule,
                json.payments,
                json.location || address,
                coordinates
            ).then((response) => {
                res.status(200).send({
                    total: response.hits.total.value,
                    info: parseElasticElements(response.hits.hits)
                });
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
        clr1.claro_shop(analisys.newSearcherm).then(claro => {
            elastic.claro_shop(req.query.page, claro.marcas, claro.ctg, claro.bn, analisys.price, claro.tx).then((resp) => {
                res.status(200).send(resp);
            });
        });
    });
});

io.on('connection', function (socket) {
    socket.on('autocomplete', (data) => {
        auto.autocomplete(data.texto).then((resp) => {
            socket.emit('autocomplete-resp', {
                info: resp
            })
        });
    });
})

module.exports = {routes, validParams};