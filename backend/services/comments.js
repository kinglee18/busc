const axios = require('axios');
const convert = require('xml-js');

exports.allComments = async function(arreglo) {
    let arr = [];
    for(let op of arreglo) {
        await getComment(op).then((info) => {
            arr.push(info);
        })
    }

    return arr;
}

//exports.getComment = function(id) {
function getComment(id) {
    let promesa = new Promise((resolve,reject) => {
        let url = `http://o2.agendize.com/w1/web/templates/adsa/gcomments.jsp?virtual=true&mapping=sa&type=xml&author=adsa&id=${id}&scope=reviewSummary,reviewDetails`
        axios.get(url).then((resp) => {
            
            const result = convert.xml2json(resp.data, {compact: true});
            let info = JSON.parse(result);
            let data = getData(info);
            
            resolve(data)
        })
    });

    return promesa;
}

function getData(json) {
    
    let msj = [];
    let sum = 0;
    let rating = 0;
    let total = 0;
    if(json.hasOwnProperty('agendize') && json.agendize.hasOwnProperty('entry') && json.agendize.entry.length > 0) {
        msj = json.agendize.entry
        for(let op of json.agendize.entry) {
            for(let op2 of op['entry-value']) {
                if(op2._attributes.name == 'rating') {
                    total++;
                    sum = sum + parseInt(op2._attributes.value);
                    break;
                }
            }
        }
    }

    

    return {
        msj,
        total: msj.length,
        rating: sum == 0 ? 0:parseInt(sum/total)
    }
}



