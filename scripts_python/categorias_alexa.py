from elasticsearch import Elasticsearch
import json

es_client = Elasticsearch(['172.18.1.96:9200'])

def main():
	categorias = []
	cont = 0
	for x in range(0,1592):
		res =   query(x)
		total = res['hits']['total']
		for hit in res['hits']['hits']:
			cont = cont + 1 
			print(str(cont))
			if hit["_source"]["Appearances"]["Appearance"]["categoryname"] not in categorias:
				categorias.append(hit["_source"]["Appearances"]["Appearance"]["categoryname"])
	estadisticas = []
	for categoria in categorias:
		json_categoria = {}
		json_categoria["name"] = categoria
		cont_bn = 0
		cont_website = 0
		cont_paymenttype = 0
		cont_schedule = 0
		cont_productservices = 0
		cont_email = 0
		cont_address = 0
		res = es_client.search(index="negocios_secam", doc_type='default' ,body={"size": 90000, "query": {"match_phrase": {"Appearances.Appearance.categoryname": categoria}}})
		total = res['hits']['total']
		json_categoria["total"] = total
		for hit in res['hits']['hits']:
			if (len(hit["_source"]["bn"]) > 0):
				cont_bn = cont_bn + 1
			if "contenttype" in hit["_source"]["contenttypes"]:
				for element in hit["_source"]["contenttypes"]["contenttype"]:
					if element["name"] == "paopwo":
						cont_website = cont_website + 1
			if "type" in hit["_source"]["features"]:
				for element in hit["_source"]["features"]["type"]:
					if element["name"] == "paymenttype":
						cont_paymenttype = cont_paymenttype + 1
					elif element["name"] == "txtschedule":
						cont_schedule = cont_schedule + 1
			if "prdserv" in hit["_source"]["productservices"]:
				if (len(hit["_source"]["productservices"]["prdserv"]) > 0):
					cont_productservices = cont_productservices + 1
			if "lke" in hit["_source"]["items"]:
				cont_email = cont_email + 1
			if (len(hit["_source"]["fullstreet"]) > 0) or (len(hit["_source"]["colony"]) > 0) or (len(hit["_source"]["city"]) > 0) or (len(hit["_source"]["statename"]) > 0):
				cont_address = cont_address + 1
		json_categoria["BusinessName"] = cont_bn
		json_categoria["WebSite"] = cont_website
		json_categoria["PaymentType"] = cont_paymenttype
		json_categoria["Schedule"] = cont_schedule
		json_categoria["ProductServices"] = cont_productservices
		json_categoria["Email"] = cont_email
		json_categoria["Address"] = cont_address
		estadisticas.append(json_categoria)
	print(estadisticas)
	with open('categorias.json', 'w') as outfile:
		json.dump(estadisticas, outfile)


def query(page):
	return es_client.search(index="negocios_secam", doc_type='default' ,body={"size": 1000, "from": page*1000, "query": {"match_all": {}}})

if __name__ == '__main__':
	main()