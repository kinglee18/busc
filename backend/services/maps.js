const axios = require('axios');
const cls = require('../analyzer/clear');
const syn = require('../info/syn_where');
const CITIES_TO_EXCLUDE = require('../info/cities');


exports.search = async function (address) {
    let resp = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: {
            address,
            components: 'country:MX',
            key: 'AIzaSyBJ30F-VdmTxvItBP3uqIEso1RfD_6-Z3M'
        }
    });
    if (resp.data.status == 'OK') {
        if (resp.data.results[1])
            return parseAddress(resp.data.results[1]);
        return parseAddress(resp.data.results[0]);
    }
    console.error("Fallo al buscar ubicacion");
}

function parseAddress(location) {
    let address = {}

    for (let desc of location.address_components) {
        let name = cls.clearTexto(desc.long_name);
        if (desc.types.includes("postal_code")) {
            address.postalCode = name;
        }
        if ((desc.types.includes("street_number") || desc.types.includes("route") || desc.types.includes('neighborhood')) && !address.postalCode) {
            return;
        }
        if (desc.types.includes("sublocality") || desc.types.includes("sublocality_level_1")) {
            address.colony = name;
        }

        else if (desc.types.includes('administrative_area_level_2') || desc.types.includes('administrative_area_level_3') || (desc.types.includes('locality'))) {
            if (name === 'mexico city' || name === 'ciudad de mexico')
                address.physicalstate = name;
            else
                address.physicalcity = name;
        }
        else if (desc.types.includes('country') && !address.physicalstate) {
            address.physicalstate = 'mexico';
        }
        else if (desc.types.includes('administrative_area_level_1')) {
            address.physicalstate = name;
        }

    }
    address.physicalcity = cleanCityName(address.physicalcity);
    address.physicalstate = getSAStatename(address.physicalstate);
    return address;
}

/**
 * 
 * @param {string} city - name of the city to delete
 * @description - delete the name of the city which is the same as the state
 */
function cleanCityName(city) {
    for (let cityName of CITIES_TO_EXCLUDE.data) {
        if (city === cityName) return null;
    }
    return city;
}

function getSAStatename(state) {
    for (let op of syn.SAStatenames) {
        if (op.valor == state) {
            return op.simb;
        }
    }
    return state;
}
