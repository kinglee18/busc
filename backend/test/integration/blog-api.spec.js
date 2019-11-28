
var request = require('supertest');
var assert = require('chai').assert;
const app = require('../../index').app;
const config = require('../../config');

describe('Blog services tests', () => {
    before(() => {
        process.env = Object.assign(process.env, config['test']);
    });
    it('should return a 200 http status, info attribute and articles count from blog using search term ', (done) => {
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
    it('should return a 200 http status, info attribute and articles count from blog, using a blog category', (done) => {
        request(app)
            .get('/node/blog')
            .query({ category: 'quehacer' })
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
