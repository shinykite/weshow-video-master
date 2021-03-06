'use strict';

import Base from './base.js';

var fs = require('fs');
//var path = require('path');

var xwords = require('./xwords');
var wxconst = require('./wxconst');

var ppArray = [];

export default class extends Base {


  /**
   * index action
   * @return {Promise} []
   */
  async indexAction() {
    let id = this.post('id');
    let size = this.post('size');
    let filter = this.post('filter');
    let tm = this.post('tm');
    if (!this.checkTimeStamp(tm)) {
      return this.success({
        result: 'OK',
        errorCode: 0
      });
    }
    if (id == '' || id == undefined || id == null || id == NaN) {
      id = 0;
    }
    if (size == '' || size == undefined || size == null || size == NaN) {
      size = 10;
    }
    if (filter == '' || filter == undefined || filter == null || filter == NaN) {
      filter = 0;
    }
    let list = await this.model('question').where({id: [">=", id], filter: filter}).limit(size).select();
    var tk = this.post('wxtoken');
    this.assign({'quest_list': list, 'wxtoken': tk});
    this.display();
  }

  async getbyidAction() {
    let quest_id = this.get('question_id');
    let list = await this.model('question').where({id: quest_id}).find();
    if (!think.isEmpty(list)) {
        //console.log(list);
    }

    return this.success({
      questList: list
    });
  }

  async queryinputAction() {
    let sql = this.post('quest_sql');
    let tm = this.post('tm');
    if (!this.checkTimeStamp(tm)) {
      return this.success({
        result: 'OK',
        errorCode: 0
      });
    }

    let list = await this.model('question').query(sql);
    if (!think.isEmpty(list)) {
        //console.log(list);
    }

    this.assign('result', list);
    this.display();
  }

  async uploadAction() {
    var file = think.extend({}, this.file('file_input'));
    var filepath = file.path;

    let tm = this.post('tm');
    if (!this.checkTimeStamp(tm)) {
      return this.success({
        result: 'OK',
        errorCode: 0
      });
    }

    var lineReader = require('readline').createInterface({
      input: require('fs').createReadStream(filepath, {encoding: 'UTF-8'})
    });

    var add_tm = this.getCurrentTime();
    var count = 0;
    let questModel = this.model('question');
    await lineReader.on('line', function (line) {
      if(!line) return;
      var arr = line.split(',');

      var item_count = 3;
      if (arr[7] != '') {
        item_count = 4;
      }

      let addResult = questModel.add({
        title: 'A',
        creator_id: '1',
        creator_name: 'Administrator',
        create_time: add_tm,
        item_count: item_count,
        type: arr[1] == 'A' ? wxconst.QUIZ_CATEGORY_PUBLIC_MIX : wxconst.QUIZ_CATEGORY_SELF,
        source: arr[2],
        content: arr[3],
        item0: arr[4],
        item1: arr[5],
        item2: arr[6],
        item3: arr[7],
        answer: arr[8] == 'A' ? 0 : (arr[8] == 'B' ? 1 : (arr[8] == 'C' ? 2 : (arr[8] == 'D' ? 3 : 4))),
        note: arr[9],
        more: arr[10],
        category0: arr[11],
        category1: arr[12],
        category2: arr[13],
        category3: arr[14],
        tags: arr[15],
        level: arr[16]
      });
      if (addResult > 0) {
        count++;
      }
    });

    /*var uploadPath = think.RESOURCE_PATH + '/upload';
    think.mkdir(uploadPath);
    var basename = path.basename(filepath);
    fs.renameSync(filepath, uploadPath + '/' + basename);
    file.path = uploadPath + '/' + basename;

    if(think.isFile(file.path)){
      console.log('is file')
    }else{
      console.log('not exist')
    }*/

    this.assign('result', 'Success Add ' + count + ' Lines');

    this.display();
  }

  async uploadwordsAction() {
    var file = think.extend({}, this.file('file_input'));
    var filepath = file.path;

    var lineReader = require('readline').createInterface({
      input: require('fs').createReadStream(filepath, {encoding: 'UTF-8'})
    });

    var count = 0;
    let questModel = this.model('question');
    await lineReader.on('line', function (line) {
      if(!line) return;
      console.log(count);

      questModel.addWord(line);
      count = count + 1;
    });

    this.assign('result', 'Success Add ' + count + ' Lines');

    this.display();
  }

