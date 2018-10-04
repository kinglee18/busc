import scrapy
from adn.items import AdnItem
import re
import json
#from scrapy.Item import Item

class ArticleSpider(scrapy.Spider):
    name = 'ImageSpider'

    #start_urls = ['http://www.colegioexcellis.com/']
    #start_urls = []
    #start_urls += self.url

    def start_requests(self):
        # self points to the spider instance
        # that was initialized by the scrapy framework when starting a crawl
        #
        # spider instances are "augmented" with crawl arguments
        # available as instance attributes,
        # self.ip has the (string) value passed on the command line
        # with `-a ip=somevalue`
        #for url in self.start_urls:
        yield scrapy.Request(self.url, self.parse)

    def parse(self, response):
        #title = ""
        title = response.xpath(".//title/descendant::text()").extract_first()

        #description = ""
        
        description = response.xpath(".//meta[@name='description']/@content").extract_first()
        

        #keywords = ""
        keywords = response.xpath(".//meta[@name='keywords']/@content").extract_first()

        #logo = ""
        imagenes = response.xpath('.//div[re:match(@id,"^inc37_logo")]')
        imagenes = imagenes.xpath('.//img//@src').extract_first()

        contacto = []
        contacto += response.xpath('.//div[re:match(@id,"^inc38_htmltext")]/text()').extract()
        contacto += response.xpath('.//div[re:match(@id,"^page28_htmltext")]/text()').extract()

        h1s_vec = []
        h1s_vec += response.xpath('.//h1/descendant::text()').extract()

        h2s_vec = []
        h2s_vec += response.xpath('.//h2/descendant::text()').extract()

        h3s_vec = []
        h3s_vec += response.xpath('.//h3/descendant::text()').extract()

        h4s_vec = []
        h4s_vec += response.xpath('.//h4/descendant::text()').extract()

        h5s_vec = []
        h5s_vec += response.xpath('.//h5/descendant::text()').extract()

        h6s_vec = []
        h6s_vec += response.xpath('.//h6/descendant::text()').extract()

        scripts = []
        scripts += response.xpath('.//script/text()').extract()

        for sc in scripts:
            dl = sc
            if dl.find('dataLayer = [') != -1:
                new_dl = dl.replace("dataLayer =","",1)
                new_dl = new_dl.replace(";","",1)
                new_dl = new_dl.replace("'",'"')
                break

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
                dlf = {}
            else:
                dls = ""

        item = AdnItem()
        item["title"] = title
        item["description"] = description
        item["keywords"] = keywords
        item["logo"] = imagenes
        item["contacto"] = contacto
        item["h1"] = h1s_vec
        item["h2"] = h2s_vec
        item["h3"] = h3s_vec
        item["h4"] = h4s_vec
        item["h5"] = h5s_vec
        item["h6"] = h6s_vec
        item["dataLayer"] = dlf
        item["dataLayerString"] = dls
        item["url"] = self.url
        #item["datetime"] = datetime.now()
        #item["name"] = self.id
        #yield {'article': ''.join(content)}
        #print( content)
        yield item