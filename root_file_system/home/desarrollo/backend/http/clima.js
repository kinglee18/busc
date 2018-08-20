const axios = require('axios');

const getClima = async(where) => {

    let data = null;

    if(Object.keys(where.maps).length > 0 && where.maps.lat && where.maps.lng) {
        let resp = await axios.get(`http://api.openweathermap.org/data/2.5/weather?lat=${where.maps.lat}&lon=${where.maps.lng}&units=metric&appid=49da1b79db9561c6c226980baa065e7f`);
        //console.log(JSON.stringify(resp.data,undefined,2));
        data = {
            temp: resp.data.main.temp,
            lug: resp.data.name
        };
    }

    

    return data;

}

module.exports = {
    getClima
}