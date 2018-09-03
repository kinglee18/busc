const jwt = require('jwt-simple');
const secret = 'eha91se#$%123vic';


exports.valid = function(req,res,next) {
    let token = req.body.token;
    try {
        let decoded = jwt.decode(token, secret);
        //console.log(JSON.stringify(decoded,undefined,2));
        if(decoded.agent == 'eha') {
            req.status = 'OK';
        }
        else {
            req.status = 'Error Autenticacion';
        }

        next();
    } catch(e) {
        req.status = 'Error Autenticacion';
        next();
    }
    
    
    
}