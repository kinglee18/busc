const express = require('express')();
const http = require('http').Server(express);
const bodyParser = require('body-parser');
const config = require('./config');
const cors = require("cors");
const websiteRoutes = require('./routes');

express.use(cors());
express.use(bodyParser.json());
express.use(websiteRoutes)


/**
 * @param {port} 
 */
http.listen(port = 3008, function () {
    const envName = process.argv.slice(2)[0] || 'prod';
    process.env = Object.assign(process.env, config[envName])
    console.log("servidor corriendo en ambiente ", envName);
});

