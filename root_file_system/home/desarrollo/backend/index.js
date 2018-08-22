const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const proceso = require('./app');
const pl = require('./http/places');
const elastic = require('./elastic/run');
const cmt = require('./http/comments');
const home = require('./elastic/home');
const auto = require('./http/autocomplete');
const clear = require('clear');
const clima = require('./http/clima');
const bodyParser = require('body-parser')
let connectCounter = 0;

/* Chat 
const {Persona} = require('./models/personas');
const {Empresa} = require('./models/empresas');
const datos = require('./elastic/datos');
const persona = new Persona();
const empresa = new Empresa();
*/


// parse application/json
app.use(bodyParser.json())


app.get('/node',(req,res) => {
    res.status(200).send({
        msj: 'Restringido, la plocia llegara en 10 minutos'
    });
})

app.post('/alexa',(req,res) => {
    let data = req.body;
    proceso.search(data.tx,data.lat,data.lng).then((json) => {
        elastic.negocios(0,json.neg.ctg,json.neg.pys,json.neg.bn,json.neg.hrs,json.neg.pay,json.where).then((resp) => {                
            res.send({
                info: json,
                data: resp
            });
        });
    });
})


io.on('connection', function(socket) {

    

    socket.on('home',(data) => {
        home.inicio().then((resp) => {
            //console.log(resp);
            socket.emit('home-resp',resp);
        })
    })

    socket.on('new-home',(data) => {
        home.inicio2().then((resp) => {
            socket.emit('home-resp',resp);
        })
    })

    socket.on('autocomplete',(data) => {
        auto.autocomplete(data.texto).then((resp) => {
            socket.emit('autocomplete-resp',{
                info:resp
            })
        })
    })

    socket.on('other-page',(data) => {
        let json = data.json;
        let lista = [];
        console.log(JSON.stringify(data));
        if(data.tipo == 'neg') {
            elastic.negocios(data.page,json.neg.ctg,json.neg.pys,json.neg.bn,json.neg.hrs,json.neg.pay,json.where).then((resp) => {
                
                for(let op of resp.info) lista.push(op.listadoid);
                socket.emit('search-negocios',resp);
                return cmt.allComments(lista);
            }).then((resp) => {
                socket.emit('search-comments',{info:resp});
            })
        }
        else if(data.tipo == 'claro') {
            elastic.claro_shop(data.page,json.claro.marcas,json.claro.ctg,json.claro.bn,json.claro.price,json.claro.tx).then((resp) => {
                socket.emit('search-claro_shop',resp);
            });
        }
        else if(data.tipo == 'blog') {
            elastic.blog(data.page,json.texto,json.blog.tags,json.blog.ctg,json.where).then((resp) => {
                socket.emit('search-blog',resp);
            })
        }
    })

    socket.on('search',(data) => {
        clear();
        connectCounter++;
        
        proceso.search(data.tx,data.lat,data.lng).then((json) => {
            let lista = [];
            socket.emit('search-json',{info:json});
            
            elastic.claro_shop(0,json.claro.marcas,json.claro.ctg,json.claro.bn,json.claro.price,json.claro.tx).then((resp) => {
                socket.emit('search-claro_shop',resp);
            });
            pl.getPlaces(json).then((resp) => {
                //console.log(resp);
                socket.emit('search-places',{info:resp});
            })
            elastic.blog(0,json.texto,json.blog.tags,json.blog.ctg,json.where).then((resp) => {
                socket.emit('search-blog',resp);
            })
            elastic.negocios(0,json.neg.ctg,json.neg.pys,json.neg.bn,json.neg.hrs,json.neg.pay,json.where).then((resp) => {
                
                for(let op of resp.info) lista.push(op.listadoid);
                socket.emit('search-negocios',resp);
                return cmt.allComments(lista);
            }).then((resp) => {
                socket.emit('search-comments',{info:resp});
            })

            clima.getClima(json.where).then((resp) => {
                socket.emit('search-clima',{info:resp});
            })
            

            
            
            
            
        })
    })

    socket.on('app-alexa',(data) => {
        proceso.search(data.tx,data.lat,data.lng).then((json) => {
            elastic.negocios(0,json.neg.ctg,json.neg.pys,json.neg.bn,json.neg.hrs,json.neg.pay,json.where).then((resp) => {                
                socket.emit('app-alexa-resp',{
                    info: json,
                    data: resp
                });
            });
        });
    })

    /*############################## Chat #####################################################*/

    /*******************************Chatv1********************************* */
    /*
    socket.on('new-user',(data,callback) => {
        if(!persona.getPersona(socket.id)) {
            persona.addPersona(socket.id,data.clave);
        }
        
        let fecha = getFecha()
        let resp = {
            name: data.name,
            fecha,
            msg: 'Hola Buenas Tardes. ¿En que te podemos ayudar?'
        }
        callback(resp);
    })

    socket.on('msg-user',(data) => {
        console.log('**************************************');
        console.log(JSON.stringify(empresa.getAll()))
        console.log('**************************************');
        let emp = empresa.getEmpresa(data.clave)
        let usu = persona.getPersona(socket.id);
        let fecha = getFecha()
        console.log(emp);
        if(emp) {
            let env = {
                status: true,
                data: {
                    id: usu.id,
                    msg: data.msg,
                    fecha
                }
            }
            socket.broadcast.to(emp.id).emit('all-users',env);
        }
    })

    socket.on('msg-emp',(data) => {
        console.log('####################################');
        console.log(JSON.stringify(persona.getAll()))
        console.log('####################################');
        
        let fecha = getFecha()
        let resp = {
            name: data.name,
            fecha,
            msg: data.msg
        }
        
        socket.broadcast.to(data.clave).emit('resp-emp',resp);
    })




    

    socket.on('login-app',(data,callback) => {
        datos.validar(data.clave).then((resp) => {
            if(resp.hits.hits.length > 0) {
                empresa.addEmpresa(socket.id,data.clave);
                socket.emit('login-resp',{
                    status: true,
                    data: resp.hits.hits[0]._source
                })
            }
            else {
                socket.emit('login-resp',{
                    status: false,
                    data: null
                })
            }
            
        })
    })

    */

   


    /*############################## Chat #####################################################*/

    socket.on('disconnect', function() { 
        //empresa.deleteEmpresa(socket.id);
        //persona.deletePersona(socket.id);
        /*##########################################*/
        let count = io.sockets.connected;
        console.log('Inicio Size: '+Object.keys(count).length);
        connectCounter--;
        console.log('Conectados: '+connectCounter+'---'+Object.keys(count).length);
     });
    

})


http.listen(3008, function(){
    console.log('listening on *:3000');
});