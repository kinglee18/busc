const axios = require('axios');
const cls = require('../analyzer/clear');

exports.search = async function(texto) {
    let palabras = texto.split(' ');
    let busq = palabras.join('+');
    //console.log('Busqueda del Where: '+busq);
    let url = `https://maps.googleapis.com/maps/api/geocode/json?address=${busq}&&components=country:MX&key=AIzaSyBJ30F-VdmTxvItBP3uqIEso1RfD_6-Z3M`;
    
    let resp = await axios.get(url);
    let lat = null;
    let lng = null;
    let dir = null;

    if(resp.data.status == 'OK') {
       // console.log(JSON.stringify(resp.data.results,undefined,2));
        
        lat = resp.data.results[0].geometry.location.lat;
        lng = resp.data.results[0].geometry.location.lng;
        dir = getDir2(resp.data.results[0].address_components);
    }

    return {
        lat,
        lng,
        dir
    }
}


function getDir(texto) {
    let json = {
        estado:null,
        city:null,
        colony:null
    }
    console.log('palabras a cortar: '+texto);
    let palabras = texto.split(',');
    let arr = [];
    for(let op of palabras) arr.push(op.trim());

    let tam = arr.length - 2;

    if(tam >= 0) {
        json.estado = cls.clearTexto(arr[tam]);
        if(json.estado == 'ciudad mexico' || json.estado == 'ciudad de mexico' || json.estado == 'mexico city') json.estado = 'distrito federal';
    }
    //tam--;
    //if(tam >= 0) json.city = arr[tam].toLowerCase();
    //tam--;
    //if(tam >= 0) json.colony = arr[tam].toLowerCase();



    return json;
}


function getDir2(arreglo) {
    let json = {
        estado:null,
        city:null,
        colony:null
    }
    for(let op of arreglo) {
        if(op.types.includes('administrative_area_level_1')) {
            let valor = cls.clearTexto(op.long_name);
            if(valor == 'ciudad mexico' || valor == 'ciudad de mexico' || valor == 'mexico city') valor = 'distrito federal';
            else if(valor == 'state of mexico') valor = 'mexico';
            json.estado = valor;
        }
    }

    return json;
}