  async uploadpptxtAction() {
    var file = think.extend({}, this.file('file_input'));
    var filepath = file.path;

    var lineReader = require('readline').createInterface({
      input: require('fs').createReadStream(filepath, {encoding: 'UTF-8'})
    });

    ppArray.splice(0, ppArray.length);

    var count = 0;
    let questModel = this.model('question');
    await lineReader.on('line', function (line) {
      if(!line) return;
      console.log(count);

      ppArray.push(line);
      if (count % 2 == 1) {
        questModel.addPpText(ppArray[count - 1], line);
      }
      count = count + 1;
    });

    this.assign('result', 'Success Add ' + count + ' Lines');

    this.display();
  }

  async uploadmfgAction() {
    var file = think.extend({}, this.file('file_input'));
    var filepath = file.path;

    let tm = this.post('tm');
    if (!this.checkTimeStamp(tm)) {
      return this.success({
        result: 'OK',
        errorCode: 0
      });
    }

    var lineReader = require('readline').createInterface({
      input: require('fs').createReadStream(filepath, {encoding: 'UTF-8'})
    });

    var count = 0;
    let questModel = this.model('question');
    await lineReader.on('line', function (line) {
      if(!line) return;

      var addResult = questModel.addFromMfg(line);

      if (addResult > 0) {
        count++;
      }
    });

    this.assign('result', 'Success Add ' + count + ' Lines');

    this.display();
  }

  async mfgwithoutanswerAction() {
    let level = this.post('quest_level');
    let tags = this.post('quest_tags');
    let answer = this.post('answer');

    var file = think.extend({}, this.file('file_input'));
    var filepath = file.path;

    let questModel = this.model('question');
    var rawData = fs.readFileSync(filepath);
    if (rawData != null) {
      var start = rawData.indexOf('<title>');
      var end = rawData.indexOf('</title>');
      if (start == -1 || end == -1) {
        return this.display();
      }
      var next = (rawData+'').substring(start+7, end);
      //console.log(next);
      end = next.indexOf('A．');
      var content = next.substring(0, end);
      //console.log(content);
      var items = questModel.parseMfgTitleItems(next);
      end = next.indexOf('-魔方格');
      next = next.substring(0, end);
      start = next.lastIndexOf('-');
      var category0 = next.substring(start + 1);

      /*var DIVIDER = '<table style="WORD-BREAK: break-all" border="0" width="650"><tbody><tr><td>';
      var questDataArr = (rawData+"").split(DIVIDER);
      if (questDataArr.length < 2) {
        DIVIDER = '<table style="word-break:break-all" border="0" width="650"><tbody><tr><td>';
        questDataArr = (rawData+"").split(DIVIDER);
      }
      console.log(questDataArr.length);
      var note = await questModel.getMfgNote(questDataArr[2]);*/
      var note = '';
      answer = questModel.parseAnswer(answer);

      var item_count = 3;
      if (items.item3 != '') {
        item_count = 4;
      }
      //console.log(items);
      //console.log(content);
      var add_tm = this.getCurrentTime();

      let addResult = await this.model('question').add({
        title: 'A',
        creator_id: '1',
        creator_name: 'Administrator',
        create_time: add_tm,
        item_count: item_count,
        type: wxconst.QUIZ_CATEGORY_PUBLIC_MIX,
        level: level,
        source: 'mofangge',
        content: content,
        item0: items.item0,
        item1: items.item1,
        item2: items.item2,
        item3: items.item3,
        answer: answer,
        note: note,
        category0: category0,
        tags: tags
      });
    }
    this.assign('result', 'Success Add ' + 1 + ' File');

    var tk = this.post('wxtoken');
    this.assign({'wxtoken': tk});
    this.http.post('wxtoken', tk);
    this.post('wxtoken', tk);
    //this.redirect('index');
    this.display();
  }

  async uploadmfgfileAction() {
    let level = this.post('quest_level');
    let tags = this.post('quest_tags');
    let category0 = this.post('category0');

    var file = think.extend({}, this.file('file_input'));
    var filepath = file.path;

    let tm = this.post('tm');
    if (!this.checkTimeStamp(tm)) {
      return this.success({
        result: 'OK',
        errorCode: 0
      });
    }

    let questModel = this.model('question');
    var rawData = fs.readFileSync(filepath);
    if (rawData != null) {
      var DIVIDER = '<table style="WORD-BREAK: break-all" border="0" width="650"><tbody><tr><td><div>';
      var questDataArr = (rawData+"").split(DIVIDER);
      console.log(questDataArr.length);
      var content = await questModel.getMfgContent(questDataArr[1]);
      var items = await questModel.getMfgItems(questDataArr[1]);
      var answer = await questModel.getMfgAnswer(questDataArr[2]);
      var note = await questModel.getMfgNote(questDataArr[3]);

      var item_count = 3;
      if (items.item3 != '') {
        item_count = 4;
      }
      //console.log(items);
      console.log(content);
      var add_tm = this.getCurrentTime();

      let addResult = await this.model('question').add({
        title: 'A',
        creator_id: '1',
        creator_name: 'Administrator',
        create_time: add_tm,
        item_count: item_count,
        type: wxconst.QUIZ_CATEGORY_PUBLIC_MIX,
        level: level,
        source: 'mofangge',
        content: content,
        item0: items.item0,
        item1: items.item1,
        item2: items.item2,
        item3: items.item3,
        answer: answer,
        note: note,
        category0: category0,
        tags: tags
      });
    }
    this.assign('result', 'Success Add ' + 1 + ' File');

    this.display();
  }

