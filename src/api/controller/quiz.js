'use strict';

import Base from './base.js';

export default class extends Base {

  /**
   * index action
   * @return {Promise} []
   */
  async indexAction() {
    let quiz_id = this.get('quiz_id');
    let list = await this.model('quiz').where({id: quiz_id}).find();
	if (!think.isEmpty(list)) {
        console.log(list.id);
		//for (var i = 0; i < list.length; i++) {
            //console.log(i);
		    var questArr = [];
			var arr = list.questions.split('-');
		    for (var j = 0; j < arr.length; j++) {
				var quest_id = arr[j];
                console.log(quest_id);
				let questItem = await this.model('question').where({id: quest_id}).find();
				questItem.answered = -1;
				questArr.push(questItem);
			}
			list.quest_array = questArr;
		//}
	}

    return this.success({
      quizList: list
    });

  }
  
  async getbyuserAction() {
    let openid = this.get('openid');
    console.log(openid);
    let quizIdList = await this.model('quizuser').field('quizid').where({openid: openid}).limit(30).select();
	let list = null;
    console.log(quizIdList);
	if (!think.isEmpty(quizIdList)) {
		var qidList = [];
		for (var i = 0; i < quizIdList.length; i++) {
			qidList.push(quizIdList[i].quizid);
		}
        console.log(qidList);
        list = await this.model('quiz').where({'id': ["IN", qidList]}).order('start_time DESC').select();
	    if (!think.isEmpty(list)) {
          //console.log(list);
		  for (var i = 0; i < list.length; i++) {
            console.log(i);
		    var questArr = [];
			if (!think.isEmpty(list[i].questions)) {
			    var arr = list[i].questions.split('-');
		        for (var j = 0; j < arr.length; j++) {
				    var quest_id = arr[j];
                    console.log(quest_id);
				    let questItem = await this.model('question').where({id: quest_id}).find();
				    questItem.answered = -1;
				    questArr.push(questItem);
			    }
			}
			list[i].quest_array = questArr;
			
			let quInfo = await this.model('quizuser').where({quizid: list[i].id, openid: openid}).find();
			if (!think.isEmpty(quInfo)) {
				let userInfo = await this.model('user').where({openid: quInfo.openid}).find();
				if (!think.isEmpty(userInfo)) {
					quInfo.user_photo = userInfo.photo_url;
				}
			}
			list[i].userdata = quInfo;
          }
		}
	}

    return this.success({
      quizList: list
    });

  }

  async addAction() {
    let title = this.post('title');
    let create_time = this.post('create_time');
    let creator_id = this.post('creator_id');
    let creator_name = this.post('creator_name');
    let creator_photo = this.post('creator_photo');
    let creator_account = this.post('creator_account');
    let creator_level = this.post('creator_level');
    let quiz_level = this.post('quiz_level');
    let quiz_category = this.post('quiz_category');
    let quest_count = this.post('question_count');
    let quest_list = this.post('question_list');
    let min_users = this.post('min_users');
    let price = this.post('price');
    let start_time = this.post('start_time');
    console.log('addAction');
    console.log(price);
    console.log(quest_list);
    console.log(quest_count);
	
	var table = 'weshow_question';
	var sql = 'SELECT * FROM ' + table + ' WHERE id >= (SELECT floor(RAND() * ((SELECT MAX(id) FROM '
	    + table + ') - (SELECT MIN(id) FROM ' + table + ')) + (SELECT MIN(id) FROM '
		+ table + '))) ORDER BY id LIMIT ' + quest_count + ';';
	var list = await this.model('question').query(sql);
    console.log(list.length);
	//var randId = maxid * random();
    //console.log(randId);
	
	//let list = await this.model('question').where({id: randId}).limit(quest_count).select();
	if (think.isEmpty(list)) {
	}
	if (think.isEmpty(quest_list) || quest_list == '' || quest_list.length == 0) {
		quest_list = '';
        console.log('quest_list empty');
		for (var i = 0; i < list.length; i++) {
            console.log(list[i].id);
			if (i == 0) {
				quest_list = list[i].id;
			}
			else {
				quest_list = quest_list + '-' + list[i].id;
			}
		}
        console.log(quest_list);
	}
		let quizResult = await this.model('quiz').add({
            title: title,
            creator_id: creator_id,
            creator_name: creator_name,
            creator_photo: creator_photo,
            create_time: create_time,
            start_time: start_time,
			questions: quest_list,
			quest_count: quest_count,
			min_users: min_users,
			price: price,
			level: quiz_level,
			category: quiz_category
        });
	
	return this.success({
      result: 'OK',
	  quiz_id: quizResult,
      errorCode: 0
    });
  }
  
  async updateshareAction() {
    var share_ticket = this.post('share_ticket');
    var open_gid = this.post('gid');
    var qid = this.post('quiz_id');
    console.log(qid);
    console.log(open_gid);

    await this.model('quiz').where({id: qid}).update({
      open_gid: open_gid,
	  share_ticket: share_ticket
    });

    return this.success({
      result: 'OK',
      errorCode: 0
    });
  }
}
