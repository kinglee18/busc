class Persona {

    constructor() {
        this.personas = [];
    }

    addPersona(id,clave) {
        this.personas.push({
            id,
            clave
        });
        
    }

    getPersona(id) {
        let persona = this.personas.filter((ele) => {
            return ele.id == id;
        });

        if(persona.length > 0) {
            return persona[0];
        }
        else {
            return null;
        }

        
    }

    deletePersona(id) {
        this.personas = this.personas.filter((ele) => {
            return ele.id != id;
        });
    }

    getAll() {
        return this.personas;
    }

}

module.exports = {
    Persona
}