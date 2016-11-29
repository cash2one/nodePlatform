//服务器相关配置

var express = require('express'),
	path = require('path'),
	bodyParser = require("body-parser"),
	$ = require('underscore'),
	logger = require('morgan'); //后台log模块

var favicon = require('serve-favicon');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var logManager = require('../dal/logger');
var log = logManager.getLogger('systemService');

var lessMiddleware = require('less-middleware');

var access = require('../routes/access');

var CONFIG = require('./settings');
var OPTIONS = {
	targetDir: function(app) {
		return path.join(__dirname, '../sources');
	},
	read: {
		name: '<<图片服务器(读取)>>',
		port: 80,
		'default': 'default.png',
		// fixSizeReg: /(\w+\.*)-(\d+)\.[a-zA-Z]+$/, // resize参数正则表达式
		fixSizeReg: /(\w+\.*)(-\d*)(q\d+)*\.[a-zA-Z]+$/, // resize参数正则表达式
		sizeRegx: /(\w+)-(\d+)x(\d+)\.(\w+)$/, // 匹配形如http://host/1/timg-60x60.jpeg 的文件
		// sizeReg: /(\w+\.*)\.(\w+)-(\d+)\.(\w+)$/ // 匹配形如http://host/1/timg.jpeg-60.jpeg 的文件
		sizeReg: /(\w+\.*)\.(\w+)-(\d*)(q\d+)*\.(\w+)$/ // 匹配形如http://host/1/timg.jpeg-60q90.jpeg 的文件
	},
	save: {
		name: '<<图片服务器(保存)>>',
		port: 9990
	},
	mode: 'read',
	contentType: {
		// 图片
		'jpg': 'image/jpeg',
		'jpeg': 'image/jpeg',
		'gif': 'image/gif',
		'png': 'image/png',
		'bmp': 'image/bmp',
		// 安装包
		'apk': 'application/vnd.android.package-archive',
		// 'ipa': 'application/iphone',
		// 'plist': 'application/xml',
		'ipa': 'application/octet-stream',
		'plist': 'text/xml'
			// 视频
			/*'avi': 'video/x-msvideo',
			'asf': 'video/x-ms-asf',
			'mp2': 'audio/x-mpeg',
			'mp3': 'audio/x-mpeg',
			'mp4': 'video/mp4',
			'3gp': 'video/3gpp',
			'm3u':'audio/x-mpegurl',
			'm4a':'audio/mp4a-latm',
			'm4b':'audio/mp4a-latm',
			'm4p':'audio/mp4a-latm',
			'm4u':'video/vnd.mpegurl',
			'm4v':'video/x-m4v',
			'mov':'video/quicktime',
			'mpe':'video/mpeg',
			'mpeg':'video/mpeg',
			'mpg':'video/mpeg',
			'mpg4':'video/mp4',
			'mpga':'audio/mpeg',
			'rmvb': 'audio/x-pn-realaudio',
			'wav':'audio/x-wav',
			'wma':'audio/x-ms-wma',
			'wmv':'audio/x-ms-wmv',
			'ogg':'audio/ogg',
			// 文档
			'ppt':'application/vnd.ms-powerpoint',
			'pps':'application/vnd.ms-powerpoint',
			'wps':'application/vnd.ms-works',
			'doc': 'application/msword',
			'txt': 'text/plain',
			'pdf': 'application/pdf',
			// 压缩包
			'rar':'application/x-rar-compressed',
			'tar': 'application/x-tar',
			'tgz': 'application/x-compressed',
			'zip': 'application/zip'
			'gtar':'application/x-gtar',
			'gz':'application/x-gzip',*/
	}
};

var RedisStore = require('connect-redis')(session);

var isDev = (process.env.NODE_ENV == 'dev');

