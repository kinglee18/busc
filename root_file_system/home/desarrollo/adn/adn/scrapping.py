import sys

from googleapiclient.errors import HttpError  
from googleapiclient import sample_tools  
from oauth2client.service_account import ServiceAccountCredentials  
from httplib2 import Http  
from apiclient.discovery import build

from datetime import datetime
import ast
import json
import re
import time
import requests
from bs4 import BeautifulSoup
from elasticsearch import Elasticsearch
from multiprocessing import Pool
import subprocess, sys

def main():
	credentials = ServiceAccountCredentials.from_json_keyfile_name('analytics.json', ['https://www.googleapis.com/auth/analytics.readonly'])
	http_auth = credentials.authorize(Http())
	service = build('analytics', 'v3', http=http_auth)

	# Run the query function using the API service
	inicio = 1

	traffic_results = get_api_traffic_query(service,inicio).execute()

	# Insert each row of the result set
	division = traffic_results.get('totalResults')//10000
	modulo = traffic_results.get('totalResults') % 10000
	if modulo > 0:
		division = division + 1

	listaurls = []
	#urlparser('http://psicomexico.xyz','http://psicomexico.xyz')
	for i in range(division):
		traffic_results = get_api_traffic_query(service,inicio).execute()
		if traffic_results.get('rows', []):
			for row in traffic_results.get('rows'):
				listaurls.append('http://'+row[0])
		else:
			print('No Rows Found')
		inicio = inicio + 10000
	p = Pool(3)
	#with Pool(10) as p:
	p.map(urlparser,listaurls)
	p.terminate()
	p.join()
	cmd = "curl -X POST \"172.18.1.96:9200/scrapping/_delete_by_query\" -H 'Content-Type: application/json' -d'{\"query\": {   \"range\": {\"date\": {\"lte\": \"now-1d/d\"}}}}'"
	print(cmd)
	p = subprocess.Popen(cmd, shell=True, stderr=subprocess.PIPE)


def get_api_traffic_query(service,inicio):  
	return service.data().ga().get(
		ids='ga:147712726',
		start_date='30daysAgo',
		end_date='yesterday',
		metrics='ga:users',
		dimensions='ga:hostname',
		samplingLevel='HIGHER_PRECISION',
		#    sort='-ga:yearMonth',
		filters='ga:hostname!@seccionamarilla.com',
		#segment='sessions::condition::ga:hostname!~mongo|app|help|docs|staging|googleweblight',
		start_index=inicio,
		max_results='10000')

def urlparser(url):
	cmd = "scrapy crawl ImageSpider -a url="+url
	print(cmd)
	p = subprocess.Popen(cmd, shell=True, stderr=subprocess.PIPE)

if __name__ == '__main__':  
	main()