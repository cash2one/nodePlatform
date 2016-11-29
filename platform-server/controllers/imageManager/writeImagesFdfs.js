'use strict';

var path = require('path');
var fs = require('fs');
var fdfs = require('../../dal/fdfs-pool');
var co = require('co');
var mysql = require('../../dal/mysql');

var SETTINGS = require('../../config/settings');

var logManager = require('../../dal/logger');
var log = logManager.getLogger('imageService');
var mkdirp = require('mkdirp');

Date.prototype.Format = function(fmt) { //author: meizz   
	var o = {
		"M+": this.getMonth() + 1, //月份   
		"d+": this.getDate(), //日   
		"h+": this.getHours(), //小时   
		"m+": this.getMinutes(), //分   
		"s+": this.getSeconds(), //秒   
		"q+": Math.floor((this.getMonth() + 3) / 3), //季度   
		"S": this.getMilliseconds() //毫秒   
	};
	if (/(y+)/.test(fmt))
		fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
	for (var k in o)
		if (new RegExp("(" + k + ")").test(fmt))
			fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
	return fmt;
};

function createDir(writePath) {
	var exists = fs.existsSync(writePath);
	if (!exists) {
		mkdirp.sync(writePath);
		// fs.mkdirSync(writePath);
	}
}

module.exports.uploadimgsfdfs = function(req, res, next) { // 一级目录
	var uploaderNick = req.session.accessToken.name; // 上传者昵称
	var uploaderId = req.session.accessToken.uid; // 上传者id
	for (var name in req.body) {
		var base64Data = name.replace(/^data:image\/\w+;base64,/, "");
		base64Data = base64Data.replace(/\s/g, '+')
		var dataBuffer = new Buffer(base64Data, 'base64');
		var fileVolume = dataBuffer.length; // 图片大小
		var originName = req.headers.x_filename || req.headers['x-tvs-filename']; // 原文件名
		var fileUrl = ''; // 源站访问地址
		var cdnUrl = ''; // CDN访问地址
		var fileId = null; // fdfs文件id
		var sql = '';

		co(function*() {
			return yield fdfs.upload(dataBuffer, {
				ext: originName.split('.').slice(-1)[0] // 文件后缀名
			});
		}).then(function(filePath) {
			fileId = filePath;
			cdnUrl = SETTINGS.fdfs.cdnHost + '/' + filePath;
			fileUrl = SETTINGS.fdfs.host + '/' + filePath;
			var insertKey = ['origin_name', 'uploader_nick', 'uploader_id', 'file_path', 'file_url', 'cdn_url', 'file_volume', 'gmt_modify_time', 'gmt_create_time']
			var insertParams = ['platform_img_file_info', originName, uploaderNick, uploaderId, filePath, fileUrl, cdnUrl, fileVolume, new Date(), new Date()];
			var tmspSql = 'insert into ?? (' + insertKey.toString() + ') values (?,?,?,?,?,?,?,?,?)';
			sql = mysql.getSql(tmspSql, insertParams);
			return mysql.operateSql(sql);
		}).then(function(data) {
			log.debug(JSON.stringify({
				type: 'uploadimgsfdfs',
				status: 'success',
				uploaderNick: uploaderNick,
				uploaderId: uploaderId,
				msg: '文件上传fdfs及写入DB成功',
				fileUrl: fileUrl,
				fileId: fileId,
				sql: sql,
				error: false
			}));
			return res.json({
				success: true,
				code: '200',
				msg: '创建成功',
				src: fileUrl, // 线上静态资源地址
				platformSrc: fileUrl // 平台图片url
			});
		}).catch(function(err) {
			log.error(JSON.stringify({
				type: 'uploadimgsfdfs',
				status: 'failure',
				uploaderNick: uploaderNick,
				uploaderId: uploaderId,
				msg: '文件上传fdfs及写入DB失败',
				fileUrl: fileUrl,
				fileId: fileId,
				sql: sql,
				error: err
			}));
			if (fileId) {
				fdfs.del(fileId).then(function(data) {
					log.info(JSON.stringify({
						type: 'uploadimgsfdfs',
						status: 'failure',
						uploaderNick: uploaderNick,
						uploaderId: uploaderId,
						msg: '文件上传fdfs及写入DB失败,删除fdfs文件成功',
						fileUrl: fileUrl,
						fileId: fileId,
						error: false
					}));
				}).catch(function(e) {
					log.error(JSON.stringify({
						type: 'uploadimgsfdfs',
						status: 'failure',
						uploaderNick: uploaderNick,
						uploaderId: uploaderId,
						msg: '文件上传fdfs及写入DB失败,删除fdfs文件失败',
						fileUrl: fileUrl,
						fileId: fileId,
						error: e
					}));
				});
			}
			return res.json({
				success: false,
				code: 'UNKNOWN',
				msg: '存储过程出现错误，请联系管理员',
				error: err
			});
		});;

	}
};

module.exports.getMyImage = function(req, res, next) {
	var uploaderNick = req.session.accessToken.name; // 上传者昵称
	var uid = req.session.accessToken.uid;
	var sql = '';
	var page = Number(req.body.page) || 0;
	var count = Number(req.body.count) || 30;
	var start = page * count;
	co(function*() {
		var insertParams = ['platform_img_file_info', 'uploader_id', uid, 'gmt_modify_time'];
		var tmspSql = 'select * from ?? where ?? = ? order by ?? desc limit ' + start + ',' + count;
		sql = mysql.getSql(tmspSql, insertParams);
		return mysql.operateSql(sql);
	}).then(function(result) {
		log.debug(JSON.stringify({
			type: 'getMyImage',
			status: 'success',
			uploaderNick: uploaderNick,
			uid: uid,
			msg: '查询成功',
			sql: sql,
			// result: result,
			error: false
		}));
		return res.jsonp({
			files: result
		});
	}).catch(function(err) {
		log.error(JSON.stringify({
			type: 'getMyImage',
			status: 'failure',
			uploaderNick: uploaderNick,
			uid: uid,
			msg: '查询失败',
			sql: sql,
			error: err
		}));
		return res.jsonp({
			files: []
		});
	});
};