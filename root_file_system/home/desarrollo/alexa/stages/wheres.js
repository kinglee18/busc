const elastic = require('../elastic/analyzer_where');
const maps = require('../maps/address');
const cls =  require('./clear');
const gram =  require('../info/gramatica');


exports.where = function(texto) {
    
    let ub = {
        estado:null,
        city:null,
        colony:null,
        street:null,
        maps: {}
    }

    let lug = null;
    let onlyTexto = null;
    let exist_prep = false;
    

    let promesa = new Promise((resolve,reject) => {

        /*maps.findWhereMap(texto).then((resp) => {
            resolve(resp);
        })*/
        let nv = findPrepLug(texto);
        if(nv.lug) {
            exist_prep = true;
            texto = '';
            texto = nv.lug;
            maps.search(texto).then((resp) => {
                ub.maps = resp;
                resolve({
                    ub:ub,
                    texto: nv.texto
                })
            })
        }
        else {
            let oldTexto = texto;
            elastic.query_wheres_state(texto).then((resp) => {
                //console.log(JSON.stringify(resp.hits.hits));
               
                let data;
                data = findEstado(texto,resp.hits.hits)
                if(data.status) {
                    texto = sust(texto,data.valor);
                    texto = cls.clearStopWord(texto);
                    ub.estado = data.valor;
                    elastic.query_wheres_city(texto,ub.estado).then((resp) => {
                        data = findCity(texto,resp.hits.hits,data.info);
                        if(data.info.length > 0 && data.status) {
                            texto = sust(texto,data.valor);
                            texto = cls.clearStopWord(texto);
                            ub.city = data.valor;
                            data = findColony(texto,data.info);
                            if(data.status) {
                                //texto = sust(texto,data.valor);
                                ub.colony = data.valor;
                            }
                            ub.exist_prep = exist_prep;
                            resolve({
                                ub:ub,
                                //texto: nv.lug ? nv.texto:texto
                                texto: oldTexto
                            });
                        }
                        else {
                            elastic.query_wheres_colony(texto,ub.estado).then((resp) => {
                                //console.log(resp.hits.hits);
                                data = findOnlyColony(texto,resp.hits.hits);
                                if(data.status) {
                                    //texto = sust(texto,data.valor);
                                    ub.colony = data.valor;
                                    ub.city = data.est
                                }
                                ub.exist_prep = exist_prep;
                                resolve({
                                    ub:ub,
                                    //texto: nv.lug ? nv.texto:texto
                                    texto: oldTexto
                                });
                            })
                        }
                    })
                }
                else {
                    
                    elastic.query_wheres_city(texto,null).then((resp) => {
    
                        data = findCity(texto,resp.hits.hits,null)
                        if(data.status) {
                            ub.estado = data.tipo;
                            texto = sust(texto,data.valor);
                            texto = cls.clearStopWord(texto);
                            ub.city = data.valor;
                            data = findColony(texto,data.info);
                            if(data.status) {
                                //texto = sust(texto,data.valor);
                                ub.colony = data.valor;
                            }
                            ub.exist_prep = exist_prep;
                            resolve({
                                ub:ub,
                                //texto: nv.lug ? nv.texto:texto
                                texto: oldTexto
                            });
                        }
                        else {
                            elastic.query_wheres_colony(texto,null).then((resp) => {
                                data = findOnlyColony(texto,resp.hits.hits);
                                if(data.status) {
                                    //texto = sust(texto,data.valor);
                                    ub.colony = data.valor;
                                    ub.city = data.est
                                }
                                ub.exist_prep = exist_prep;
                                resolve({
                                    ub:ub,
                                    //texto: nv.lug ? nv.texto:texto,
                                    texto: oldTexto
                                });
                            })
                        }
    
                    })
                    
                }
    
                
            })
        }

        

        
        
    });

    return promesa;

}

