import requests
import json
from datetime import datetime
from elasticsearch import Elasticsearch
import subprocess, sys
 
response = requests.get("https://blog.seccionamarilla.com.mx/api/get_posts/?page=1/").text
data = json.loads(response)
paginas = data["pages"]
es_client = Elasticsearch(['172.18.1.96:9200'])

for num_pagina in range(1,paginas):
	url = 'https://blog.seccionamarilla.com.mx/api/get_posts/?page='+str(num_pagina)+'/'
	response = requests.get(url).text
	pagina = json.loads(response)
	#cantidad = len(pagina["posts"])
	for post in pagina["posts"]:
		doc = {
			'author': post["author"],
			'categories': post["categories"],
			'content': post["content"],
			'date': post["date"],
			'excerpt': post["excerpt"],
			'id': post["id"],
			'modified': post["modified"],
			'slug': post["slug"],
			'status': post["status"],
			'tags': post["tags"],
			'title': post["title"],
			'title_plain': post["title_plain"],
			'url': post["url"],
			'url_image': post["thumbnail_images"]["wt370_370"]["url"],
			'datetime': datetime.now()
		}

		es_client.index(index='blog_secam',doc_type='default',id=post['id'],body=doc)
		print("Estoy en el id: "+str(post["id"]))

#cmd = "curl -X POST \"172.18.1.96:9200/blog_secam/_delete_by_query\" -H 'Content-Type: application/json' -d'{\"query\": {   \"range\": {\"datetime\": {\"lte\": \"now-1d/d\"}}}}'"
#print(cmd)
#p = subprocess.Popen(cmd, shell=True, stderr=subprocess.PIPE)
