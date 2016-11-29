'use strict';

var viewpath = './system/';
var logManager = require('../../dal/logger');
var log = logManager.getLogger('webService');

var CONFIG = require('../../config/settings');
var userCenter = require('../api/userCenter');
var co = require('co');
var thunkify = require('thunkify');
var redis = require("redis");
var crypto = require('crypto');
var request = require('request');
var client = redis.createClient(CONFIG.redisClient);
var accessRule = require('../../routes/accessRule');
client.set = thunkify(client.set);
client.get = thunkify(client.get);
client.del = thunkify(client.del);

var getPassword = function(passwd) { // java服务端用户密码加密算法，与客户端加密统一（暂时不用，因为已在前端js中执行加密）
	var pas256 = crypto.createHash('sha256').update(passwd, 'utf8').digest('hex');
	var md5 = crypto.createHash('md5').update(passwd).digest('hex').toUpperCase();
	var newPassHash = md5.slice(0, 8) +
		pas256.slice(24, 32) +
		pas256.slice(0, 8) +
		md5.slice(16, 24) +
		md5.slice(8, 16) +
		pas256.slice(8, 16) +
		pas256.slice(16, 24) +
		md5.slice(24, 32);
	newPassHash = crypto.createHash('sha256').update(newPassHash, 'utf8').digest('hex');
	return newPassHash.slice(0, 32);
};

var powerTransformer = function(accessRight) { // 翻译用户权限-getAuthsDo、getAllUsers接口使用
	var re = [];
	for (var appId in accessRule.route.app) {
		var tmpObj = {
			appId: appId,
			appName: accessRule.route.app[appId].name,
			userRight: accessRight[appId] || 0
		}
		re.push(tmpObj);
	}
	return re;
};

module.exports.login = function(req, res, next) { // 登录
	var status = req.params.status || 'login';
	var info = {};
	if (status == 'login') {} else if (status == 0) {
		info = {
			type: 'success',
			message: '注册成功，请您重新登陆'
		};
	} else if (status == 1) {
		info = {
			type: 'success',
			message: '验证邮件已经发出，请你去<a href="http://www.baidu.com">邮箱</a>查看'
		};
	} else if (status == 2) {

	} else if (status == -1) {
		info = {
			type: 'error',
			message: '用户名密码错误！'
		};
	} else if (status == -2) {
		info = {
			type: 'error',
			message: 'Session失效，请重新登录.'
		};
	} else if (status == -3) {
		info = {
			type: 'error',
			message: '请求发起异常.'
		};
	} else if (status == 10001) {
		info = {
			type: 'error',
			message: '用户中心服务器内部错误.'
		};
	} else if (status == 10002) {
		info = {
			type: 'error',
			message: '参数错误.'
		};
	} else if (status == 10103) {
		info = {
			type: 'error',
			message: '密码错误.'
		};
	} else if (status == 10302) {
		info = {
			type: 'error',
			message: '用户不存在.'
		};
	} else if (status == 10401) {
		info = {
			type: 'error',
			message: '用户名密码验证失败.'
		};
	} else if (status == 10403) {
		info = {
			type: 'error',
			message: '连续5次输错密码，账号将冻结30分钟.'
		};
	} else if (status == 10502) {
		info = {
			type: 'error',
			message: '邮箱验证码验证错误.'
		};
	} else if (status == -3) {
		info = {
			type: 'error',
			message: '返回参数解析失败.'
		};
	} else {
		info = {
			type: 'error',
			message: '很抱歉，服务出现异常.'
		};
	}
	info.code = status;
	res.render(viewpath + 'login/index', {
		title: '登录',
		info: info
	});
};

