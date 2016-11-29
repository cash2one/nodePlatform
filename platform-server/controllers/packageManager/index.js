'use strict';

var viewpath = './packageManager/';
// var request = require('request');
var mysql = require('../../dal/mysql');
var co = require('co');
var logManager = require('../../dal/logger');
var log = logManager.getLogger('packageService');

module.exports.appDetail = function(req, res, next) { //
	var appId = req.query.appid || null;
	var appBaseSqlParams = ['platform_app_base_info', 'id', appId]
	var appBaseTmpSql = 'select * from ?? where ?? = ?';
	var appBaseSql = mysql.getSql(appBaseTmpSql, appBaseSqlParams);
	var appFileSqlParams = ['platform_app_file_info', 'app_id', appId]
	var appFileTmpSql = 'SELECT * FROM ?? where ?? = ? order by gmt_modify_time desc limit 0,40';
	var appFileSql = mysql.getSql(appFileTmpSql, appFileSqlParams);
	var results = {};
	co(function*() {
		var ret = {};
		try {
			results.appBaseInfo = yield mysql.operateDB(appBaseSql, []);
			results.appFileInfo = yield mysql.operateDB(appFileSql, []);
			results.appBaseInfo = results.appBaseInfo[0];
			results.appFileInfo = results.appFileInfo;
			res.render(viewpath + 'appDetail/index', {
				userName: req.session.accessToken.name,
				title: '包上传',
        		access: req.session.accessToken,
				pageBar: ['包管理', '项目详情'],
				project: 'packageManager',
				path: 'packageManager/appDetail',
				data: results
			});
		} catch (eee) {
			log.error(JSON.stringify({
				type: 'appDetail',
				status: 'failure',
				msg: '获取APP详情失败',
				appId: appId,
				appBaseSql: appBaseSql,
				appFileSql: appFileSql,
				// username: username,
				// uid: uid,
				error: eee
			}));
		}
	});
};

module.exports.myapp = function(req, res, next) { // 
	res.render(viewpath + 'myapp/index', {
		userName: req.session.accessToken.name,
        access: req.session.accessToken,
		title: '包项目管理',
		project: 'packageManager',
		pageBar: ['包管理', '项目管理'],
		path: 'packageManager/myapp'
	});
};

module.exports.getMyApps = function(req, res, next) {
	var start = Number(req.query.start) || 0;
	var count = Number(req.query.count) || 15;

	var sqlParams = ['platform_app_base_info', 'gmt_create_time', start, count]

	var tmpSql = 'select * from ?? order by ?? desc limit ?,?';

	var sql = mysql.getSql(tmpSql, sqlParams);

	var results = null;
	co(function*() {
		var ret = {};
		try {
			var results = yield mysql.operateDB(sql, []);
			log.debug(JSON.stringify({
				type: 'getMyApps',
				status: 'success',
				msg: '获取APP信息完成',
				// username: username,
				// uid: uid,
				start: start,
				count: count,
				error: false
			}));
			res.jsonp({
				success: true,
				data: results
			});
		} catch (eee) {
			log.error(JSON.stringify({
				type: 'getMyApps',
				status: 'failure',
				msg: '获取APP信息完成',
				// username: username,
				// uid: uid,
				start: start,
				count: count,
				error: eee
			}));
			res.jsonp({
				success: false,
				error: eee,
				code: eee.errno,
				start: start,
				count: count,
				data: null
			})
		}
	});
}

/*数据库操作*/
module.exports.createNewApp = function(req, res, next) { // 创建新工程
	var username = req.session.accessToken.name;
	var uid = req.session.accessToken.uid;
	var appProjectName = req.query.appProjectName;
	var appName = req.query.appName;
	var appOSType = req.query.appOSType;
	var appDesc = req.query.appDesc || '';
	var insertKey = ['app_name', 'app_project_name', 'app_desc', 'app_os_type', 'gmt_modify_time', 'gmt_create_time'];
	var insertParams = [appName, appProjectName, appDesc, appOSType, new Date(), new Date()];
	var sql = 'insert into platform_app_base_info (' + insertKey.toString() + ') values (?,?,?,?,?,?)';
	var tmspSql = mysql.getSql(sql, insertParams);
	co(function*() {
		var ret = {};
		try {
			var results = yield mysql.operateDB(tmspSql, []);
			log.info(JSON.stringify({
				type: 'createNewApp',
				status: 'success',
				msg: '创建新应用成功',
				username: username,
				uid: uid,
				appProjectName: appProjectName,
				appName: appName,
				insertId: results.insertId,
				error: false
			}));
			res.jsonp({
				success: true,
				code: '200',
				msg: '创建成功'
			});
		} catch (eee) {
			log.error(JSON.stringify({
				type: 'createNewApp',
				status: 'failure',
				msg: '创建新应用失败',
				username: username,
				uid: uid,
				appProjectName: appProjectName,
				appName: appName,
				error: false
			}));
			res.jsonp({
				success: false,
				code: eee.errno,
				error: eee
			});
		}
	});
};

module.exports.applog = function(req, res, next) { // 
	res.render(viewpath + 'applog/index', {
		userName: req.session.accessToken.name,
        access: req.session.accessToken,
		title: '包日志查询',
		project: 'packageManager',
		pageBar: ['包管理', '包日志查询'],
		path: 'packageManager/applog'
	});
};