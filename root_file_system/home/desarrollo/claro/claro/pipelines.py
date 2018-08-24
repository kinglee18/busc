import json
from elasticsearch import Elasticsearch

class JsonWriterPipeline(object):

    def __init__(self):
        self.es_client = Elasticsearch(['172.18.1.96:9200'])

    def process_item(self, item, spider):
    	self.es_client.update(index='cs',doc_type='default',id=int(item['name']),
                body={"doc": {"description": item['article'] }})
    	return item