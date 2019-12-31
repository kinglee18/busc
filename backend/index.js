const app = require('express')();
const http = require('http').Server(app);
const bodyParser = require('body-parser');
const config = require('./config');
const cors = require("cors");
const websiteRoutes = require('./routes');
const cron = require('node-cron');
const articlesJob = require('./blogCron');

app.use(cors());
app.use(bodyParser.json());
app.use(websiteRoutes.routes)


/**
 * @param {port} 
 */
http.listen(port = 3008, function () {
    const envName = process.argv.slice(2)[0] || 'prod';
    process.env = Object.assign(process.env, config[envName])
    console.log("servidor corriendo en ambiente ", envName);
});

/**
 * @desc the job will update blog articles at 3am everyday
 */
cron.schedule('0 3 * * *', () => {
    articlesJob.blogCron();
});

module.exports = {app}