const accents = require('remove-accents');
const sw = require('stopword')

exports.cls = function(tx) {
    let promesa = new Promise((resolve,reject) => {
        tx = letters(tx);
        resolve(tx)
    })

    return promesa;
}


function letters(texto) {
    texto = texto.toLowerCase();
    texto = accents.remove(texto);
    let frag = texto.split('');
    frag.push(' ')
    let bn = false;
    let tx = "";
    let palabras = [];
    for(let p in frag) {
        let num = frag[p].charCodeAt(0);
        if(num == 32 || num == 37 || num == 36) {
            if(tx.length > 0) {
                palabras.push(tx.trim());
                tx = "";
            }
        }
        else if(!(num<97 && (num<48 || num>57) || num >122)) {
            tx = tx +frag[p]
        }
    }
    return palabras.join(' ');
}



exports.clearTexto = function(tx) {
    tx = tx.toLowerCase();
    tx = accents.remove(tx);
    return tx;
}

exports.clearStopWord = function(tx) {
    tx = removeStopLt(tx);
    return tx;
}

exports.clearAllStopWords = function(tx) {
    let palabras = tx.split(' ');
    let cad = sw.removeStopwords(palabras, sw.es);
    return cad.join(' ');
}

function removeStopLt(tx) {
    tx = tx.trim();
    let palabras = tx.split(' ');
    let valid = sw.removeStopwords(palabras, sw.es);
    let final = palabras[palabras.length - 1];
    let inicio = palabras[0];
    if(!valid.includes(final) || !valid.includes(inicio)) {
        if(!valid.includes(final)) palabras.pop();
        if(!valid.includes(inicio)) palabras.shift();

        return removeStopLt(palabras.join(' '));
    }
    else return palabras.join(' ').trim();
    
}
