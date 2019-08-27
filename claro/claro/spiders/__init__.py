import scrapy
from claro.items import FundrazrItem
#from scrapy.Item import Item

class ArticleSpider(scrapy.Spider):
    name = 'ImageSpider'

    start_urls = ['https://www.claroshop.com/producto/']

    def start_requests(self):
        # self points to the spider instance
        # that was initialized by the scrapy framework when starting a crawl
        #
        # spider instances are "augmented" with crawl arguments
        # available as instance attributes,
        # self.ip has the (string) value passed on the command line
        # with `-a ip=somevalue`
        for url in self.start_urls:
            yield scrapy.Request(url+self.producto, self.parse)
    def parse(self, response):
        content = response.xpath(".//li[@class='laDescrip']/descendant::text()")[1].extract()
        #item = Item()
        #item['description'] = content
        #return item
        item = FundrazrItem()
        item["article"] = content
        item["name"] = self.id
        #yield {'article': ''.join(content)}
        #print( content)
        yield item