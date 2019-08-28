# App backend
- Para correr el servidor en ambiente de desarrollo usar el comando `node index.js test` ó  `node index.js dev` dentro de la carpeta /backend
- Para correr el servidor en el ambiente de pruebas de la ip http://10.34.180.130 ejecutar dentro del servidor 
    `pm2 start index.js -- test`
- Para el servidor de produccion usar `pm2 start index.js` el script tomara el ambiente `prod` por defecto. 
- Los ambientes estan definidos en el archivo config.js de la carpeta backend.