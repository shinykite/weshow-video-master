'use strict';

import Base from './base.js';

var wxconst = require('./wxconst');
const fs = require('fs');
const _ = require('lodash');

var mSocketMap = new Map();

export default class extends Base {

  async getbyquizidAction() {
    let qid = this.get('quizid');
    let onlywin = this.get('onlywin');
    if (onlywin != 1 && onlywin != '1') {
      let refresh = this.get('refresh');
      if (await this.model('quizuser').noNewData(qid, refresh, this.get('timestamp'))) {
        return this.fail({
          result: 'NO NEW DATA',
          hasNew: 0,
          errorCode: 1
        });
      }
    }

    let info = null;
    let quizInfo = await this.model('quiz').where({id: qid}).find();
    if (!think.isEmpty(quizInfo)) {
      console.log('getbyquizid');
      console.log(quizInfo.category);
      console.log(quizInfo.creator_id);
      if (onlywin == 1 || onlywin == '1') {
        if (quizInfo.category == 17) {
          info = await this.model('quizuser').where({ quizid: qid, game_status: wxconst.GAME_STATUS_WIN, openid: ["!=", quizInfo.creator_id]}).order('add_time DESC').limit(8).select();
        }
        else {
          info = await this.model('quizuser').where({ quizid: qid, game_status: wxconst.GAME_STATUS_WIN }).order('add_time DESC').limit(8).select();
        }
      }
      else {
        if (quizInfo.category == 17) {
          info = await this.model('quizuser').where({ quizid: qid, openid: ["!=", quizInfo.creator_id]}).order('add_time DESC').limit(8).select();
        }
        else {
          info = await this.model('quizuser').where({ quizid: qid }).order('add_time DESC').limit(8).select();
        }
      }
    }
    await this.model('quizuser').setUserInfo(info);
    return this.json(info);
  }
  
  async getquizuserAction() {
    let qid = this.get('quizid');
    let uid = this.get('openid');
    let refresh = this.get('refresh');
    if (await this.model('quizuser').noNewData(qid, refresh, this.get('timestamp'))) {
      return this.fail({
        result: 'NO NEW DATA',
        hasNew: 0,
        errorCode: 1
      });
    }

    let info = await this.model('quizuser').where({ quizid: qid, openid: uid }).select();
    await this.model('quizuser').setUserInfoWithUid(info, uid);
    return this.json(info);
  }
  
  async getbyuidAction() {
    let uid = this.get('uid');
    /*let refresh = this.get('refresh');
    if (await this.model('quizuser').noNewData('', refresh, this.get('timestamp'))) {
      return this.fail({
        result: 'NO NEW DATA',
        hasNew: 0,
        errorCode: 1
      });
    }*/
    let info = await this.model('quizuser').where({ uid: uid }).select();
    await this.model('quizuser').setUserInfo(info);
    return this.json(info);
  }

  async getbyopenidAction() {
    let uid = this.get('openid');
    let game_status = this.get('game_status');
    /*let refresh = this.get('refresh');
    if (await this.model('quizuser').noNewData('', refresh, this.get('timestamp'))) {
      return this.fail({
        result: 'NO NEW DATA',
        hasNew: 0,
        errorCode: 1
      });
    }*/
    let list = await this.model('quizuser').where({ openid: uid, game_status: game_status }).limit(30).order('quizid DESC').select();
    //await this.model('quizuser').setUserInfoWithUid(list, uid);
    if (!think.isEmpty(list)) {
      for (var i = 0; i < list.length; i++) {
        list[i].open_gid = '0';
        list[i].award = '';
        list[i].award_image = '';
        if (think.isEmpty(list[i].quizid)) { list[i].quizid = 0; }
        let quizInfo = await this.model('quiz').where({ id: list[i].quizid }).find();
        if (!think.isEmpty(quizInfo)) {
          list[i].open_gid = quizInfo.open_gid;
          list[i].award = quizInfo.award;
          list[i].award_image = quizInfo.award_image;
          if (quizInfo.price > 0) {
            list[i].award = '奖金' + list[i].game_gain + '元';
          }
        }
        list[i].format_time = this.formatDateTime(list[i].add_time);
        list[i].str_time = this.getFullDateTime(list[i].add_time);
        list[i].desc = '赢取 ' + list[i].award;
      }
    }
    return this.json(list);
  }

  async getansweredAction() {
    let quizid = this.get('quizid');
    let question_id = this.get('question_id');
    let refresh = this.get('refresh');
    if (await this.model('quizuser').noNewData(quizid, refresh, this.get('timestamp'))) {
      return this.fail({
        result: 'NO NEW DATA',
        hasNew: 0,
        errorCode: 1
      });
    }
    let info = await this.model('quizuser').where({ quizid: quizid, answer_status: question_id }).order('answer_time DESC').select();
    await this.model('quizuser').setUserInfo(info);
    return this.json(info);
  }

  async addAction() {
    let quizid = this.post('quizid');
    let uid = this.post('userid');
    let note = this.post('note');
    //let add_time = this.post('add_time');
    var add_time = this.getCurrentTime();
    console.log('QuizUser.add');
    console.log(uid);
    console.log(quizid);
    console.log(add_time);
    
    let existInfo = await this.model('quizuser').where({openid: uid, quizid: quizid}).find();
    if (!think.isEmpty(existInfo)) {
        return this.success({
          result: 'ALREADY EXIST',
          rid: -1,
          errorCode: 1
        });
    }
    let addResult = await this.model('quizuser').add({
        add_time: add_time,
        quizid: quizid,
        openid: uid,
        note: note
    });
    
    return this.success({
      result: 'OK',
      rid: addResult,
      errorCode: 0
    });
  }

