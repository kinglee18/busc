//const axios = require('axios');
const request = require('request');
const iconv  = require('iconv-lite');

//console.log('querystring:', querystring.parse(input) );
//console.log('qs         :', qs.parse(input) );


exports.autocomplete = function(texto) {
    let busq = texto.trim();
    let url = `http://suggestqueries.google.com/complete/search?output=firefox&hl=es-mx&q=${busq}`
    const requestOptions  = { encoding: null, method: "GET", uri: url};
    let arr = [];

    
   return new Promise((resolve,reject) => {
        request(requestOptions, function (error, response, body) {
            //console.log('error:', error); // Print the error if one occurred
            //console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
            if(response.statusCode == 200) {
                let cad = iconv.decode(new Buffer(body), "ISO-8859-1");
                let arreglo = JSON.parse(cad);
                //console.log(arreglo);
                if(arreglo.length > 0) {
                    //arr.push(arreglo[0]);
                    if(arreglo.length >= 1) {
                        for(let op of arreglo[1]) {
                            arr.push(op)
                        }
                    }
                }

            }

            resolve(arr);
            
            
        });
   })

   
    

}