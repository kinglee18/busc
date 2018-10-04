# -*- coding: utf-8 -*-

# Define here the models for your scraped items
#
# See documentation in:
# https://doc.scrapy.org/en/latest/topics/items.html

import scrapy
from scrapy.contrib.loader.processor import TakeFirst

class AdnItem(scrapy.Item):
    # define the fields for your item here like:
    # name = scrapy.Field()
    #pass
    title = scrapy.Field()
    description = scrapy.Field()
    keywords = scrapy.Field()
    logo = scrapy.Field()
    contacto = scrapy.Field()
    h1 = scrapy.Field()
    h2 = scrapy.Field()
    h3 = scrapy.Field()
    h4 = scrapy.Field()
    h5 = scrapy.Field()
    h6 = scrapy.Field()
    dataLayer = scrapy.Field()
    dataLayerString = scrapy.Field()
    url = scrapy.Field()
    #datetime = scrapy.Field()
