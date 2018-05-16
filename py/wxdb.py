﻿# -*- coding: UTF-8 -*-  

import re
import os
import codecs
import sys
#import MySQLdb
import pymysql
import datetime
import time
import random
import urllib
import requests
import json

reload(sys)
sys.setdefaultencoding('utf-8')


#主函数
def wxdb_insert(cur, type, author, source, source_id, ur, pubtime, nowTime, title, digest, image0, image1, image2, image3, content, rawdata):
    if content:
        #插入数据
        sql = '''insert into weshow_article 
                    (type, author_name,source_name,source_id,source_url,pub_time_str,pub_time,title,digest,image0,image1,image2,image3,content,rawtext,rawdata) 
                values(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)'''
        sqlMagazine = '''insert into weshow_magazine 
                    (name,add_time) 
                values(%s, %s)'''

        sqlFind = '''select id from weshow_magazine where name=%s '''
        try:
            effect_row = cur.execute(sqlFind, (source))
            print (effect_row)
            if effect_row >= 1:
                print ('data exist')
                row = cur.fetchone()
                if row:
                    print(row)
                    source_id = row[0]
                    print (source_id)
            else:
                try:
                    cur.execute(sqlMagazine, (source, nowTime))
                except pymysql.Error, err1:
                    print err1
        except pymysql.Error, errFind:
            print (errFind)

        try:
            cur.execute(sql, (type, author, source, source_id, ur, pubtime, nowTime, title, digest, image0, image1, image2, image3, content, '', rawdata))
        except pymysql.Error, err:
            print (err)
        print ('execute\n')
        #else:
        #    print u'数据库插入成功'

def wxdb_postdata(cur, type, author, source, source_id, ur, pubtime, nowTime, title, digest, image0, image1, image2, image3, content, rawdata):
    if content:
        #POST数据
        addUrl = "https://www.imcou.com/api/upload/add"
        values = {}
        values['type'] = type
        values['author_name'] = author
        values['source_name'] = source
        values['source_id'] = source_id
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
        response = requests.post(addUrl, values)
        #print (response)
        print ('post\n')

def wxdb_exist(cur, url):
    if cur:
        if url:
            sqlFind = '''select * from weshow_article where source_url=%s '''
            try:
                effect_row = cur.execute(sqlFind, (url))
                print (effect_row)
                if effect_row >= 1:
                    print ('data exist')
                    #continue #DATA EXIST
                    return 1
            except pymysql.Error, errFind:
                print (errFind)
    return 0

def wxdb_getimage(imgObj, index, label, site):
    image1 = ''
    if imgObj:
        #image0 = imgObj[0].attrs[label]
        #if image0.find("http://") == -1:
        #    image0 = site + image0
        if len(imgObj) > index:
            image1 = imgObj[index].attrs[label]
            if image1.find("http://") == -1:
                image1 = site + image1
                #print('image1')
                print(image1)
    return image1

def wxdb_fm_datetime(pubtime):
    nowTime = time.time()
    if pubtime:
        pubtime = pubtime.strip()
        timeStruct = time.strptime(pubtime, "%Y-%m-%d %H:%M:%S")
        nowTime = int(time.mktime(timeStruct))
    return nowTime

def wxdb_fm_date(pubtime):
    nowTime = time.time()
    if pubtime:
        pubtime = pubtime.strip()
        if len(pubtime) == 10:
            pubtime = pubtime + ' 06:00:00'
        else:
            if len(pubtime) == 5:
                pubtime = '2018-' + pubtime + ' 06:00:00'
        timeStruct = time.strptime(pubtime, "%Y-%m-%d %H:%M:%S")
        nowTime = int(time.mktime(timeStruct)) + random.randint(1, 60000)
        if (time.time() - nowTime < 0):
            nowTime = time.time() - 100
    return nowTime
