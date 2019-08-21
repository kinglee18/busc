const client = require('./client');

/*function adn() {
	return {
            "index": "scrapping",
            "type": "default",
            "body": {
                "size":1,
                "query": {
                    "match_all":{}
                },
                "sort":
                {
                    "date":"desc"
                }
			}

        };        
}*/

function blog() {
	return {
            "index": process.env.blog,
            "type": "default",
            "body": {
                "size":1,
                "query": {
                    "match_all":{}
                },
                "sort":
                {
                    "date":"desc"
                }
			}

        };        
}

function blogCtg(nombre) {
	let query = {
    "index": process.env.blog,
    "type": "default",
    "body": {
        "size": 1,
        "query": {
            "nested": {
              "path": "categories",
              "query": {
                "bool": {
                  "must": [
                    { "match_phrase": { "categories.title": nombre }}
                  ]
                }
              }
            }
          },
          "sort": [
            {
              "date": {
                "order": "desc"
              }
            }
          ]        
    }
  }
	
	return query;
}

function claro() {
	return {
            "index": process.env.claro_shop,
            "type": "default",
            "body": {
                "size":3,
                "query": {
                    "match_all":{}
                },
                "sort":
                {
                    "date":"desc"
                }
			}

        };        
}

function neg() {
	return {
            "index": process.env.negocios,
            "type": "default",
            "body": {
                "size":1,
                "query": {
                    "match_all":{}
                }
			}


        };        
}

exports.inicio = function() {
    
    
    let promesa = new Promise((resolve,reject) => {

        Promise.all([
            client.getClient().search(neg()),
            client.getClient().search(blog())
        ]).then((resp) => {
            let blog = resp[1].hits.hits;
            let neg = resp[0].hits.hits;
            let arrBlog = [];
            let arrNeg = [];
            for(let op of blog) arrBlog.push(op._source);
            for(let op of neg) arrNeg.push(op._source);
            resolve({
                blog: arrBlog,
                neg: arrNeg
            })
        })

    });

    return promesa;

}

exports.inicio2 = async function() {

    let resp = await Promise.all([
        client.getClient().search(blogCtg('¿Qué hacer?')),
        client.getClient().search(blogCtg('¿Qué comer?')),
        client.getClient().search(blogCtg('¿Cómo cuidarse?')),
        client.getClient().search(blogCtg('Tu negocio'))
    ]);

    let arr = [];

    arr.push(resp[0].hits.hits[0]._source);
    arr.push(resp[1].hits.hits[0]._source);
    arr.push(resp[2].hits.hits[0]._source);
    arr.push(resp[3].hits.hits[0]._source);

    return arr;

}



