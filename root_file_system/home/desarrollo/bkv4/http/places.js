const axios = require('axios');

exports.getPlaces = async function(json) {

    let palabras = [];
    let data = [];
    if(Object.keys(json.where.maps).length > 0 || json.where.estado) {
    //if((json.neg.ctg.length > 0 || json.neg.pys.length > 0) && (json.where.estado || Object.keys(json.where.maps).length > 0 ) ) {
        palabras = json.old.split(' ');
        //if(json.neg.pys.length > 0) palabras.push(json.neg.pys[0]);
        //if(json.where.street) palabras.push(json.where.palabras);
        //if(json.where.city) palabras.push(json.where.city);
        //if(json.where.estado) palabras.push(json.where.estado);
        //if(Object.keys(json.where.maps).length > 0 && json.where.maps.dir.estado) palabras.push(json.where.maps.dir.estado);
        
            
            let busq = palabras.join('+');
            console.log('Busquedad: '+busq);
            let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${busq}&language=es&key=AIzaSyBJ30F-VdmTxvItBP3uqIEso1RfD_6-Z3M`;
        
            await axios.get(url).then((info) => {
                //console.log(JSON.stringify(info.data));
                if(info.data.status == 'OK') {
                    console.log('Datos ================>'+info.data.results.length)
                    
                    if(info.data.results.length > 10) {
                        data = info.data.results.slice(0,10);
                    }
                    else data = info.data.results;
                }
    
                
            })
        
    }
    
    return data;

    

}


