
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

    it('should return physicalstate and physicalcity atributes in location object', (done) => {
        request(app)
            .get('/node')
            .query({ searchTerm: 'dentista en 64000' })
            .set('Content-Type', 'application/json')
            .expect('Content-Type', /charset=utf-8/)
            .expect(200, function (err, res) {
                if (err) { return done(err); }
                assert.typeOf(res.body.total, 'number');
                assert.deepEqual(res.body.location, {
                    "colony": "centro",
                    "physicalcity": "monterrey",
                    "physicalstate": "nuevo leon",
                    "postal_code": "64000",
                    "search_term": "dentista"
                });
                done();
            });
    });

    it('search result witch searchTerm should be the same as the response using filters ', (done) => {
        request(app)
            .get('/node')
            .query({ searchTerm: 'dentista en cdmx' })
            .set('Content-Type', 'application/json')
            .expect('Content-Type', /charset=utf-8/)
            .expect(200, function (err, res) {
                if (err) { return done(err); }
                const total = res.body.total;

                request(app)
                    .get('/node')
                    .query({ 
                        searchTerm: res.body.location.search_term,
                        physicalcity: res.body.location.physicalcity,
                        physicalstate: res.body.location.physicalstate
                     })
                    .set('Content-Type', 'application/json')
                    .expect('Content-Type', /charset=utf-8/)
                    .expect(200, function (err, res) {
                        if (err) { return done(err); }
                        console.log(res.body.location);
                        
                        assert.equal(total, res.body.total);
                        done();
                    });
            });
    });
});