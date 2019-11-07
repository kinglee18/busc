
var request = require('supertest');
var assert = require('chai').assert;
const app = require('../../index').app;

describe('Business services tests', () => {
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


    it('should return a 200 http status, info attribute and articles count from blog', (done) => {
        request(app)
            .get('/node/blog')
            .query({ searchTerm: 'amaranto' })
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