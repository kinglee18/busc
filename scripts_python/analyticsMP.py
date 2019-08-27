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

es_client = Elasticsearch(['172.18.1.96:9200'])

#Main
def main():  
  # Authenticate and create the service for the Core Reporting API
  credentials = ServiceAccountCredentials.from_json_keyfile_name(
    'analytics.json', ['https://www.googleapis.com/auth/analytics.readonly'])
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
        #print(listaurls)
        #urlparser('http://'+row[0],'http://'+row[0])
    else:
      print('No Rows Found')
    inicio = inicio + 10000

  p = Pool(4)
  
  #with Pool(10) as p:
  p.map(urlparser,listaurls)
  
  p.terminate()
  p.join()

# Query function
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

def urlparser(title):
  p = {}
  post = title
  try:
    page = requests.get(post)
  except requests.exceptions.RequestException as e:
    return
  else:
    statusCode = page.status_code
    if statusCode == 200:
      soup = BeautifulSoup(page.content, 'lxml')
      try:
        soup.title.text
      except Exception as e:
        return
      else:
        title_name = soup.title.text

      description = soup.find_all("meta", attrs={'name':'description'})
      #print(description[0]["content"])
      try:
        description[0]["content"]
      except Exception as e:
        desc = ""
      else:
        desc = description[0]["content"]

      keywords = soup.find_all("meta", attrs={'name':'keywords'})
      #print(keywords[0]["content"]) if keywords else print('')
      try:
        keywords[0]["content"]
      except Exception as e:
        keys = ""
      else:
        keys = keywords[0]["content"]

      imagenes = soup.find_all('div', id=re.compile('^inc37_logo'))
      try:
        imagenes[0].img["src"]
      except Exception as e:
        logo = ""
      else:
        logo = post+imagenes[0].img["src"]

      contacto = []
      inc38s = soup.find_all('div', id=re.compile('^inc38_htmltext'))
      for inc38 in inc38s:
        contacto.append(inc38.text)
        #print inc38.text

      page28s = soup.find_all('div', id=re.compile('^page28_htmltext'))
      for page28 in page28s:
        contacto.append(page28.text)
        #print page28.text

      h1s_vec = []
      h1s = soup.find_all('h1')
      for h1 in h1s:
        h1s_vec.append(h1.text)
        #print(h1.text)

      h2s_vec = []
      h2s = soup.find_all('h2')
      for h2 in h2s:
        h2s_vec.append(h2.text)
        #print(h2.text)

      h3s_vec = []
      h3s = soup.find_all('h3')
      for h3 in h3s:
        h3s_vec.append(h3.text)
        #print(h3.text)

      h4s_vec = []
      h4s = soup.find_all('h4')
      for h4 in h4s:
        h4s_vec.append(h4.text)
        #print(h4.text)

      h5s_vec = []
      h5s = soup.find_all('h5')
      for h5 in h5s:
        h5s_vec.append(h5.text)
        #print(h5.text)

      h6s_vec = []
      h6s = soup.find_all('h6')
      for h6 in h6s:
        h6s_vec.append(h6.text)
        #print(h6.text)

      scripts = soup.find_all('script')
      for sc in scripts:
        dl = sc.text
        if dl.find('dataLayer = [') != -1:
          #new_dl = dl.replace("=",":",1)
          #new_dl = new_dl.replace(";","",1)
          new_dl = dl.replace("dataLayer =","",1)
          new_dl = new_dl.replace(";","",1)
          new_dl = new_dl.replace("'",'"')
          break
          #dataLayer = ast.literal_eval(new_dl)
          #json.loads(new_dl)
          #print(new_dl)
        #print(sc.text)

      try:
        new_dl
      except Exception as e:
        dlf = {}
        dls = ""
      else:
        try:
          dlf = json.loads(new_dl)
        except ValueError:
          dls = dl
          #print(dl)
          dlf = {}
        else:
          dls = ""
        #print(new_dl)
        #dlf = json.loads(new_dl)


      doc = {
        'title':title_name,
        'description':desc,
        'keywords':keys,
        'h1':h1s_vec,
        'h2':h2s_vec,
        'h3':h3s_vec,
        'h4':h4s_vec,
        'h5':h5s_vec,
        'h6':h6s_vec,
        'dataLayer':dlf,
        'dataLayerString':dls,
        'url':post,
        'logo':logo,
        'date':datetime.now(),
        'where':contacto
      }

      res = es_client.index(index="scrapping",doc_type="default",id=post,body=doc)

    else: 
      return

if __name__ == '__main__':  
  main()