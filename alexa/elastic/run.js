'use strict'
const syn = require('../info/syn_where');
const config = require('../config');

const elasticsearch = require('elasticsearch');
const client = new elasticsearch.Client({
    host: config.ip,
    httpAuth: config.elasticAuth
});


exports.negocios = function(page,ctg,pys,bn,hrs,pay,where)  {
    
    let promesa = new Promise((resolve,reject) => {
        let busq = [];
        let busq2 = [];
        let filtro = [];
        let ub = [];
        let busqCtg = []
        //console.log(where);
        if(ctg.length > 0) {
            let arr = [];
            let arr2 = [];
            for(let op of ctg) {
                arr.push({
                    "match_phrase": {
                        'Appearances.Appearance.categoryname':op
                    }
                });
            }
            //busqCtg = arr;
            busq = busq.concat(arr);
            //filtro = filtro.concat(arr2);
        }
        if(pys.length > 0) {
            let arr1 = []; 
            let arr2 = [];

            for(let op of pys) {
                arr1.push({
                    "match_phrase":  { 
                        'productservices.prdserv': op
                    }
                })
                arr2.push({
                    "match": {
                        "productservices.prdserv":op
                    }
                })
            }

            //arr1 = arr1.concat(busqCtg);

            /*let pos =  {
                "bool": {
                  "should": arr1
                }
            }*/
            if(ctg.length == 0 && bn.length == 0) {
                //busq = busq.concat(arr1);
                busq2 = busq2.concat(arr1);
            }
            else {
                //busq = busq.concat(arr1);
                busq2 = busq2.concat(arr1);
                //filtro = filtro.concat(arr1);
            }
            //
            
        }
        if(bn.length > 0) {
            let arr = [];
            let arr2 = [];
            for(let op of bn) {
                arr.push({
                    "match_phrase": {
                        "bn": op
                    }
                })

                arr2.push({
                    "match_phrase": {
                        "bn": op
                    }
                })
            }


            busq = busq.concat(arr);
            //filtro = filtro.concat(arr2);
        }

        

        

        if(where.maps.lat && where.maps.lng) {
            //if(!where.estado) {
                where.estado = where.maps.dir.estado;
                console.log('Estado Asignado: '+where.estado);
                ub = setWhere(where)
            //}
            if(where.maps && where.maps.dir.estado) {
                filtro.push({
                    bool: {
                        should: [
                            /*{
                                match: {
                                    statename: where.maps.dir.estado
                                }
                            },*/
                            {
                                "geo_distance" : {
                                    "distance" : "15km",
                                    "pin" : [where.maps.lng, where.maps.lat]
                                }
                            }
                        ]
                    }
                })
            }
            else {
                filtro.push({
                    "geo_distance" : {
                        "distance" : "15km",
                        "pin" : [where.maps.lng, where.maps.lat]
                    }
                })
            }
            
            
        }
        else if(validWhere(where) && validPys(pys,where) && validCtg(ctg,where)) {
            ub = setWhere(where)
        }
        else if(where.lat && where.lng){
            filtro.push({
                "geo_distance" : {
                    "distance" : "15km",
                    "pin" : [where.lng, where.lat]
                }
            })
        }
        
        let content = {};
        
        //console.log('Validacion Where: '+validWhere(where));
        content = {
            bool: {
                must: [
                    {
                        bool: {
                            must: [
                                {
                                    bool: {
                                        must: busq,
                                        should: busq2
                                    }
                                }
                            ],
                            should: ub
                        }
                    }
                ],
                filter: filtro
            }
        };
        

        console.log(JSON.stringify(content));

        
        
        if(ctg.length > 0 || bn.length > 0 || pys.length > 0 || validWhere(where)) {
            let lat = null;
            let lng = null;
            if(Object.keys(where.maps).length > 0 && where.maps.lat && where.maps.lng) {
                lat = where.maps.lat;
                lng = where.maps.lng
            }
            else if(where.lat && where.lng) {
                lat = where.lat;
                lng = where.lng;
            }

            let td = {} 

            if(lat && lng) {
                td = {
                    "index": config.negocios,
                    "body": {
                        "from": page * 10,
                        "size": 5,
                        "query": content,
                        "sort" : [
                            {
                                "_geo_distance" : {
                                    "pin" : [lng, lat],
                                    "order" : "asc",
                                    "unit" : "km"
                                }
                            }
                        ]
                    
                    } 
                }
            }
            else {
                td = {
                    "index": config.negocios,
                    "body": {
                        "from": page * 10,
                        "size": 5,
                        "query": content
                    
                    } 
                }
            }

            //console.log(JSON.stringify(td));
            
            client.search(td).then((resp) => {
                
                let arr = [];
                let lista = [];
                let sort = [];
                if(resp.hits.total > 0) {
                    for(let op of resp.hits.hits) lista.push(op._source.listadoid);
                    for(let i in resp.hits.hits) {
                        let nv = resp.hits.hits[i]._source;
                        nv.sort = resp.hits.hits[i].hasOwnProperty('sort') ? resp.hits.hits[i].sort:null;
                        arr.push(nv);
                    }
                    /*findComments(lista).then((comments) => {
                        for(let i in resp.hits.hits) {
                            resp.hits.hits[i]._source.comments = comments[i];
                            //console.log(resp.hits.hits[i]._source.comments);
                            arr.push(resp.hits.hits[i]._source);
                            
                        }
                        resolve(arr);
                    });*/
                    resolve({
                        info: arr,
                        total: resp.hits.total
                    });
                    
                   
                }
                else {
                    resolve({
                        info: [],
                        total: 0
                    });
                }
    
               
            })
        }
        else resolve({
            info: [],
            total: 0
        });
    })

    return promesa;


}