module.exports.registerDo = function(req, res, next) { // 调用注册接口
	// res.redirect('/system/login/2');
	var unionId = req.body.unionId;
	var password = req.body.password;
	var captcha = req.body.captcha;
	request.post({ // 注册用户
		url: userCenter.register.url,
		form: {
			captcha: captcha,
			unionId: unionId,
			password: password
		}
	}, function(err, httpResponse, body) {
		if (err) {
			log.error(JSON.stringify({
				type: 'register.do',
				status: 'failure',
				msg: 'requestError,请求异常',
				unionId: unionId,
				captcha: captcha,
				error: err
			}));
			res.redirect('/system/login/-3');
		} else {
			var result = null;
			try {
				result = JSON.parse(body);
			} catch (e) {
				log.error(JSON.stringify({
					type: 'register.do',
					status: 'failure',
					msg: 'parseBodyError,返回参数解析失败',
					unionId: unionId,
					captcha: captcha,
					parseBody: body,
					error: e
				}));
				log.error(body);
				result = {
					code: 'parseErr',
				}
			}
			if (result.code == 0) {
				log.info(JSON.stringify({
					type: 'register.do',
					status: 'success',
					msg: '注册成功',
					unionId: unionId,
					captcha: captcha,
					uid: result.uid,
					result: result,
					error: false
				}));
				req.session.accessToken = {
					accessToken: result.accessToken,
					name: unionId,
					uid: result.uid
				};
				// MSG.success = true;
			} else {
				// MSG.msg = '其他错误';
				log.error(JSON.stringify({
					type: 'register.do',
					status: 'failure',
					msg: '注册失败',
					unionId: unionId,
					captcha: captcha,
					result: result,
					error: false
				}));
			}
			res.redirect('/system/login/' + result.code);
			// res.jsonp(MSG)
		}
	});
};

module.exports.forgetDo = function(req, res, next) { // 忘记密码接口
	// res.redirect('/system/login/1');
	var unionId = req.body.unionId;
	var password = req.body.password;
	var captcha = req.body.captcha;
	request.post({
		url: userCenter.forget.url,
		form: {
			unionId: unionId,
			password: password,
			captcha: captcha
		}
	}, function(err, httpResponse, body) {
		if (err) {
			log.error(JSON.stringify({
				type: 'forgetDo.do',
				status: 'failure',
				msg: 'requestError,请求异常',
				unionId: unionId,
				captcha: captcha,
				error: err
			}));
			res.redirect('/system/login/-3');
		} else {
			var result = null;
			try {
				result = JSON.parse(body);
			} catch (e) {
				log.error(JSON.stringify({
					type: 'forgetDo.do',
					status: 'failure',
					msg: 'parseBodyError,返回参数解析失败',
					unionId: unionId,
					captcha: captcha,
					parseBody: body,
					error: e
				}));
				log.error(body);
				result = {
					code: 'parseErr',
				}
			}
			if (result.code == 0) {
				log.info(JSON.stringify({
					type: 'forgetDo.do',
					status: 'success',
					msg: '密码重置成功',
					unionId: unionId,
					captcha: captcha,
					uid: result.uid,
					result: result,
					error: false
				}));
				req.session.accessToken = {
					accessToken: result.accessToken,
					name: unionId,
					uid: result.uid
				};
			} else {
				log.error(JSON.stringify({
					type: 'forgetDo.do',
					status: 'failure',
					msg: '密码重置失败',
					unionId: unionId,
					captcha: captcha,
					error: result
				}));
			}
			res.redirect('/system/login/' + result.code);
			// res.jsonp(MSG)
		}
	});
};

module.exports.logoutDo = function(req, res, next) { // 忘记密码接口
	var username = req.session.accessToken.name;
	req.session.destroy(function(err) {
		if (!err) {
			log.info(JSON.stringify({
				type: 'logout.do',
				status: 'success',
				msg: '用户[' + username + ']登出成功',
				error: false
			}));
			res.redirect('/system/login');
		} else {
			log.error(JSON.stringify({
				type: 'logout.do',
				status: 'failure',
				msg: '用户[' + username + ']登出失败',
				error: err
			}));
			res.redirect('/system/login');
		}
	});
};