function findEstado(tx,arreglo) {
    let ind = false;
    let info = [];
    let valor = null;
    for(let op of arreglo) {
        //console.log('==============>'+op._source.valor);
        if(op._source.valor.length <= tx.length) {
            
            let reg = new RegExp("\\b"+cls.onlyLetters(op._source.valor)+"\\b");
            let matches = tx.match(reg);
            if(op._source.fuente == 'lugares_city' && matches) {
                //console.log('Matches: '+matches);
                ind =  true;
                valor = op._source.valor;
                info = op._source.relacion;
                break;
            } 
        }
    }

    return  {
        status:ind,
        valor:valor,
        info: info
    }
}

function findCity(tx,arreglo,data) {
    
    let ind = false;
    let info = [];
    let valor = null;
    let tipo = null;
    for(let op of arreglo) {
        if(op._source.valor.length <= tx.length) {
            let reg = new RegExp("\\b"+cls.onlyLetters(op._source.valor)+"\\b");
            let matches = tx.match(reg);
            if(data && data.length > 0) {
                if(op._source.fuente == 'lugares_colony' && matches && data.includes(op._source.valor)) {
                    //console.log('Matches: '+matches);
                    ind =  true;
                    valor = op._source.valor;
                    info = op._source.relacion;
                    tipo = op._source.tipo;
                    break;
                }
            }
            else {
                if(op._source.fuente == 'lugares_colony' && matches) {
                    //console.log('Matches: '+matches);
                    ind =  true;
                    valor = op._source.valor;
                    info = op._source.relacion;
                    tipo = op._source.tipo;
                    break;
                }
            }
        }
        
    }
    

    return  {
        status:ind,
        valor:valor,
        info: info,
        tipo: tipo
    }
}


function findColony(tx,data) {
    let ind = false;
    let valor = null;
    for(let op of data) {
        if(op.length <= tx.length) {
            let reg = new RegExp("\\b"+cls.onlyLetters(op)+"\\b");
            let matches = tx.match(reg);
            if(matches) {
                //console.log('Matches: '+matches);
                ind =  true;
                valor = op;
                break;
            }
        }
    }

    return  {
        status: ind,
        valor:valor
    }
}


function findOnlyColony(tx,arreglo) {
    let ind = false;
    let valor = null;
    let est = null;
    for(let op of arreglo) {
        if(op._source.fuente == 'lugares_colony') {
            for(let op2 of op._source.relacion) {
                let reg = new RegExp("\\b"+cls.onlyLetters(op2)+"\\b");
                let matches = tx.match(reg);
                if(matches) {
                    //console.log('Estado: '+op._source.valor+'---'+op2);
                    //console.log('Matches: '+matches);
                    ind =  true;
                    valor = op2;
                    est = op._source.valor;
                    
                } 
            }

            if(ind) break;
        }
    }

    return  {
        status:ind,
        valor:valor,
        est:est
    }
}


function sust(a,b) {
    a = a.replace(b,'');
    a.trim();
    return a;
}

function findPrepLug(tx) {
    let texto = null;
    let lug = null;
    let ind = false;
    for(let op  of gram.prep_lug) {
        if(op.length <= tx.length) {
            let reg = new RegExp("\\b"+op+"\\b");
            let matches = tx.match(reg);
            if(matches) {
                let nv = matches[0];
                let palabras = nv.split(' ');
                let pos = palabras[0];
                let palabrasTexto = tx.split(' ');
                let index = palabrasTexto.findIndex((ele) => {
                    return ele == pos;
                })
                //console.log('Index: '+index);
                let arrTxt = palabrasTexto.splice(index);
                lug = arrTxt.join(' ');
                texto = sust(tx,lug).trim();
                texto = cls.clearStopWord(texto);
                lug = sust(lug,nv).trim();
                break;
            }
        }
    }

    //console.log('Texto--->'+texto+'----Lugar--->'+lug);

    return {
        texto:texto,
        lug:lug
    }
}