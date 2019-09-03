class Empresa {
    
    constructor() {
        this.empresas = [];
    }
    
    addEmpresa(id,clave) {
        this.empresas.push({
            id,
            clave
        });
    }
    
    getEmpresa(id) {
        let empresa = this.empresas.filter((ele) => {
            return ele.clave == id;
        })

        if(empresa.length > 0) {
            return empresa[0];
        }
        else return null;
    
        
    }

    getEmpresaId(id) {
        let empresa = this.empresas.filter((ele) => {
            return ele.id == id;
        })

        if(empresa.length > 0) {
            return empresa[0];
        }
        else return null;
    
        
    }
    
    deleteEmpresa(id) {
        this.empresas = this.empresas.filter((ele) => {
            return ele.id != id;
        });
    }

    getAll() {
        return this.empresas;
    }
    
}
    
module.exports = {
    Empresa
}