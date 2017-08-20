'use strict';
/**
 * model
 */
export default class extends think.model.base {

  /**
   * 获取News的Video List
   * @param newsId
   * @returns {Promise.<*>}
   */
  async getVideoList(newsId){
    return await this.model('video').where({news_id: newsId}).select();
  }

  /**
   * 获取News的Detail
   * @param news
   * @returns {Promise.<*>}
   */
  async getNewsDetail(news){
    let videos = await this.model('video').where({news_id: news.id}).order({'create_time': 'asc'}).select();
	for (let i = 0; i < videos.length; i++) {
		let user = await this.model('user').where({id: videos[i].creator}).select();
		if (!think.isEmpty(user)) {
		    videos[i].creator_name = user[0].name;
		    videos[i].creator_photo = user[0].photo_url;
		}
		//videos[i].create_time = think.datetime(new Date(videos[i].create_time * 1000));
		videos[i].create_time = this.formatDateTime(videos[i].create_time);
		let comments = await this.model('comment').where({video_id: videos[i].id}).select();
		videos[i].comments = comments;
		videos[i].comment = comments.length;
	}
	if (videos.length > 1) {
		news.updateDescrip = videos[0].creator_name + '于' + (videos[videos.length - 1].create_time) + '更新了进展';
	}
	else if (videos.length > 0) {
		news.updateDescrip = videos[0].creator_name + '于' + (videos[0].create_time) + '最先发布';
	}
	news.video_list = videos;

	let users = await this.model('video').where({news_id: news.id}).getField('creator', 10);
	news.creatorDescrip = '';
	if (!think.isEmpty(users)) {
		let creatorList = await this.model('user').where({'id': {'in': users}}).select();
		news.creator_list = creatorList;
		if (creatorList.length > 1) {
			news.creatorDescrip = creatorList[0].name + '等' + creatorList.length + '人共同拍摄';
		}
	}
		
	news.showVideo = false;
	news.curIndex = 0;
	return news;
  }
}