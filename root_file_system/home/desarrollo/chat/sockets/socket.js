const { io } = require('../index');
const {Persona} = require('../models/personas');
const {Empresa} = require('../models/empresas');
const datos = require('../elastic/datos');
const persona = new Persona();
const empresa = new Empresa();


io.on('connection', function(socket) {

    /*******************************Persona********************************* */
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




    /*******************************Empresa********************************* */

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

    

    socket.on('disconnect',() => {
        empresa.deleteEmpresa(socket.id);
        persona.deletePersona(socket.id);
        console.log('Desconectado ...');
    })
})


function getFecha() {
    let date = new Date();
    let day = zero(date.getDay());
    let mes = zero(date.getMonth());
    let ano = zero(date.getFullYear());
    let hora = zero(date.getHours());
    let min = zero(date.getMinutes());

    return hora+':'+min+' '+day+'/'+mes+'/'+ano;
}

function zero(num) {
    let valor = '';
    if(num<10) valor = '0'+num;
    else valor = ''+num

    return valor;
}