  async updatestatusAction() {
    var gstatus = this.post('status');
    var uid = this.post('uid');
    var openid = this.post('openid');
    var qid = this.post('quizid');
    console.log(qid);
    console.log(gstatus);

    await this.model('quizuser').where({quizid: qid, openid: openid}).update({
      game_status: gstatus
    });
    
    return this.success({
      result: 'OK',
      errorCode: 0
    });
  }

  async updategainAction() {
    var openid = this.post('openid');
    var qid = this.post('quizid');
    console.log(qid);
    console.log('updategain');

    let quizInfo = await this.model('quiz').where({id: qid}).find();
    if (think.isEmpty(quizInfo)) {
      console.log('Invalid quiz id ' + qid);
      return this.fail({
        result: 'DATA NOT EXIST',
        errorCode: 1
      });
    }

    var quizuserModel = this.model('quizuser');
    var userModel = this.model('user');
    var trResult = quizuserModel.transaction(function () {
      return quizuserModel.calculateGain(qid).then(function (result) {
        if (result) {
          if (!think.isEmpty(quizInfo)) {
            return userModel.updateRelive(quizInfo.creator_id, wxconst.RELIVE_ADD, 1, qid, '0');
          }
        }
        return false;
      });
    }).then(function (result) {
      return result;
    }).catch(function (err) {
      return err;
    })

    return this.success({
      result: 'OK',
      errorCode: trResult
    });
  }

  async updateansweredAction() {
    console.log('updateanswered');
    var userid = this.post('openid');
    var question_id = this.post('question_id');
    var answer_set = this.post('answer_set');
    var answer_correct = this.post('answer_correct');
    var qid = this.post('quizid');
    //let answer_time = this.post('answer_time');
    var answer_time = this.getCurrentTime();
    console.log(qid);
    console.log(question_id);
    console.log(answer_correct);
    if ((answer_correct+'') != '0' && (answer_correct+'') == '') {
      console.log(answer_correct);
      answer_correct = 1;
    }
    console.log(answer_correct);

    await this.model('quizuser').where({quizid: qid, openid: userid}).update({
      answer_status: question_id,
      answer_set: answer_set,
      answer_correct: answer_correct,
      answer_time: answer_time
    });

    return this.success({
      result: 'OK',
      errorCode: 0
    });
  }

  //WebSocket Related
  async openAction(self) {
    console.log('openAction');
    var openid = this.get('openid');
    //var openid = this.http.header('openid');
    console.log(openid);
    if (Object.prototype.toString.call(openid) == '[object Array]') {
      openid = openid[openid.length - 1];
    }
    //console.log(this.http.header('openid'));
    //console.log(self.http.header('openid'));
    var socket = self.http.socket;
    socket.openid = openid;
    //await this.model('quizuser').openWebSocket(socket);
    mSocketMap.set(openid, socket);
    //console.log(mSocketMap);
    this.emit('connected', {msg: 'connected'});
  }

  async closeAction(self) {
    console.log('closeAction');
    var socket = self.http.socket;
    var openid = socket.openid;
    console.log(openid);
    //socket.openid = openid;
    //await this.model('quizuser').closeWebSocket(socket);
    for (var [key, value] of mSocketMap) {
      if (value.id == socket.id) {
        openid = key;
        break;
      }
    }
    console.log(openid);
    mSocketMap.delete(openid);
  }

  async joinAction(self) {
    console.log('joinAction');
    console.log(self.http.data);
    var openid = self.http.data.openid;
    var quizid = self.http.data.quizid;
    //var socket = self.http.socket;
    //socket.openid = openid;
    await this.sendWebSocketMsg(quizid, openid, 'join');
    /*for (var item in sockets) {
      var socket = sockets[item];
      console.log(item);
      console.log(socket);
      if (socket != null && socket != undefined) {
        console.log(socket);
        this.emit('join', {
          msg: 'join',
          openid: openid
        });
        console.log('send to ' + socket.openid);
      }
    }*/
  }

  async answerAction(self) {
    console.log('answerAction');
    console.log(self.http.data);
    var openid = self.http.data.openid;
    var quizid = self.http.data.quizid;
    //var socket = self.http.socket;
    //socket.openid = openid;
    await this.sendWebSocketMsg(quizid, openid, 'answer');
    /*for (var item in sockets) {
      var socket = sockets[item];
      if (socket != null && socket != undefined) {
        console.log(socket);
        this.emit('answer', {
          msg: 'answer',
          openid: openid
        });
        console.log('send to ' + socket.openid);
      }
    }*/
  }

  async sendWebSocketMsg(quizid, uid, msg) {
    console.log('sendWebSocketMsg');
    let userList = await this.model('quizuser').where({ quizid: quizid }).select();
    console.log(mSocketMap);
    for (var i = 0; i < userList.length; i++) {
      var openid = userList[i].openid;
      console.log(openid);
      var socket = mSocketMap.get(openid);
      //console.log(socket);
      if (socket != null && socket != undefined) {
        console.log(socket.id);
        //console.log(socket.openid);
        socket.send(msg, {
          msg: msg,
          openid: uid
        });
        console.log('send ' + uid + ' ----> ' + socket.openid);
      }
    }
  }
}