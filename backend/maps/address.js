const axios = require('axios');
const cls = require('../analyzer/clear');

exports.search = async function (texto) {
    let palabras = texto.split(' ');
    let busq = palabras.join('+');
    let url = `https://maps.googleapis.com/maps/api/geocode/json?address=${busq}&&components=country:MX&key=AIzaSyBJ30F-VdmTxvItBP3uqIEso1RfD_6-Z3M`;
    let resp = await axios.get(url);
    if (resp.data.status == 'OK') {
        return parseAddress(resp.data.results[0].address_components)

    }
    console.error("Fallo al buscar ubicacion");
}

function parseAddress(arreglo) {
    let address = {}
    for (let op of arreglo) {
        let name = cls.clearTexto(op.long_name);
        if (op.types.includes("street_number") || op.types.includes("route") || op.types.includes('neighborhood')) {
            return;
        }
        if (op.types.includes("political") && op.types.includes("sublocality") && op.types.includes("sublocality_level_1")) {
            address.colony = name;
        }
        else if (op.types.includes('administrative_area_level_3') || (op.types.includes('locality') && op.types.includes('political'))) {
            address.municipality = name;
        }
        else if (op.types.includes('administrative_area_level_1')) {
            if (name == 'ciudad mexico' || name == 'ciudad de mexico' || name == 'mexico city') name = 'distrito federal';
            else if (name == 'state of mexico') name = 'mexico';
            address.state = name;
        }
    }
    return address;
}

