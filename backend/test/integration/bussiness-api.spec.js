
var request = require('supertest');
var assert = require('chai').assert;
const app = require('../../index').app;
const config = require('../../config');

describe('Business services tests', () => {
    before(() => {
        process.env = Object.assign(process.env, config['test']);
    });
    it('should return a 200 http status, business attribute and business count using a category name', (done) => {
        request(app)
            .get('/node')
            .query({ searchTerm: 'hoteles' })
            .set('Content-Type', 'application/json')
            .expect('Content-Type', /charset=utf-8/)
            .expect(200, function (err, res) {
                if (err) { return done(err); }
                assert.typeOf(res.body.total, 'number');
                assert.exists(res.body.info);
                done();
            });
    });

    it('should return a 200 http status, info attribute and business count using a product name', (done) => {
        request(app)
            .get('/node')
            .query({ searchTerm: 'tacos de billar' })
            .set('Content-Type', 'application/json')
            .expect('Content-Type', /charset=utf-8/)
            .expect(200, function (err, res) {
                if (err) { return done(err); }
                assert.typeOf(res.body.total, 'number');
                assert.exists(res.body.info);
                done();
            });
    });



});