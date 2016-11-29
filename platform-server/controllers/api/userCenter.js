/*
 * 使用userCenter.js进行用户中心api的映射，是为了便于日后将userCenter服务进行切割，便于分离。
 */
var getSettings = function() {
	if (process.env.NODE_ENV == 'dev') {
		return 'http://localhost:3000/api/userCenter/';
	} else if (process.env.NODE_ENV == 'daily') {
		return 'http://localhost:3000/api/userCenter/';
	} else if (process.env.NODE_ENV == 'production') {
		return 'http://host/api/userCenter/';
	} else {
		return 'http://localhost:3000/api/userCenter/';
	}
}
var host = getSettings();
var userCenter = {
	sendEmail: {
		/*
		 * 发送验证码
		 * @flag : 1为新用户注册，2为老用户忘记密码
		 * @unionId : 用户名 
		 * @return ResultVO
		 */
		url: host + 'sendEmail.do',
	},
	forget: {
		/**
		 * 忘记密码 & 重置密码
		 *
		 * @param captcha  邮箱验证码
		 * @param unionId  用户名
		 * @param password 新密码
		 * @return LoginVO
		 */
		url: host + 'forget.do',
	},
	login: {
		/**
		 * 用户登录
		 *
		 * @param appId    appId
		 * @param password 密码
		 * @param unionId  用户名
		 * @param osType   os type
		 * @return LoginVO
		 */
		url: host + 'login.do',
	},
	logout: {
		url: host + 'logout.do',
	},
	register: {
		/*
		 * 用户注册
		 * @param captcha  邮箱验证码
		 * @unionId : 用户名 
		 * @param password 密码
		 * @return ResultVO
		 */
		url: host + 'register.do',
	},
	addAuth: {
		/*
		 * 新增、修改用户权限
		 * @param rules  权限JSON字符串{'1':'2'}
		 * @param muid   当前用户的userID
		 * @param password 当前用户的密码
		 * @param unionId   被操作用户的邮箱前缀
		 * @return ResultVO
		 */
		url: host + 'addAuth.do',
	},
	getAllAuths: {
		/*
		 * 获取全部用户权限信息
		 * @return ResultVO  权限Array []
		 */
		url: host + 'getAllAuths.do',
	},
	getAuths: {
		/*
		 * 获取指定用户权限信息
		 * @param unionId   被操作用户的邮箱前缀
		 * @return ResultVO  权限JSON字符串 {'1':'2'}
		 */
		url: host + 'getAuths.do',
	}
};
module.exports = userCenter;