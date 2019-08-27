#!/usr/bin/python
import subprocess, sys
## command to run - tcp only ##
ruta = ["781839/acuario-filtro-externo-de-canasta-aquajet-130-litros/"]
id = "781839"

cmd = "scrapy crawl ImageSpider -a producto="+ruta[0]+" -a id="+id
#cmd = "scrapy crawl ImageSpider -a producto=641950/iphone-6-32gb-color-space-gray-r9-telcel/ -a id=641950"
 
## run it ##
p = subprocess.Popen(cmd, shell=True, stderr=subprocess.PIPE)
 
## But do not wait till netstat finish, start displaying output immediately ##
