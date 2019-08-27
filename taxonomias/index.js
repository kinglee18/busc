const neg = require('./getNegocios');
const blog = require('./getBlog');
const claro = require('./getClaro');

function run(page) {
    blog.runAllBlog(page).then(() => {
        return claro.runAllProd(page);
    }).then(() => {
        return neg.runAllNeg(page);
    }).then(() => {
        console.log('Termino la Indexacion');
    })
}

run(0);