exports.limt_neg = function() {
 
    return new Promise((resolve,reject) => {
        client.search({
            "index": config.negocios,
            "body": {
                "size": 100,
                "query": {
                    "match_all": {}
                }
            
            } 
        }).then((resp) => {

            let arr = [];
            for(let op of resp.hits.hits) {
                arr.push(op._source);
            }

            resolve(arr);

        }).catch((e) => {
            console.log(e);
            resolve(null)
        })
    })
}

exports.limt_neg_2 = function(page) {
 
    let pagina = page - 1;
    return new Promise((resolve,reject) => {
        client.search({
            "index": config.negocios,
            "body": {
                "size": 1000,
                "from": pagina*1000,
                "query": {
                    "match_all": {}
                }
            
            } 
        }).then((resp) => {

            let arr = [];
            let total = resp.hits.total;
            for(let op of resp.hits.hits) {
                arr.push(op._source);
            }

            resolve(arr);

        }).catch((e) => {
            console.log(e);
            resolve(null)
        })
    })
}



function validPys(pys,where) {
    let ind = true;
    for(let op of pys) {
        //console.log('('+op+')==>'+where.city);
        if(where.estado == op || where.city == op || where.colony == op) {
            ind = false;
            break;
        }
    }
    console.log('Regresa: '+ind);
    return ind;
}

function validCtg(ctg,where) {
    let ind = true;
    
    for(let op of ctg) {
        let palabras = op.split(' ');
        if(palabras.includes(where.estado) || palabras.includes(where.colony) || palabras.includes(where.city))  {
            ind = false;
            break;
        }
    }
    
    return ind;
}



function setWhere(where) {
    let arr = [];

    if(where.estado) {
        let abrev = getAbrevWhere(where.estado);
        arr.push({
            "match": {
                "statename": {
                    "query": where.estado,
                    "boost": 3
                }
            }
        })
        arr.push({
            "match": {
                "Appearances.Appearance.statename.synonyms": {
                    "query": where.estado,
                    "boost": 3
                }
            }
        })

        arr.push({
            "match": {
                "state.synonyms": {
                    "query": abrev,
                    "boost": 3
                }
            }
        })

        arr.push({
            "match": {
                "Appearances.Appearance.state.synonyms": {
                    "query": abrev,
                    "boost": 3
                }
            }
        })
    }

    if(where.city) {
        arr.push({
            "match": {
                "city": {
                    "query": where.city,
                    "boost": 3
                }
            }
        });
        arr.push({
            "match": {
                "Appearances.Appearance.city": {
                    "query": where.city,
                    "boost": 3
                }
            }
        })
    }

    if(where.colony) {
        arr.push({
            "match": {
                "Appearances.Appearance.colony": {
                    "query": where.colony,
                    "boost": 3
                }
            }
        })
        arr.push({
            "match": {
                "colony": {
                    "query": where.colony,
                    "boost": 3
                }
            }
        })
    }

    return arr;

}

function validWhere(where) {
    let ind =  false;
    if(where.estado || where.city || where.colony) ind =  true;
    return ind;
}

function getAbrevWhere(estado) {
    let abrev = null;
    for(let op of syn.data) {
        if(op.valor == estado) {
            abrev = op.simb;
            break;
        }
    }

    return abrev;
}

exports.businessDetail = function(id) {
  return client.search({
    index: config.negocios,
    body: {
      query: {
        match_phrase: {
          listadoid: id
        }
      }
    }
  });
};

exports.blogApp = (query) => {
    return client.search(query);
}