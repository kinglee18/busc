const request = require('request');
const iconv  = require('iconv-lite');

exports.autocomplete = function(texto) {
    let busq = texto.trim();
    let url = `http://suggestqueries.google.com/complete/search?output=firefox&hl=es-mx&q=${busq}`
    const requestOptions  = { encoding: null, method: "GET", uri: url};
    let arr = [];

    
   return new Promise((resolve,reject) => {
        request(requestOptions, function (error, response, body) {
            if(response.statusCode == 200) {
                let cad = iconv.decode(new Buffer(body), "ISO-8859-1");
                let arreglo = JSON.parse(cad);
                if(arreglo.length > 0) {
                    if(arreglo.length >= 1) {
                        for(let op of arreglo[1]) {
                            arr.push(op)
                        }
                    }
                }
            }
            resolve(arr);
        });
   });
}