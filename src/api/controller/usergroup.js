'use strict';

import Base from './base.js';
const fs = require('fs');
const _ = require('lodash');

export default class extends Base {
  /**
   * index action
   * @return {Promise} []
   */
  async getbygidAction(){
    let id = this.get('gid');
    let info = await this.model('usergroup').where({id: id}).select();
    return this.json(info);
  }

  async getbyopengidAction(){
	let gid = this.get('open_gid');
    let info = await this.model('usergroup').where({open_gid: gid}).select();
    return this.json(info);
  }

  async getbyuidAction(){
	let uid = this.get('uid');
    let info = await this.model('usergroup').where({uid: uid}).select();
    return this.json(info);
  }

  async getbyopenidAction(){
	let uid = this.get('openid');
    let info = await this.model('usergroup').where({openid: uid}).select();
    return this.json(info);
  }

  async addAction(){
	let gid = this.post('gid');
	let uid = this.post('userid');
	let note = this.post('note');
    let check_time = this.post('check_time');
	console.log('UserGroup.add');
	console.log(uid);
	console.log(gid);
	console.log(check_time);
	
	let existInfo = await this.model('usergroup').where({openid: uid, open_gid: gid}).find();
	if (!think.isEmpty(existInfo)) {
		return this.success({
          result: 'ALREADY EXIST',
	      rid: -1,
          errorCode: 1
        });
	}
	
    let addResult = await this.model('usergroup').add({
        check_time: check_time,
        open_gid: gid,
		openid: uid,
		note: note
    });
	
	return this.success({
      result: 'OK',
	  gid: addResult,
      errorCode: 0
    });
  }

}