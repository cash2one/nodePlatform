/*module.exports.registerDo = function(req, res, next) { // 调用注册接口
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

*/



module.exports.sendEmailDo = function(req, res, next) { 
}

module.exports.forgetDo = function(req, res, next) { 
}

module.exports.loginDo = function(req, res, next) { 
}

module.exports.logoutDo = function(req, res, next) { 
}

module.exports.registerDo = function(req, res, next) { 
}

module.exports.addAuthDo = function(req, res, next) { 
}

module.exports.getAllAuthsDo = function(req, res, next) { 
}

module.exports.getAuthsDo = function(req, res, next) { 
}
