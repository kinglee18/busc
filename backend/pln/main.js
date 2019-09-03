const spawn = require('child_process').spawn

exports.rules = function(texto) {
    let promesa = new Promise((resolve,reject) => {

        
        const create = spawn('python',['./pln/rules.py']);

        let data = {
            texto: texto
        }
        let body = '';

        create.stdout.on('data',(resp) => {
            body += resp
        });
        
        create.stdout.on('end',() => {
            //let r = JSON.stringify(JSON.parse(body.trim()));
            resolve(body)
        })
        
        create.stdin.write(JSON.stringify(data));
        create.stdin.end()

    })
    
    return promesa;
}

