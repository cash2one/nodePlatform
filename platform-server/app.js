var express = require('express'),
	https = require('https'),
	http = require('http'),
	path = require('path'),
	fs = require('fs'),
	logManager = require('./dal/logger'),
	log = logManager.getLogger('systemService'),
	app = express();
process.app = app; //方便在其他地方使用app获取配置
require('./config/config')(app, __dirname); //引入自定义配置文件
//错误处理
app.use(function(err, req, res, next) {
	res.status(err.status || 500);
	res.render('error', {
		message: err.message,
		error: {}
	});
	log.error('ERROR:happened--------');
	log.error(err);
	log.error(err.stack);
});

var PORT = 3000;
var httpServer = http.createServer(app);
httpServer.listen(PORT, function() {
	log.info('HTTP服务已启动: http://localhost:%s', PORT);
});

/*
 * 开启https协议，需要提供证书支持
 */
/*
	var privateKey, certificate;
	if (process.env.NODE_ENV == 'production') {
		privateKey = fs.readFileSync('platform.host.com.pem', 'utf8'); // 线上证书
		certificate = fs.readFileSync('platform.host.com.crt', 'utf8');
	} else {
		privateKey = fs.readFileSync('platformdev.host.com.pem', 'utf8'); // 日常证书
		certificate = fs.readFileSync('platformdev.host.com.crt', 'utf8');
	}
	var credentials = {
		key: privateKey,
		cert: certificate
	};
	var SSLPORT = 3001;
	var httpsServer = https.createServer(credentials, app);
	httpsServer.listen(SSLPORT, function() {
		log.info('HTTPS服务已启动: https://localhost:%s', SSLPORT);
	});
*/

process.on('uncaughtException', function(err) {
	log.error('启动进程捕获到的未catch的异常：');
	log.error(err)
});

// require('./dal/socket')(httpServer); // 启动socket