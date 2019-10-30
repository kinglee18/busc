const cls = require('./clear');

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