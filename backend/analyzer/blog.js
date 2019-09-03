const elastic = require('../elastic/analyzer_blog');
const cls = require('./clear');

exports.blog = function(tx) {
    let blog = {
        ctg: [],
        tags: []
    }

    let promesa = new Promise((resolve,reject) => {
        
        elastic.query_blog_all(tx).then((resp) => {
            let data = findBlog(tx,resp.hits.hits);
            blog.ctg = data.ctg;
            blog.tags = data.tags;
            resolve(blog);
        });   
    });

    return promesa;

}


function findBlog(tx,arreglo) {
    let ctg = [];
    let tags = [];
    let palabras = tx.split(' ');
    for(let op of arreglo) {
        for(let p of palabras) {
            if(op._source.valor.includes(p)) {
                if(op._source.tipo == 'tags' && !tags.includes(op._source.valor)) tags.push(op._source.valor);
                if(op._source.tipo == 'categoria' && !ctg.includes(op._source.valor)) ctg.push(op._source.valor);
                break;
            }
        }
        
    }

    return {
        ctg:ctg,
        tags:tags
    }
}
