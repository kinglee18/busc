const main = require('../pln/main');
const cls = require('./clear');

exports.pln = function(texto) {
    
    let promesa = new Promise((resolve,reject) => {
        console.log('Dentro PLN');
        main.rules(texto).then((resp) => {
            let info = JSON.parse(JSON.stringify(resp));
            //console.log(info);
            let data = findAll(texto,info);
            resolve(data);            
        })
    })

    return promesa;
}

function sust(a,b) {
    a = a.replace(b,'');
    a.trim();
    return a;
}



function findAll(tx,arreglo) {
    let json = {
        hrs: null,
        pay: null,
        price: null,
        desc: null,
        texto: ''
    }
    
    json.texto = tx;

    for(let op of arreglo) {
        json.texto = sust(json.texto,op.valor);
        if(op.tipo == "HORARIO") json.hrs = findHrs(op.valor);
        if(op.tipo == "PAGOS") json.pay = findPay(op.valor);
        if(op.tipo == "PRECIO") json.price = findPrice(op.valor);
        if(op.tipo == "DESCUENTO_NUM") json.desc = findPorcen(op.valor);
    }

    json.texto = cls.clearStopWord(json.texto);

    return json;

    
}


function findHrs(valor) {
    let nv = null;
    let date = new Date();
    let arr = [
        {
            'valor':'ahorita',
            'hrs': zero(date.getHours())+':'+zero(date.getMinutes())+':'+zero(date.getSeconds()),
            "day": [findDay(date.getDay())]
        },
        {
            'valor':'ahora',
            'hrs': zero(date.getHours())+':'+zero(date.getMinutes())+':'+zero(date.getSeconds()),
            "day": [findDay(date.getDay())]
        },
        {
            'valor':'manana',
            'hrs': null,
            "day": [findDay(date.getDay()+1)]
        },
        {
            'valor':'pasado manana',
            'hrs': null,
            "day": [findDay(date.getDay()+2)]
        },
        {
            'valor':'fin de semana',
            'hrs': null,
            "day": [findDay(5),findDay(6)]
        },
        {
            'valor':'lunes',
            'hrs': null,
            "day": [findDay(1)]
        },
        {
            'valor':'martes',
            'hrs': null,
            "day": [findDay(2)]
        },
        {
            'valor':'miercoles',
            'hrs': null,
            "day": [findDay(3)]
        },
        {
            'valor':'jueves',
            'hrs': null,
            "day": [findDay(4)]
        },
        {
            'valor':'viernes',
            'hrs': null,
            "day": [findDay(5)]
        },
        {
            'valor':'sabado',
            'hrs': null,
            "day": [findDay(6)]
        },
        {
            'valor':'domingo',
            'hrs': null,
            "day": [findDay(0)]
        }
    ];
    for(let op of arr) {
        
        let reg = new RegExp("\\b"+op.valor+"\\b");
        let matches = valor.match(reg);
        if(matches) {
            nv = op;
        }
    }

    return nv;
}

function findPay(valor) {
    let nv = null;
    let arr = [
        'visa',
        'master card',
        'efectivo',
        'vales',
        'cheques',
        'paypal',
        'cheques'
    ];

    for(let op of arr) {
        let reg = new RegExp("\\b"+op+"\\b");
        let matches = valor.match(reg);
        if(matches) {
            nv =matches[0];
        }
    }

    return nv;
}

function findPrice(valor) {
    let num = clearPrice(valor);
    return {
        min: num*(0.9),
        max: num*(1.1)
    }
}


function clearPrice(texto) {
    texto = sust(texto,'$');
    texto = sust(texto,'pesos');
    return parseInt(texto);
}

function findPorcen(valor) {
    let nv = null;
    let arr = clearDesc(valor).split(' ');
    for(let op of arr) {
        let num = parseInt(op)
        if(Number.isInteger(num)) nv = num;
    }

    return nv;
}

function clearDesc(texto) {
    texto = sust(texto,'%');
    return texto;
}


function zero(num) {
    let nv = '';
    if(num <10) {
        nv = '0'+num;
    }
    nv = ''+num;
    
    return nv;
} 

function findDay(num) {
    let nv = null;
    if(num == 0) nv = "sunday";
    else if(num == 1) nv = "monday";
    else if(num == 2) nv = "tuesday";
    else if(num == 3) nv = "wednesday";
    else if(num == 4) nv = "thursday";
    else if(num == 5) nv = "friday";
    else if(num == 6) nv = "saturday";

    return nv;
}

