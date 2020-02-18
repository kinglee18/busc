# App backend (servicios para el portal de seccion amarilla)
## Instalación 
- Instalar paquetes de npm

```bash
npm install
```

- Instalar libreria spacy  con python 3 

- Para correr el servidor en ambiente de desarrollo usar el comando

```bash
node index.js test
```

- Para correr el servidor en el ambiente de pruebas de la ip http://10.34.180.130 ejecutar dentro del servidor
  `pm2 start index.js -- test`
- Para el servidor de produccion usar `pm2 start index.js` el script tomara el ambiente `prod` por defecto.
- Los ambientes estan definidos en el archivo config.js de la carpeta backend.
## Pruebas
El proyecto cuenta con una carpeta de prubas que se corren usando mocha escrito en el archivo package.json. Para correr las pruebas unitarias usar el comando 

```bash 
npm test
```
# ADN (falta documentacion, esta en desuso)

# Alexa (servicios que brindan informacion de los negocios de seccion amarilla y pakmail)

- Actualmente esta en uso con ciertos problemas, se debe eliminar y usar los servicios de la carpeta backend en su lugar cuando el portal cambie de motor
- Contiene los servicios que consume el portal de pakmail

# App chat (en desuso)

- Aplicacion de chat intermediario entre clientes de portal de seccion amarilla y negocios

# Claro (en desuso, falta documentacion)

- contiene scripts para llenado de indices pakmail, claro y adn

# scripts_python (en desuso, falta documentacion)