  async getcategoryAction() {
    let openid = this.get('openid');

    return this.success({
      category_items: wxconst.QUESTION_CATEGORY_ITEMS
    });
  }

  async getrulesAction() {
    let openid = this.get('openid');

    return this.success({
      game_rules: wxconst.QUIZ_GAME_RULES
    });
  }

  async getbyuserAction() {
    let creator_id = this.get('creator_id');
    let list = await this.model('question').where({creator_id: creator_id}).select();
    if (!think.isEmpty(list)) {
        console.log(list.length);
    }

    return this.success({
      questList: list
    });

  }

  async getrandomAction() {
    let count = this.get('count');
    let onlyself = this.get('onlyself');
    let openid = this.get('openid');
    let type = this.get('type');
    if (type == '' || type == undefined) {
      type = wxconst.QUIZ_CATEGORY_SELF;
    }

    let list = await this.model('question').getRandomList(count, type, wxconst.QUIZ_LEVEL_AUTO, openid, onlyself);
    return this.success({
      questList: list
    });
  }

  async auditxwordAction() {
    let content = this.get('content');
    var swords = xwords.filter(content);
    return this.success({
      result: 'OK',
      xwords: swords,
      errorCode: 0
    });
  }

  async auditquestionAction() {
    let quest_content = this.post('quest_content');
    let quest_item_a = this.post('quest_item_a');
    let quest_item_b = this.post('quest_item_b');
    let quest_item_c = this.post('quest_item_c');
    let quest_item_d = this.post('quest_item_d');

    var swords = xwords.block(quest_content) + xwords.block(quest_item_a) + xwords.block(quest_item_b)
         + xwords.block(quest_item_c) + xwords.block(quest_item_d);
    console.log(swords);
    //if (xwords.filter(quest_content) || xwords.filter(quest_item_a) || xwords.filter(quest_item_b)
    //     || xwords.filter(quest_item_c) || xwords.filter(quest_item_d)) {
    if (swords != '') {
      return this.fail({
        result: 'AUDIT_ERROR',
        audit: false,
        sword: swords,
        errorCode: 301
      });
    }

    return this.success({
      result: 'OK',
      errorCode: 0
    });
  }

  async webaddAction() {
    return await this.addAction();
  }

  async addAction() {
    let title = this.post('title');
    let creator_id = this.post('creator_id');
    let creator_name = this.post('creator_name');
    let creator_account = this.post('creator_account');
    let creator_level = this.post('creator_level');
    let quest_content = this.post('quest_content');
    let quest_item_a = this.post('quest_item_a');
    let quest_item_b = this.post('quest_item_b');
    let quest_item_c = this.post('quest_item_c');
    let quest_item_d = this.post('quest_item_d');
    let item_count = this.post('item_count');
    let quest_answer = this.post('quest_answer');
    let type = this.post('quest_type');
    let level = this.post('quest_level');
    let tags = this.post('quest_tags');
    let source = this.post('quest_source');
    let note = this.post('note');
    let more = this.post('more');
    let category0 = this.post('category0');
    let category1 = this.post('category1');
    let category2 = this.post('category2');
    let category3 = this.post('category3');
    //let create_time = this.post('create_time');
    let create_time = this.getCurrentTime();
    console.log('addAction');
    //console.log(quest_content);
    /*if (quest_content == '' || quest_item_a == '' || quest_item_b == ''
         || quest_item_c == ''|| quest_answer == '') {
      return this.fail({
        result: 'INVALID_INPUT',
        audit: false,
        errorCode: 302
      });
    }*/

    //var audit = this.model('question').checkInput(quest_content, quest_item_a, quest_item_b, quest_item_c, quest_item_d);
    //if (!audit) {
    var swords = xwords.block(quest_content) + xwords.block(quest_item_a) + xwords.block(quest_item_b)
         + xwords.block(quest_item_c) + xwords.block(quest_item_d);
    console.log(swords);
    //if (xwords.filter(quest_content) || xwords.filter(quest_item_a) || xwords.filter(quest_item_b)
    //     || xwords.filter(quest_item_c) || xwords.filter(quest_item_d)) {
    if (swords != '') {
      return this.fail({
        result: 'AUDIT_ERROR',
        audit: false,
        sword: swords,
        errorCode: 301
      });
    }

    var filter = 0;
    var filterwords = xwords.filter(quest_content) + xwords.filter(quest_item_a) + xwords.filter(quest_item_b)
         + xwords.filter(quest_item_c) + xwords.filter(quest_item_d);
    console.log(filterwords);
    if (filterwords != '') {
      filter = 1;
      note = 'xwords:' + filterwords;
    }

    let questResult = await this.model('question').add({
        title: title,
        creator_id: creator_id,
        creator_name: creator_name,
        create_time: create_time,
        content: quest_content,
        item_count: item_count,
        item0: quest_item_a,
        item1: quest_item_b,
        item2: quest_item_c,
        item3: quest_item_d,
        answer: quest_answer,
        type: type,
        level: level,
        filter: filter,
        tags: tags,
        source: source,
        category0: category0,
        category1: category1,
        category2: category2,
        category3: category3,
        note: note,
        more: more
    });

    return this.success({
      result: 'OK',
      question_id: questResult,
      errorCode: 0
    });
  }

