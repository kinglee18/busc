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
 */
app.get('/node', (req, res) => {
    
    proceso.analisys(req.query.searchTerm).then((json) => {
        elastic.searchBusiness(
            req.query.page,
            json.newSearchTerm,
            json.schedule,
            json.payments,
            json.location,
            { lat: parseFloat(req.query.lat), lng: parseFloat(req.query.lng) }
        ).then((response) => {
            const businesses = response.hits.hits.map(business => {
                return business._source;
            });
            res.status(200).send({
                total: response.hits.total,
                info: businesses
            })
        }).catch(error => {
            console.error(error);
            res.status(500).send(error);
        })
    })
});

/**
 * @desc Retrieves all business related by brandname
 * @param {string} req.query.brandName - brandname to search in db
 */
app.get('/node/business_by_brand', (req, res) => {
    elastic.businessByBrand(req.query.brandName).then((resp) => {
        const businesses = resp.hits.hits.map(business => {
            return business._source;
        })

        res.status(200).send({
            total: resp.hits.total,
            businesses
        })
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