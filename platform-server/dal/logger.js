var log4js = require('log4js');
var path = require('path');
var mkdirp = require('mkdirp');
var fs = require('fs');
var log_level = 'DEBUG';
/*
	//log4js的输出级别6个: trace, debug, info, warn, error, fatal
	var settings = require('./config');
	if (settings['log_level']) {
		log_level = settings['log_level'];
	}
*/

function createDir(writePath) {
	var exists = fs.existsSync(writePath);
	if (!exists) {
		mkdirp.sync(writePath);
		// fs.mkdirSync(writePath);
	}
}

var logManager = {
	logger: {},
	init: function(category) {
		createDir(path.join(process.cwd(), './logs'));
		log4js.configure({
			"appenders": [{
				"type": "dateFile",
				"filename": path.join(process.cwd(), './logs/webService'),
				"maxLogSize": 50 * 1024 * 1024,
				"backups": 4,
				"category": "webService",
				"layout": {
					"type": "pattern",
					"pattern": "[%r] [%p] [%c] %m"
						//[时间] [日志级别] [category] [日志信息]
				},
				"alwaysIncludePattern": true,
				"pattern": "-yyyy-MM-dd.log"
			}, {
				"type": "dateFile",
				"filename": path.join(process.cwd(), './logs/imageService'),
				"maxLogSize": 50 * 1024 * 1024,
				"backups": 4,
				"category": "imageService",
				"layout": {
					"type": "pattern",
					"pattern": "[%r] [%p] [%c] %m"
						//[时间] [日志级别] [category] [日志信息]
				},
				"alwaysIncludePattern": true,
				"pattern": "-yyyy-MM-dd.log"
			}, {
				"type": "dateFile",
				"filename": path.join(process.cwd(), './logs/systemService'),
				"maxLogSize": 50 * 1024 * 1024,
				"backups": 4,
				"category": "systemService",
				"layout": {
					"type": "pattern",
					"pattern": "[%r] [%p] [%c] %m"
						//[时间] [日志级别] [category] [日志信息]
				},
				"alwaysIncludePattern": true,
				"pattern": "-yyyy-MM-dd.log"
			}, {
				"type": "dateFile",
				"filename": path.join(process.cwd(), './logs/packageService'),
				"maxLogSize": 50 * 1024 * 1024,
				"backups": 4,
				"category": "packageService",
				"layout": {
					"type": "pattern",
					"pattern": "[%r] [%p] [%c] %m"
						//[时间] [日志级别] [category] [日志信息]
				},
				"alwaysIncludePattern": true,
				"pattern": "-yyyy-MM-dd.log"
			}, {
				"type": "console"
			}]
		});
		this.logger[category] = log4js.getLogger(category);
		this.logger[category].setLevel(log_level);
	},
	getLogger: function(category) {
		if (!this.logger[category]) {
			// console.log('新建日志：' + category);
			this.init(category);
		}
		return this.logger[category];
	}
}

module.exports = logManager;