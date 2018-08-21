const cls = require('./clear');

exports.priori = function(json) {
    
    let promesa =  new Promise((resolve,reject) => {

        let ind = '';
        let numNeg = (json.neg.ctg.length/3)+(json.neg.pys.length/3)+(json.neg.bn.length/3);
        let numBlog = (json.blog.tags.length/2)+(json.blog.ctg.length/2);
        let numClaro = (json.claro.marcas.length/3)+(json.claro.ctg.length/3)+(json.claro.bn.length/3);
    
        if(numNeg>numBlog && numNeg>numClaro) ind = 'negocios';
        else if(numBlog>numNeg && numBlog>numClaro) ind = 'blog';
        else if(numClaro>numNeg && numClaro>numNeg) ind = 'productos';

        resolve(ind);

    });

    return promesa;

    
}

exports.probWords = function(tx1,tx2){

    tx1 = cls.clearAllStopWords(tx1);
    tx2 = cls.clearAllStopWords(tx2);
    
    let cad;
    let ref;
    let ind = false;
    if(tx1.length >= tx2.length) {
        ref = tx1;
        cad = tx2;
    }
    else {
        ref = tx2;
        cad = tx1;
    }

    let palabras = cad.split(' ');
    let sum = 0;
    let total = ref.split(' ').length;
    
    

    for(let op of palabras) {
        if(ref.includes(op)) sum++;
    }

    if( (sum/total) >= 0.5 ) ind = true;

    return ind;


    
}

exports.calcPrio = function(json) {
    let valorWhere = 0;

    if(json.where.lat || Object.keys(json.where.maps).length > 0) {
        valorWhere = 1;
    }

    let neg = expResult(json.neg.ctg,json.neg.pys,json.neg.bn);
    if(valorWhere != 0) {
        neg = neg + parseFloat(Math.exp(valorWhere).toFixed(4));
    }
    let claro = expResult(json.claro.marcas,json.claro.ctg,json.claro.bn)
    let blog = expResult(json.blog.ctg,json.blog.tags,[]);

    console.log('CTG=>',neg,'Claro=>',claro,'Blog=>',blog);
    let ruta = null;

    if(neg > claro && neg > blog ) ruta = 'negocios';
    else if(blog > claro && blog > neg) ruta = 'blog';
    else if(claro > blog && claro > neg) ruta = 'productos';
    else if(neg == claro || neg == blog ) ruta = 'negocios';
    else if(blog == claro || blog == neg) ruta = 'blog';
    else if(claro == blog || claro == neg) ruta = 'productos';

    return ruta;

    

}

function expResult(p1,p2,p3) {
    let valor = [];
    if(p1.length > 0) valor.push(Math.exp(p1.length))
    if(p2.length > 0) valor.push(Math.exp(p2.length))
    if(p3.length > 0) valor.push(Math.exp(p3.length))

    let r = 0;

    for(let op of valor) {
        r = parseFloat(r) + parseFloat(op.toFixed(4));
    }

    return r;
        
    
}