  async updateAction() {
    let id = this.post('id');
    let title = this.post('title');
    let creator_id = this.post('creator_id');
    let creator_name = this.post('creator_name');
    let creator_account = this.post('creator_account');
    let creator_level = this.post('creator_level');
    let quest_content = this.post('quest_content');
    let quest_item_a = this.post('quest_item_a');
    let quest_item_b = this.post('quest_item_b');
    let quest_item_c = this.post('quest_item_c');
    let quest_item_d = this.post('quest_item_d');
    let item_count = this.post('item_count');
    let quest_answer = this.post('quest_answer');
    let type = this.post('quest_type');
    let level = this.post('quest_level');
    let tags = this.post('quest_tags');
    let source = this.post('quest_source');
    let note = this.post('note');
    let more = this.post('more');
    let category0 = this.post('category0');
    let category1 = this.post('category1');
    let category2 = this.post('category2');
    let category3 = this.post('category3');
    //let create_time = this.post('create_time');
    let create_time = this.getCurrentTime();
    console.log('updateAction');
    //console.log(quest_content);
    if (quest_content == '' || quest_item_a == '' || quest_item_b == ''
         || quest_item_c == ''|| quest_answer == '') {
      return this.fail({
        result: 'INVALID_INPUT',
        audit: false,
        errorCode: 302
      });
    }

    //var audit = this.model('question').checkInput(quest_content, quest_item_a, quest_item_b, quest_item_c, quest_item_d);
    //if (!audit) {
    var swords = xwords.block(quest_content) + xwords.block(quest_item_a) + xwords.block(quest_item_b)
         + xwords.block(quest_item_c) + xwords.block(quest_item_d);
    console.log(swords);
    //if (xwords.filter(quest_content) || xwords.filter(quest_item_a) || xwords.filter(quest_item_b)
    //     || xwords.filter(quest_item_c) || xwords.filter(quest_item_d)) {
    if (swords != '') {
      return this.fail({
        result: 'AUDIT_ERROR',
        audit: false,
        sword: swords,
        errorCode: 301
      });
    }

    var filter = 0;
    var filterwords = xwords.filter(quest_content) + xwords.filter(quest_item_a) + xwords.filter(quest_item_b)
         + xwords.filter(quest_item_c) + xwords.filter(quest_item_d);
    console.log(filterwords);
    if (filterwords != '') {
      filter = 1;
      note = 'xwords:' + filterwords;
    }

    let questResult = await this.model('question').where({id: id}).update({
        title: title,
        creator_id: creator_id,
        creator_name: creator_name,
        create_time: create_time,
        content: quest_content,
        item_count: item_count,
        item0: quest_item_a,
        item1: quest_item_b,
        item2: quest_item_c,
        item3: quest_item_d,
        answer: quest_answer,
        type: type,
        level: level,
        filter: filter,
        tags: tags,
        source: source,
        category0: category0,
        category1: category1,
        category2: category2,
        category3: category3,
        note: note,
        more: more
    });

    return this.success({
      result: 'OK',
      question_id: questResult,
      errorCode: 0
    });
  }

  async deleteAction() {
    let id = this.post('id');
    let str = this.post('delete');
    console.log('delete ' + id + ',' + str);
    if (id == '') {
      var arr = str.split(':');
      if (arr.length > 1) {
        id = arr[1];
      }
    }
    let result = await this.model('question').where({id: id}).delete();

    return this.success({
      result: result
    });
  }
}
