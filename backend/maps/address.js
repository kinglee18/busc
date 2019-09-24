const axios = require('axios');
const cls = require('../analyzer/clear');
const syn = require('../info/syn_where');

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

function parseAddress(location) {
    let address = {}

    for (let desc of location) {
        let name = cls.clearTexto(desc.long_name);

        if (desc.types.includes("street_number") || desc.types.includes("route") || desc.types.includes('neighborhood')) {
            return;
        }
        if (desc.types.includes("sublocality") || desc.types.includes("sublocality_level_1")) {
            address.colony = name;
        }
        else if (desc.types.includes('administrative_area_level_3') || (desc.types.includes('locality'))) {
            if (name === 'mexico city')
                address.state = 'mexico city';
            else
                address.city = name;
        }
        else if (desc.types.includes('country') && !address.state) {
            address.state = 'mexico city';
        }
        else if (desc.types.includes('administrative_area_level_1')) {
            address.state = name;
        }
    }

    return address;// no entrega result de copyoacan 
}

function getAbrevWhere(estado) {
    for (let op of syn.data) {
        if (op.valor == estado) {
            return op.simb;
        }
    }
    return null;
}