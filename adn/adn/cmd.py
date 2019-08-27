#!/usr/bin/python
import subprocess, sys
## command to run - tcp only ##
ruta = ["http://www.carpinterialatablita.com/"]
id = "781839"

#cmd = "scrapy crawl ImageSpider -a url="+ruta[0]
cmd = "curl -X POST \"10.34.180.126:9200/scrapping/_delete_by_query\" -H 'Content-Type: application/json' -d'{\"query\": {   \"range\": {\"date\": {\"lte\": \"now-1d/d\"}}}}'"
print(cmd)
#cmd = "scrapy crawl ImageSpider -a producto=641950/iphone-6-32gb-color-space-gray-r9-telcel/ -a id=641950"
 
## run it ##
p = subprocess.Popen(cmd, shell=True, stderr=subprocess.PIPE)
print(p)
 
## But do not wait till netstat finish, start displaying output immediately ##
