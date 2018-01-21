'use strict';

import Base from './base.js';

export default class extends Base {

  /**
   * index action
   * @return {Promise} []
   */
  async indexAction() {
    let quest_id = this.get('question_id');
    let list = await this.model('question').where({id: quest_id}).find();
	if (!think.isEmpty(list)) {
        console.log(list);
	}

    return this.success({
      questList: list
    });

  }

  async addAction() {
    let title = this.post('title');
    let create_time = this.post('create_time');
    let creator_id = this.post('creator_id');
    let creator_account = this.post('creator_account');
    let creator_level = this.post('creator_level');
    let quest_content = this.post('quest_content');
    let quest_item_a = this.post('quest_item_a');
    let quest_item_b = this.post('quest_item_b');
    let quest_item_c = this.post('quest_item_c');
    let quest_item_d = this.post('quest_item_d');
    let quest_item_d = this.post('quest_item_d');
    let item_count = this.post('item_count');
    let quest_answer = this.post('quest_answer');
    let note = this.post('note');
    console.log('addAction');
    console.log(quest_content);
	
		let questList = '';
		for (var i = 0; i < list.length; i++) {
            console.log(list[i].id);
			if (i == 0) {
				questList = list[i].id;
			}
			else {
				questList = questList + '-' + list[i].id;
			}
		}
		let questResult = await this.model('question').add({
            title: title,
            create_time: create_time,
            start_time: start_time,
			content: quest_content,
			item_count: item_count,
			item0: quest_item_a,
			item1: quest_item_b,
			item2: quest_item_c,
			item3: quest_item_d,
			answer: quest_answer,
			note: note
        });
	
	return this.success({
      result: 'OK',
	  question_id: questResult,
      errorCode: 0
    });
  }
}