'use strict'
const accents = require('remove-accents');
const fs = require('fs');

const elasticsearch = require('elasticsearch');
const client = new elasticsearch.Client({
    host: '172.18.1.96:9200'
});

let json = {
    autor: [],
    ctg: [],
    tags: []
}

function getElastic(page) {
    return client.search({
        "index": "blog_secam",
        "body": {
            "size": 100,
            "from": page*100,
            "query": {
                "match_all":{}
            }
        }
    })
}

//exports.runBlog = function(page) {
function runBlog(page) {
    let total = 0;
    //let page = 0;

    let promesa = new Promise((resolve,reject) => {
        getElastic(page).then((resp) => {
            let datos = resp.hits.hits;
            let total = resp.hits.total;
    
            for(let op of datos) {
                let nom = op._source.author.nickname.toLowerCase();
                if(!json.autor.includes(nom)) json.autor.push(nom);
    
                if(op._source.categories.length > 0) {
                    for(let op2 of op._source.categories) {
                        let nv = clear(op2.slug);
                        if(!json.ctg.includes(nv)) json.ctg.push(nv);
                    }
                }
    
                if(op._source.tags.length > 0) {
                    for(let op2 of op._source.tags) {
                        let nv = clear(op2.title);
                        if(!json.tags.includes(nv)) json.tags.push(nv);
                    }
                }
            }
    
            if( ( (page + 1) * 100) <= total) {
                page++;
                console.log('Analizados: '+((page + 1)*100)+' de '+total);
                return runBlog(page);
            }else {
                console.log(json.autor.length+'===='+json.ctg.length+'==='+json.tags.length);
                
                insertAutor(json.autor).then(() => {
                    console.log('Termino Autor')
                    return insertCtg(json.ctg);
                }).then(() => {
                    console.log('Termino Tags')
                    return insertTags(json.tags);
                }).then(() => {
                    console.log('Termino Blog');
                    resolve();
                })
            }
    
        })
    })

    return promesa;
}

function clear(tx) {
    tx = tx.toLowerCase();
    tx = accents.remove(tx);
    if(tx.includes('-')) {
        let palabras = Array.from(tx);
        for(let i in palabras) {
            if(palabras[i] == '-') palabras[i] = ' ';
        }
        tx = palabras.join('');
    }
    return tx;

}

async function insertAutor(arreglo) {
    for(let op2 of arreglo) {
        await client.create({
            index: 'taxonomias_globales',
            type: 'default',
            id: new Date().getTime(),
            body: {
                fuente: 'blog',
                valor: op2,
                relacion: [],
                tipo: 'autor'
            }
        });
   }
   return;
}

async function insertCtg(arreglo) {
    for(let op2 of arreglo) {
        await client.create({
            index: 'taxonomias_globales',
            type: 'default',
            id: new Date().getTime(),
            body: {
                fuente: 'blog',
                valor: op2,
                relacion: [],
                tipo: 'categoria'
            }
        });
   }
   return;
}

async function insertTags(arreglo) {
    for(let op2 of arreglo) {
        await client.create({
            index: 'taxonomias_globales',
            type: 'default',
            id: new Date().getTime(),
            body: {
                fuente: 'blog',
                valor: op2,
                relacion: [],
                tipo: 'tags'
            }
        });
   }
   return;
}


runBlog(0);

//clear('cuidad-de-mexico')