import urllib
import xml.etree.ElementTree as ET
import re
import json
import requests
import time
from datetime import datetime
from bs4 import BeautifulSoup
from elasticsearch import Elasticsearch
from multiprocessing import Pool
import urllib.request
import subprocess, sys

es_client = Elasticsearch(['172.18.1.96:9200'])


def main():
    #testfile = urllib.URLopener()
    #testfile.retrieve('https://s3.amazonaws.com/medios.plazavip.com/mktclaroshop/catGoogle.xml', 'claro.xmls')
    testfile = urllib.request.urlretrieve('https://s3.amazonaws.com/medios.plazavip.com/mktclaroshop/catGoogle.xml', 'claro.xmls')

    tree = ET.parse('claro.xmls')
    root = tree.getroot()

    ns = {'tag_item': 'http://base.google.com/ns/1.0'}

    listItems = []

    for channel in root.findall('channel'):
        for item in channel.findall('item'):
            listItems.append(ET.tostring(item).decode())

    p = Pool(3)
    p.map(urlparser, listItems)
    p.terminate()
    p.join()


def urlparser(item):
    item = ET.fromstring(item)

    # item = tree.getroot()

    ns = {'tag_item': 'http://base.google.com/ns/1.0'}

    id = item.find('tag_item:id', ns)

    # print(id.text)

    title = item.find('title')

    # print(title.text)

    link = item.find('link')
    ruta = link.text

    ruta = ruta.split('producto/')

    #cmd = "scrapy runspider spider.py -a producto=641950/iphone-6-32gb-color-space-gray-r9-telcel/ -a id=641950 -o results.json"
    #cmd = "scrapy runspider spider.py -a producto="+ruta[1]+" -a id="+id.text+" -o results.json"
    #cmd = "scrapy crawl ImageSpider -a producto="+ruta[1]+" -a id="+id.text
    #print(cmd)
    #cmd = "scrapy crawl ImageSpider -a producto=641950/iphone-6-32gb-color-space-gray-r9-telcel/ -a id=641950"
 
    ## run it ##
    #p = subprocess.Popen(cmd, shell=True, stderr=subprocess.PIPE)

    # print(link.text)

    """try:
        page = requests.get(link.text)
    except requests.exceptions.RequestException as e:
        return
    else:
        statusCode = page.status_code
        if statusCode == 200:
            soup = BeautifulSoup(page.content, 'lxml')
            description = soup.find_all('ul', {'class': 'viewDescrip'})
            if len(description) != 0:
                li = description[0].find_all('li', {'class': 'laDescrip'})
                try:
                    li[0].text
                except Exception as e:
                    return
                else:
                    #print(li[0].text)
                    pass
            else:
                return
        else:

              # print(li[0].text)

            return"""
    image_link = item.find('tag_item:image_link', ns)

    # print(image_link.text)

    condition = item.find('tag_item:condition', ns)

    # print(condition.text)

    availability = item.find('tag_item:availability', ns)

    # print(availability.text)

    price = item.find('tag_item:price', ns)
    price_vector = re.findall("[-+]?\d*\.\d+|\d+", price.text)

    # print(price_vector[0])

    sale_price = item.find('tag_item:sale_price', ns)
    sale_price_vector = re.findall("[-+]?\d*\.\d+|\d+", sale_price.text)

    # print(sale_price_vector[0])

    brand = item.find('tag_item:brand', ns)

    # print(brand.text)

    product_type = item.find('tag_item:product_type', ns)
    product_type_vector = product_type.text.split(' > ')

    # print(product_type_vector)

    google_product_category = \
        item.find('tag_item:google_product_category', ns)
    google_product_category = google_product_category.text
    google_product_category_vector = google_product_category.split(' > '
            )

    # print(google_product_category_vector)

    gtin = item.find('tag_item:gtin', ns)

    # print(gtin.text)

    product_digital = item.find('tag_item:product_digital', ns)

    # print(product_digital.text)

    installment_json = {}
    if item.findall('tag_item:installment', ns):
        for installment in item.findall('tag_item:installment', ns):
            months = installment.find('tag_item:months', ns)
            installment_json['months'] = months.text

            # print(months.text)

            amount = installment.find('tag_item:amount', ns)
            amount_vector = re.findall("[-+]?\d*\.\d+|\d+", amount.text)

            # print(amount_vector[0])

            installment_json['amount'] = amount_vector[0]

    # print(json.dumps(installment_json))

    doc = {
        'installment': installment_json,
        'title': title.text,
        'description': "",
        'link': link.text,
        'image_link': image_link.text,
        'condition': condition.text,
        'availability': availability.text,
        'price': float(price_vector[0]),
        'sale_price': float(sale_price_vector[0]),
        'brand': brand.text,
        'product_type': product_type_vector,
        'google_product_category': google_product_category_vector,
        'gtin': gtin.text,
        'product_digital': float(product_digital.text),
        'date': datetime.now()
        }

    #print(json.dumps(doc))

    res = es_client.index(index='cs', doc_type='default',
                          id=int(id.text), body=doc)
    cmd = "scrapy crawl ImageSpider -a producto="+ruta[1]+" -a id="+id.text
    print(cmd)
    time.sleep(1.5)
    p = subprocess.Popen(cmd, shell=True, stderr=subprocess.PIPE)


if __name__ == '__main__':
    main()

			