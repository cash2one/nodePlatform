var getSettings = function() {
	if (process.env.NODE_ENV == 'dev') {
		return 'http://daily.host.com';
	} else if (process.env.NODE_ENV == 'daily') {
		return 'http://daily.host.com';
	} else if (process.env.NODE_ENV == 'production') {
		return 'http://online.host.com';
	} else {
		return 'http://daily.host.com';
	}
}
var host = getSettings();

module.exports = {
	/*
	 * key(内部经过包装的 api Url): value(真实服务端保存地址) 
	 */
	'/api/projectName/pageName/apiName.do': host + '/projectName/pageName/apiName', // 接口注释
};