module.exports.loginDo1 = function(req, res, next) { // 写死用户名密码登录接口

	var username = req.body.username;
	var password = req.body.password;

	// 从用户中心后台获取到真实的userId后，执行session持久化存储
	var userId = username; // 暂时写死为username  记得替换成用户中心的 userID todo
	co(function*() {
		if (username) {
			// if ((username == 'admin' && password == 'admin') || (username == 'chendezhao' && password == 'chendezhao') || (username == 'xiaohu' && password == 'xiaohu') || (username == 'yangyue' && password == 'yangyue') || (username == 'zhaoan' && password == 'zhaoan') || (username == 'zhoujiao' && password == 'zhoujiao')) { // TODO 模拟用户验证完成 登录成功
			var oldSid = yield client.get('userId:' + userId);
			if (oldSid) { // 存在失效用户session，则删除旧记录
				yield client.del(oldSid);
			} else { // 没找到匹配的sessionID
				console.log('没找到匹配的sessionID')
			}
			var setUidResult = yield client.set('userId:' + userId, req.sessionID);
			console.log('设置setUID：' + setUidResult);

			req.session.accessToken = {
				accessToken: (new Date().getTime()),
				name: username,
				uid: userId,
				accessRight: {
					'0': 2
				} // TODO mock
			};
			var gotoUrl = req.session.url ? req.session.url : '/';
			if (gotoUrl == '/favicon.ico') {
				gotoUrl = '/';
			}
			req.session.url = null;

			log.info(JSON.stringify({
				type: 'login.do',
				status: 'success',
				msg: '用户[' + username + ']登录成功',
				error: false
			}));

			res.redirect(gotoUrl);
		} else {

			log.warn(JSON.stringify({
				type: 'login.do',
				status: 'failure',
				msg: '用户[' + username + ']登录失败，用户密码错',
				error: false
			}));

			res.redirect('/system/login/-1');
		}
	});
};

module.exports.loginDo = function(req, res, next) { // 接入用户中心的登录接口

	var username = req.body.username;
	var password = req.body.password;

	// 从用户中心后台获取到真实的userId后，执行session持久化存储
	request.post({
		url: userCenter.login.url,
		form: {
			appId: 1,
			deviceId: 'ZXCZXCAd',
			osType: 0,
			unionId: username,
			password: password
		}
	}, function(err, httpResponse, body) {
		if (err) {
			log.error(JSON.stringify({
				type: 'login.do',
				status: 'failure',
				msg: '登录请求失败',
				error: err
			}));
			res.redirect('/system/login/-1');
		} else {
			var result = null;
			console.log('body=')
			console.log(body)
			try {
				result = JSON.parse(body);
			} catch (e) {
				log.error(JSON.stringify({
					type: 'login.do',
					status: 'failure',
					msg: '返回参数解析失败',
					body: body,
					error: e
				}));
				result = {
					code: -3,
				}
			}
			if (result.code == 0) {
				var userId = result.uid;
				co(function*() { // 用户名、密码验证成功，写入session
					var oldSid = yield client.get('userId:' + userId);
					if (oldSid) { // 存在失效用户session，则删除旧记录
						yield client.del(oldSid);
					} else { // 没找到匹配的sessionID
						console.log('没找到匹配的sessionID');
					}
					var setUidResult = yield client.set('userId:' + userId, req.sessionID);
					console.log('设置setUID：' + setUidResult);

					console.log(result)
					req.session.accessToken = {
						accessToken: (new Date().getTime()),
						name: username,
						uid: userId,
						// accessRight: { '0': 2} // TODO mock
						accessRight: result.authMap // 权限
					};
					var gotoUrl = req.session.url ? req.session.url : '/';
					if (gotoUrl == '/favicon.ico') {
						gotoUrl = '/';
					}
					req.session.url = null;

					log.info(JSON.stringify({
						type: 'login.do',
						status: 'success',
						msg: '用户[' + username + ']登录成功',
						error: false
					}));
					res.redirect(gotoUrl);
				});
			} else {
				log.warn(JSON.stringify({
					type: 'login.do',
					status: 'failure',
					msg: '登录异常',
					code: result.code,
					error: result
				}));
				res.redirect('/system/login/' + result.code);
			}

		}
	});
};

