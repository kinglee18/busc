
var request = require('supertest');
var assert = require('chai').assert;
const app = require('../../index').app;
const config = require('../../config');

describe('--------------', () => {
    before(() => {
        process.env = Object.assign(process.env, config['test']);
    });

    const tests = [
        { input: "hotel EN DF", output: { search_term: "hotel", physicalstate: 'DISTRITO FEDERAL' } },
        { input: "hotel en morelos", output: { search_term: "hotel", physicalstate: 'MORELOS' } },
        { input: "hotel en oaxaca", output: { search_term: "hotel", physicalstate: 'OAXACA' } },
        { input: "hotel en mexico", output: { search_term: "hotel", physicalstate: 'MEXICO' } },
        { input: "hotel en san luis", output: { search_term: "hotel", physicalstate: 'SAN LUIS POTOSI' } },

         {
            input: "hotel en guadalajara", output: {
                "physicalcity": "GUADALAJARA",
                "physicalstate": "JALISCO",
                "search_term": "hotel"
            }
        }, 
        {
            input: "hotel en centro de tlalpan", output: {
                search_term: "hotel",
                physicalstate: 'DISTRITO FEDERAL',
                "physicalcity": "TLALPAN",
                colony: "TLALPAN CENTRO", "postal_code": "14000"
            }
        },
        {
            input: "hotel en tlalpan centro", output: {
                search_term: "hotel",
                physicalstate: 'DISTRITO FEDERAL',
                "physicalcity": "TLALPAN",
                colony: "TLALPAN CENTRO", "postal_code": "14000"
            }
        },
        {
            input: "hotel en peña pobre", output: {
                search_term: "hotel",
                physicalstate: 'DISTRITO FEDERAL',
                "physicalcity": "TLALPAN",
                colony: "PEÑA POBRE", "postal_code": "14060"
            }
        },
        {
            input: "hotel en 04400", output: {
                search_term: "hotel",
                physicalstate: 'DISTRITO FEDERAL',
                "physicalcity": "COYOACAN",
                "postal_code": "04400"
            }
        },
        { input: "hotel DF", output: { search_term: "hotel", physicalstate: 'DISTRITO FEDERAL' } },
        { input: "hotel morelos", output: { search_term: "hotel", physicalstate: 'MORELOS' } },
        { input: "hotel oaxaca", output: { search_term: "hotel", physicalstate: 'OAXACA' } },
        { input: "hotel mexico", output: { search_term: "hotel", physicalstate: 'MEXICO' } },
        { input: "hotel san luis potosi", output: { search_term: "hotel", physicalstate: 'SAN LUIS POTOSI' } },
        { input: "hotel jalisco", output: { search_term: "hotel", physicalstate: 'GUADALAJARA', physicalstate: "JALISCO" } },
        { input: "hotel en cuautla morelos", output:  { "physicalstate": "MORELOS", "physicalcity": "CUAUTLA", "search_term": "hotel" } },
        { input: "hotel cuautla morelos", output:  { "physicalstate": "MORELOS", "physicalcity": "CUAUTLA", "search_term": "hotel" } },
        { input: "universidad simon bolivar", output:  { "search_term": "universidad simon bolivar" } },
        { input: "farmacias guadalajara", output:  { "search_term": "farmacias guadalajara" } },
        { input: "casas de campaña", output:  { "search_term": "casas de campaña" } },
        { input: "construcciones en general", output:  { "search_term": "construcciones en general" } },
        {
            input: "hotel en portales", output: {
                search_term: "hotel",
                physicalstate: 'DISTRITO FEDERAL',
                "physicalcity": "BENITO JUAREZ",
                colony: "PORTALES SUR", "postal_code": "03300"
            }
        }
    ];
    for (var i of tests) {
        makeTest(i);
    }

    function makeTest(opc) {
        it("It shoud fragment the input " + opc.input, function () {
            const agent = request.agent(app);

            return agent.get('/node')
                .query({
                    "searchTerm": opc.input,
                    "show_business": false
                })
                .then(response => {
                    assert.deepEqual(response.body.location, opc.output);
 
                });
        });
    }
});