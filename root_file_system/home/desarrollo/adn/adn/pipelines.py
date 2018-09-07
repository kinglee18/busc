import json
from elasticsearch import Elasticsearch
from datetime import datetime
import logging


class AdnPipeline(object):
    def __init__(self):
        self.es_client = Elasticsearch(['172.18.1.96:9200'])

    def process_item(self, item, spider):
        doc = {
        	'title': item["title"],
            'description': item["description"],
            'keywords': item["keywords"],
            'h1': item["h1"],
            'h2': item["h2"],
            'h3': item["h3"],
            'h4': item["h4"],
            'h5': item["h5"],
            'h6': item["h6"],
            'dataLayer': item["dataLayer"],
            'dataLayerString': item["dataLayerString"],
            'url': item["url"],
            'logo': item["logo"],
            'date': "2018-07-20T10:37:12.409088",
            'where': item["contacto"]
        }
        self.es_client.index(index='scrapping',doc_type='default',id=item['url'],body=doc)
        #logging.debug("Post added to MongoDB")
        return item