module.exports.sendEmailDo = function(req, res, next) { // 注册用户
	var unionId = req.body.unionId;
	var flag = req.body.flag;
	request.post({
		url: userCenter.sendEmail.url,
		form: {
			unionId: unionId,
			flag: flag
		}
	}, function(err, httpResponse, body) {
		if (err) {
			log.error(JSON.stringify({
				type: 'sendEmail.do',
				status: 'failure',
				msg: 'requestError,请求异常',
				unionId: unionId,
				flag: flag,
				error: err
			}));
			res.jsonp({
				success: false,
				code: 500,
				msg: '请求异常',
				error: err
			});
			return false;
		} else {
			var result = null;
			try {
				result = JSON.parse(body);
			} catch (e) {
				log.error(JSON.stringify({
					type: 'sendEmail.do',
					status: 'failure',
					msg: 'parseBodyError,返回参数解析失败',
					unionId: unionId,
					flag: flag,
					error: e
				}));
				result = {
					code: 'parseErr',
				}
			}
			var MSG = {
				code: result.code,
				success: false
			};
			if (result.code == 0) {
				MSG.success = true;
				log.info(JSON.stringify({
					type: 'sendEmail.do',
					status: 'success',
					msg: '验证码发送成功',
					unionId: unionId,
					flag: flag,
					error: false
				}));
			} else if (result.code == 10001) {
				MSG.msg = '用户中心服务器内部错误';
				log.warn(JSON.stringify({
					type: 'sendEmail.do',
					status: 'success',
					msg: '用户中心服务器内部错误',
					unionId: unionId,
					flag: flag,
					error: false
				}));
			} else if (result.code == 10002) {
				MSG.msg = '参数错误';
				log.warn(JSON.stringify({
					type: 'sendEmail.do',
					status: 'success',
					msg: '参数错误',
					unionId: unionId,
					flag: flag,
					error: false
				}));
			} else if (result.code == 10101) {
				MSG.msg = '该账号已经注册过了，请您直接登录';
			} else if (result.code == 'parseErr') {
				MSG.msg = '返回参数解析失败';
			} else {
				MSG.msg = '验证码发送失败,请您联系管理员后重试';
				log.warn(JSON.stringify({
					type: 'sendEmail.do',
					status: 'success',
					msg: '错误编码' + result.code,
					unionId: unionId,
					flag: flag,
					error: false
				}));
			}
			res.jsonp(MSG);
			return false;
		}
	});
};

// 权限管理
module.exports.powerManager = function(req, res, next) {
	res.render(viewpath + 'admin/powerManager', {
		userName: req.session.accessToken.name,
		access: req.session.accessToken,
		title: '权限管理',
		project: 'system/admin',
		path: 'system/admin/powerManager',
		pageBar: ['权限管理']
	});
};

module.exports.errorPage = function(req, res, next) { // 错误页
	var status = req.params.status || 'login';
	var info = {
		code: 666,
		message: '系统检测到您主动访问了错误的页面，将在三十秒后爆炸！',
		title: '警报'
	};
	if (status == 403) {
		info = {
			message: '很抱歉，您的权限不足，无法访问！',
			code: 403,
			title: '欢迎来到月球,但是...'
		}
	} else if (status == 404) {
		info = {
			message: '抱歉，您所访问的页面不存在！',
			code: 404,
			title: '雾霾太大，什么都找不到'
		}
	} else if (status == 500) {
		info = {
			message: '抱歉，服务器后台异常，疑似被外星人入侵！',
			code: 500,
			title: '快通知消防队员'
		}
	}
	res.render(viewpath + 'error/index', {
		title: '出错啦',
		info: info
	});
};

