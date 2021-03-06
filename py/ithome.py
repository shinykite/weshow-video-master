﻿# -*- coding: UTF-8 -*-  
from selenium import webdriver      
from selenium.webdriver.common.keys import Keys
import selenium.webdriver.support.ui as ui
import re
import os
import codecs
import sys
#import MySQLdb
import pymysql
import datetime
import time
import urllib
import urllib2
from bs4 import BeautifulSoup
import requests
import json
import ssl
from requests.auth import HTTPBasicAuth

#打开Firefox浏览器 设定等待加载时间
#driver = webdriver.Firefox()  
#wait = ui.WebDriverWait(driver,10)

reload(sys)
sys.setdefaultencoding('utf-8')

#主函数
def main():
    #print （'main'）
    beginIndex = int(sys.argv[1])
    endIndex = int(sys.argv[2])
    print (beginIndex)
    #获取txt文件总行数  
    count = len(open("py/ithome_info_url.txt",'rU').readlines())
    print (count)
    n = 0  
    urlfile = open("py/ithome_info_url.txt",'r')

    #循环获取文章   
    while n < count:
        url = urlfile.readline()  
        url = url.strip("\n")  
        print (url)
        #driver.get(url)  

        #nowTime=datetime.datetime.now().microsecond
        nowTime = time.time()
        time.sleep(1)
  
        #数据库操作结合  
        conn=pymysql.connect(host='localhost', user='root',  use_unicode='true', charset="utf8mb4",
                             passwd='weshowapp1', port=3306, db='weshow')  
        cur=conn.cursor() #数据库游标  
        try:

            #报错:UnicodeEncodeError: 'latin-1' codec can't encode character  
            #conn.set_character_set('utf8mb4')  
            cur.execute('SET NAMES utf8mb4;')  
            cur.execute('SET CHARACTER SET utf8mb4;')  
            cur.execute('SET character_set_connection=utf8mb4;')

            #具体内容处理  
            m = beginIndex #第1页
            while m <= endIndex:
                ur = url + str(m) + '.htm'
                print (ur)
                urldata = ''
                try :
                    urldata = urllib2.urlopen(ur).read()
                    #urldata = urllib.request.urlopen(ur).read()
                #except (urllib.error.HTTPError):
                #    print ("URLLIB Error ")
                #    m = m + 1
                #    continue
                except (urllib2.HTTPError):
                    print ("URLLIB2 Error ")
                    #print (e0)
                    m = m + 1
                    continue
                soup = BeautifulSoup(urldata, "html.parser")
                #print soup

                title = ''
                content = ''
                digest = ''
                rawdata = ''
                image0 = ''
                image1 = ''
                image2 = ''
                image3 = ''
                author = ''
                source = 'IT之家'
                pubtime = ''
                nowTime = time.time()

                print ('parse')
                #标题
                #article_title = driver.find_elements_by_xpath("//div[@class='title']")
                article_title = soup.find("title")
                #article_title = soup.find(class_="article__heading__title")
                if article_title:
                    print ('article_title')
                    title = article_title.text
                    print (title)
                else:
                    m = m + 1
                    continue

                #摘要  
                #article_digest = driver.find_elements_by_xpath("//div[@class='abstract']")
                #article_digest = soup.find_all(attrs={'class':'summary'})
                #article_digest = soup.find('div', class_="summary")
                #if article_digest:
                #    print ('article_digest')
                #    digest = article_digest.text
                #else:
                #    m = m + 1
                #    continue

                #Content
                #article_content = driver.find_elements_by_xpath("//div[@class='contentContainer']")
                article_content = soup.find('div', class_="post_content")
                #print ('article_content')
                #print (article_content)
                if article_content:
                    content = unicode(article_content.text)
                    content = content.strip("\n")
                    content = content.strip()
                    content = content.strip("\n")
                    digest = content[0:156]
                    rawdata = unicode(article_content)
                    image0 = ''
                    image1 = ''
                    image2 = ''
                    image3 = ''
                    rawSoup = BeautifulSoup(rawdata)
                    imgObj = rawSoup.find_all('img')
                    #print(imgObj)
                    if imgObj:
                        image0 = imgObj[0].attrs['data-original']
                        if len(imgObj) > 1:
                            image1 = imgObj[1].attrs['data-original']
                        if len(imgObj) > 2:
                            image2 = imgObj[2].attrs['data-original']
                        if len(imgObj) > 3:
                            image3 = imgObj[3].attrs['data-original']
                        #print('image0')
                        #print(image0)
                    rawdata = rawdata.replace('width=', 'wd0=')
                    rawdata = rawdata.replace('height=', 'hg0=')
                    rawdata = rawdata.replace('<img', '<img width=100%')
                    rawdata = rawdata.replace('data-original', 'src')
                else:
                    m = m + 1
                    continue

                pubtime = '2018-01-01 01:01:01'
                #Author
                #article_author = driver.find_elements_by_xpath("//div[@class='author']")
                article_author = soup.find(class_="pt_info pre1")
                if article_author:
                    #print con + '\n'
                    author = article_author.text
                    author = author.strip("\n")
                    author = author.strip()
                    author = author.strip("\n")
                    print ('author')
                    print (author)
                    tm = re.match(u'(.*)   (.*)\((.*)\)', author, re.M|re.I)
                    if tm:
                        #print (tm)
                        pubtime = tm.group(1)
                        source = tm.group(2)
                        author = tm.group(3)
                    #print (tm)
                else:
                    m = m + 1
                    continue

                #source
                #article_source = soup.find(class_="m-i-type-source rt")

                #time
                article_time = soup.find(class_="pt_info pre1")
                print ('article_time')
                print (article_time)
                if article_time:
                    #if len(article_time.text) < 7:
                    #    pubtime = time.strftime('%Y-%m-%d ',time.localtime(time.time()))+ article_time.text
                    #else:
                    #    pubtime = article_time.text[0:19]
                    try:
                        timeStruct = time.strptime(pubtime, "%Y-%m-%d %H:%M:%S")
                        nowTime = int(time.mktime(timeStruct))
                    except (ValueError):
                        #print (err1)
                        m = m + 1
                        continue
                else:
                    m = m + 1
                    continue

                if content:
                    #插入数据
                    sql = '''insert into weshow_article 
                                (author_name,source_name,source_url,pub_time_str,pub_time,title,digest,image0,image1,image2,image3,content,rawtext,rawdata) 
                            values(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)'''
                    sqlMagazine = '''insert into weshow_magazine 
                                (name,add_time) 
                            values(%s, %s)'''

                    try:
                        cur.execute(sql, (author, source, ur, pubtime, nowTime, title, digest, image0, image1, image2, image3, content, rawdata, rawdata))
                    except (pymysql.Error):
                        print ('err')
                    try:
                        cur.execute(sqlMagazine, (source, nowTime))
                    except pymysql.Error, err1:
                        print (err1)
                    print ('execute\n')

                    addUrl = "https://www.imcou.com/api/upload/add"
                    values = {}
                    values['author_name'] = author
                    values['source_name'] = source
                    values['source_url'] = ur
                    values['pub_time_str'] = pubtime
                    values['pub_time'] = nowTime
                    values['title'] = title
                    values['digest'] = digest
                    values['content'] = content
                    values['rawtext'] = rawdata
                    values['rawdata'] = rawdata
                    values['image0'] = image0
                    values['image1'] = image1
                    values['image2'] = image2
                    values['image3'] = image3
                    #response = requests.post(addUrl, values)
                    #print (response)
                    print ('post\n')

                #else:
                #    print u'数据库插入成功'

                m = m + 1

        #异常处理
        #except MySQLdb.Error,e:
        #except pymysql.Error,e:
        except (pymysql.Error):
            print ("Mysql Error")
            #print ("Mysql Error %d: %s" % (e.args[0], e.args[1]))
        finally:  
            cur.close()
            conn.commit()
            conn.close()

        n = n + 1

    else:  
        urlfile.close()
        print ('Load Completed')

main()