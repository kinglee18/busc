const axios = require('axios');
const cls = require('../analyzer/clear');

exports.search = async function (texto) {
    let palabras = texto.split(' ');
    let busq = palabras.join('+');
    let url = `https://maps.googleapis.com/maps/api/geocode/json?address=${busq}&&components=country:MX&key=AIzaSyBJ30F-VdmTxvItBP3uqIEso1RfD_6-Z3M`;
    let resp = await axios.get(url);
    if (resp.data.status == 'OK') {
        return {
            lat: resp.data.results[0].geometry.location.lat,
            lng: resp.data.results[0].geometry.location.lng,
            dir: getDir2(resp.data.results[0].address_components)
        }
    }
    console.error("Fallo al buscar ubicacion");

}

function getDir2(arreglo) {
    let json = {
        estado: null,
        city: null,
        colony: null
    }
    for (let op of arreglo) {
        if (op.types.includes('administrative_area_level_1')) {
            let valor = cls.clearTexto(op.long_name);
            if (valor == 'ciudad mexico' || valor == 'ciudad de mexico' || valor == 'mexico city') valor = 'distrito federal';
            else if (valor == 'state of mexico') valor = 'mexico';
            json.estado = valor;
        }
    }

    return json;
}

