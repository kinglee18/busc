import json
from elasticsearch import Elasticsearch

es_client = Elasticsearch(['172.18.1.96:9200'])

if __name__ == '__main__':
	with open('sucursalesPakmail.json') as f:
		data = json.load(f)

	for sucursal in data:
		doc = {
			#"id": 2,
		    "mx": sucursal["MX"],
		    "name": sucursal["Nombre Franquicia"],
		    "state": sucursal["Nombre estado"],
		    "phone": str(sucursal["Teléfono 1"]),
		    "phone2": str(sucursal["Teléfono 2"]),
		    "address": sucursal["Dirección completa"],
			"email": sucursal["Correo de Franquicia"],
		    "lat": sucursal["Latitud"],
		    "lng": sucursal["Longitud"],
		    #"channel": "pak-mail-16-de-septiembre",
		    #"created_at": "2016-03-16 20:18:12",
		    #"updated_at": "2016-03-16 20:18:12",
		    "deleted_at": None,
		    #"coordinates": [float(sucursal["Longitud"]),float(sucursal["Latitud"])]
		}
		try:
			doc["coordinates"] = [float(sucursal["Longitud"]),float(sucursal["Latitud"])]
		except:
			doc["coordinates"] = []
		else:
			doc["coordinates"] = [float(sucursal["Longitud"]),float(sucursal["Latitud"])]
		res = es_client.index(index='sucursales_pakmail', doc_type='default',
                              id=sucursal["MX"], body=doc)
