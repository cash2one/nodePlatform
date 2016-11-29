var logManager = require('../../dal/logger');
var log = logManager.getLogger('webService');
var api = require('./apiMaps.js');
var request = require('request');

/*
 * 为了不暴露一些重要外部api，需要在nodejs内部对这些api重新进行封装及转发。
 * 可以在route路由中，将被nodejs重新封装后的接口的handler指向apiHandler函数，由apiHandler对其进行转发，并返回结果。
 * 由apiMaps.js存储内部封装的api与真实api之间的映射关系。
 */
module.exports.getApiHandler = function(req, res, next) {
	request.get({
		url: api[req.path],
		qs: req.query
	}, function(err, httpResponse, body) {
		if (err) {
			log.error(JSON.stringify({
				type: 'indexGetStatus',
				status: 'failure',
				msg: 'requestError,请求异常',
				error: JSON.stringify(err)
			}));
			return res.json({
				'code': -1,
				'msg': '请求失败',
				'debugMsg': 'requestError,请求异常',
				'data': {},
				'error': err
			});
		} else {
			return res.send(body);
		}
	});
};

module.exports.postApiHandler = function(req, res, next) {
	// post API没有进行测试
	request.post({
		url: api[req.path],
		qs: req.query,
		form: req.body
	}, function(err, httpResponse, body) {
		if (err) {
			log.error(JSON.stringify({
				type: 'indexGetStatus',
				status: 'failure',
				msg: 'requestError,请求异常',
				error: JSON.stringify(err)
			}));
			return res.json({
				'code': -1,
				'msg': '请求失败',
				'debugMsg': 'requestError,请求异常',
				'data': {},
				'error': err
			});
		} else {
			return res.send(body);
		}
	});
};