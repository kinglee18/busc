const elasticsearch = require('elasticsearch');

exports.getClient = function () {
    return new elasticsearch.Client({
        host: process.env.ip,
        httpAuth: "dev_user:q_bMlQtT"
    });
}