module.exports = function(app, rootPath) {

	app.set('case sensitive routing', true); //大小写敏感的路由模式

	app.set('view engine', 'ejs'); //模板引擎

	app.set('view cache', false); //模板缓存

	$.each(OPTIONS, function(v, k) {
		app.set(k, typeof v === 'function' ? v(app) : v);
	});

	app.use(favicon(path.join(rootPath, 'favicon.ico')));

	// app.use(lessMiddleware(path.join(__dirname, '../public'))); // 使用less

	/*app.use(bodyParser.json({
		limit: '15mb'
	}));
	app.use(bodyParser.urlencoded({
		limit: '15mb',
		extended: false
	}));*/

	app.use(bodyParser.json({
		limit: '60mb'
	}));
	app.use(bodyParser.urlencoded({
		limit: '60mb',
		extended: true,
		parameterLimit: 50000
	}));


	app.use(cookieParser()); // 应用cookie及session

	app.use(logger('dev')); //后台log模块,参数有:combined\dev等。若想记录全部请求，应把它放在第一行位置。

	// app.use(express.static(path.join(rootPath, 'public'))); //设置静态文件默认路径

	/*
	 * redis持久化session,支持自动重连，但不支持手动重连接，不确定自动重连的稳定性，需保留
	 */
	/*
		app.use(session({
			name: 'sid',
			secret: 'Asecret123-',
			resave: true,
			rolling: true,
			saveUninitialized: false,
			cookie: CONFIG.session.cookie,
			store: new RedisStore(CONFIG.session.redisStore)
		}));

		app.use(function(req, res, next) {
			if (!req.session) {
				log.error('config.js检测到Redis失联！！！！');
				log.error('How do I handle lost connections to Redis?By default, the node_redis client will auto-reconnect when a connection is lost. But requests may come in during that time. In express, one way this scenario can be handled is including a "session check" after setting up a session (checking for the existence of req.session):');
				return next(new Error('由于您的网络不稳定，导致redis连接断开，请尝试刷新当前页面。')) // handle error 
			}
			next(); // otherwise continue 
		});
	*/

	/*
	 * redis持久化session，服务端session丢失后，并尝试三次重连接，github上给出的手动查找session的解决方案。稳定性有待测试
	 */
	var sessionMiddleware = session({
		name: 'sid',
		secret: 'Asecret123-',
		resave: true,
		rolling: true,
		saveUninitialized: false,
		cookie: CONFIG.session.cookie,
		store: new RedisStore(CONFIG.session.redisStore)
	});
	app.use(function(req, res, next) {
		var tries = 3

		function lookupSession(error) {
			if (error) {
				return next(error)
			}
			tries -= 1
			if (req.session !== undefined) {
				return next()
			}
			if (tries < 0) {
				log.error('config.js检测到Redis失联！！！！');
				log.error('How do I handle lost connections to Redis?By default, the node_redis client will auto-reconnect when a connection is lost. But requests may come in during that time. In express, one way this scenario can be handled is including a "session check" after setting up a session (checking for the existence of req.session):');
				log.warn('可以参考https://github.com/expressjs/session/issues/99#issuecomment-63853989，如何解决');
				return next(new Error('由于您的网络不稳定，导致redis连接断开，请尝试刷新当前页面。'));
			}
			sessionMiddleware(req, res, lookupSession);
		}
		lookupSession();
	});

	app.use(function(req, res, next) {
		access(req, res, next);
	});


	/*
	 * 使用服务器内存对session进行存储，需要保留，当redis服务器不可用时，需要切换至此方式。
	 */
	/* // 本地内存保存session，需要保留！
		app.use(session({
			resave: true, // don't save session if unmodified
			saveUninitialized: false, // don't create session until something stored
			secret: 'love',
			cookie: {
				maxAge: 21600000 // 过期时间 ms
			}
		}));

		app.use(function(req, res, next) { // 请求时，应用身份验证
			if (!req.session.accessToken) {
				if (req.url.slice(0, 13) == "/system/login" || req.url == "/system/register.do" || req.url == "/system/forget.do" || req.url == '/system/login.do') {
					next(); //如果请求的地址是登录则通过，进行下一个请求
				} else {
					if (req.method == 'POST') {
						if (req.url == '/sendEmail' || req.url == '/doRegist' || req.url == '/forget') {
							next();
						} else {
							res.json({
								success: false,
								msg: 'session失效，请重新登录',
								code: '403'
							});
							next();
						}
					} else {
						res.redirect('/system/login/-2');
					}
				}
			} else {
				next();
			}
			// next();
		});
	*/


	/*
	 * Webpack集成开发环境 及 线上环境
	 */
	if (isDev) {
		// webpack start
		console.log('dev环境！！！！')
		var webpack = require('webpack'),
			webpackDevMiddleware = require('webpack-dev-middleware'),
			webpackHotMiddleware = require('webpack-hot-middleware'),
			webpackDevConfig = require('../webpack.dev.config.js');

		var compiler = webpack(webpackDevConfig);

		app.use(webpackDevMiddleware(compiler, {
			publicPath: webpackDevConfig.output.publicPath,
			noInfo: true,
			stats: {
				colors: true
			}
		}));
		app.use(webpackHotMiddleware(compiler));

		// webpack end
	} else {
		console.log('正式环境！！！！')
		// app.use(lessMiddleware(path.join(__dirname, '../public'))); // 使用less
	}
		app.use(lessMiddleware(path.join(__dirname, '../public'))); // 使用less


	require('../routes')(app); //加入路由
	app.use(express.static(path.join(rootPath, 'public'))); //设置静态文件默认路径



};