module.exports.getAuthsDo = function(req, res, next) { // 获取用户中心-用户权限接口
	var unionId = req.body.unionId;
	request.post({
		url: userCenter.getAuths.url,
		form: {
			unionId: unionId
		}
	}, function(err, httpResponse, body) {
		console.log(body)
		if (err) {
			log.error(JSON.stringify({
				type: 'getAuthsDo.do',
				status: 'failure',
				msg: 'requestError,请求异常',
				unionId: unionId,
				error: err
			}));
			res.jsonp({
				info: {},
				success: false,
				code: '-1',
				msg: '接口调用失败',
				error: err
			})
		} else {
			var result = null;
			try {
				result = JSON.parse(body);
			} catch (e) {
				log.error(JSON.stringify({
					type: 'getAuthsDo.do',
					status: 'failure',
					msg: 'parseBodyError,返回参数解析失败',
					unionId: unionId,
					parseBody: body,
					error: e
				}));
				log.error(body);
				result = {
					code: 'parseErr',
				}
			}
			if (result.code == 0) {
				log.debug(JSON.stringify({
					type: 'getAuthsDo.do',
					status: 'success',
					msg: '获取用户权限成功',
					unionId: unionId,
					result: result,
					error: false
				}));
				res.jsonp({
					infos: powerTransformer(result.authMap),
					uid: result.uid,
					unionId: unionId,
					success: true,
					code: '200',
					msg: '接口调用成功',
					error: false
				})
			} else {
				log.error(JSON.stringify({
					type: 'getAuthsDo.do',
					status: 'failure',
					msg: '获取用户权限失败',
					unionId: unionId,
					error: result
				}));
				res.jsonp({
					info: {},
					uid: false,
					unionId: unionId,
					success: false,
					code: '-2',
					msg: '接口调用失败',
					error: result
				});
			}
		}
	});
};

module.exports.addAuthDo = function(req, res, next) { // 用户中心-增加、修改用户权限接口
	var auths = req.body.rules; // 权限JSON字符串{'1':'2'}
	var muid = req.body.muid; // 当前用户的userID
	var password = req.body.password; // 当前用户的密码
	var unionId = req.body.unionId; // 被操作用户的邮箱前缀

	request.post({
		url: userCenter.addAuth.url,
		form: {
			unionId: unionId,
			password: password,
			auths: auths,
			muid: muid
		}
	}, function(err, httpResponse, body) {
		if (err) {
			log.error(JSON.stringify({
				type: 'addAuthDo',
				status: 'failure',
				msg: 'requestError,请求异常',
				unionId: unionId,
				error: err
			}));
			res.jsonp({
				info: {},
				success: false,
				code: '-1',
				msg: '接口调用失败',
				error: err
			});
		} else {
			var result = null;
			try {
				result = JSON.parse(body);
			} catch (e) {
				log.error(JSON.stringify({
					type: 'addAuthDo',
					status: 'failure',
					msg: 'parseBodyError,返回参数解析失败',
					unionId: unionId,
					parseBody: body,
					error: e
				}));
				log.error(body);
				result = {
					code: 'parseErr',
				}
			}
			if (result.code == 0) {
				log.info(JSON.stringify({
					type: 'addAuthDo',
					status: 'success',
					msg: '密码重置成功',
					unionId: unionId,
					uid: result.uid,
					result: result,
					error: false
				}));
				res.jsonp({
					info: {},
					unionId: unionId,
					success: true,
					code: '200',
					msg: '接口调用成功',
					error: err
				})
			} else {
				log.error(JSON.stringify({
					type: 'addAuthDo',
					status: 'failure',
					msg: '接口调用失败',
					unionId: unionId,
					error: result
				}));
				res.jsonp({
					info: {},
					success: false,
					code: '-1',
					unionId: unionId,
					msg: '接口调用失败',
					error: result
				})
			}
		}
	});
};

module.exports.getAllUsers = function(req, res, next) { // 用户中心-获取用户权限接口
	request.post({
		url: userCenter.getAllAuths.url,
		form: {}
	}, function(err, httpResponse, body) {
		if (err) {
			log.error(JSON.stringify({
				type: 'addAuthDo',
				status: 'failure',
				msg: 'requestError,请求异常',
				unionId: unionId,
				error: err
			}));
			return res.json({
				data: [],
				success: false,
				code: -1,
				msg: '接口调用失败',
				error: null
			});
		} else {
			var result = {
				code: 0,
				success: true,
				msg: '接口返回成功',
			};
			try {
				result.data = JSON.parse(body);
			} catch (e) {
				result.data = [];
				result.success = false;
				result.msg = '接口返回异常';
			}
			if (result.data.length) {
				for (var i = 0; i < result.data.length; i++) {
					result.data[i].authMap = powerTransformer(result.data[i].authMap);
				}
			}
			return res.json(result);
		}
	});
}



//