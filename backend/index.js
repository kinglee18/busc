const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const proceso = require('./app');
const elastic = require('./elastic/run');
const auto = require('./http/autocomplete');
const bodyParser = require('body-parser');
const config = require('./config');
const cors = require("cors");
const blog = require('./analyzer/blog');
const clr1 = require('./analyzer/claro_shop');

app.use(cors());
app.use(bodyParser.json())


/**
 * @desc Retrieves all business related by name, category, products and services
 * @param {string} req.query.searchTerm -business, category or location or  product
 * @param {string} req.query.lat - browser detected latitude
 * @param {string} req.query.lng - browser detected longitude
 * 
 */
app.get('/node', (req, res) => {
    const validation = validParams(req.query);
    if (validation.valid) {
        proceso.analisys(req.query.searchTerm).then((json) => {

            const coordinates = req.query.lat && req.query.lng ? { lat: parseFloat(req.query.lat), lng: parseFloat(req.query.lng) } : undefined;
            elastic.searchBusiness(
                req.query.page,
                json.newSearchTerm,
                json.schedule,
                json.payments,
                json.location,
                coordinates
            ).then((response) => {
                res.status(200).send({
                    total: response.hits.total,
                    info: parseBussineses(response.hits.hits)
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

function parseBussineses(businesses) {
    return businesses.map(business => {
        return business._source;
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
app.get('/node/business_by_brand', (req, res) => {
    elastic.businessByBrand(req.query.brandName).then((resp) => {
        res.status(200).send({
            total: resp.hits.total,
            businesses: parseBussineses(resp.hits.hits)
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
app.get('/node/business/:id', (req, res) => {
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
 * @param {string} req.query.searchTerm - business, category or location or  product
 */
app.get('/node/blog', (req, res) => {
    proceso.analisys(req.query.searchTerm).then(analisys => {
        blog.blog(analisys.newSearchTerm).then(blog => {
            elastic.blog(req.query.page, analisys.newSearchTerm, blog.tags, blog.ctg, analisys.location).then((resp) => {
                res.status(200).send(resp);
            });
        });
    });
});

/**
 * @desc Retrieves all claro shop products
 * @param {string} req.query.searchTerm - business, category or location or  product
 */
app.get('/node/claroshop', (req, res) => {
    proceso.analisys(req.query.searchTerm).then((analisys) => {
        clr1.claro_shop(analisys.newSearchTerm).then(claro => {
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

/**
 * @param {port} 
 */
http.listen(port = 3008, function () {
    const envName = process.argv.slice(2)[0] || 'prod';
    process.env = Object.assign(process.env, config[envName])
    console.log("servidor corriendo en ambiente ", envName);
});

module.exports = { validParams };