var logManager = require('../dal/logger');
var log = logManager.getLogger('systemService');
var settings = {};
var getSettings = function() {
	if (process.env.NODE_ENV == 'dev') {
		log.info('使用[本地]配置环境');
		settings = require('./devSettings');
	} else if (process.env.NODE_ENV == 'daily') {
		log.info('使用[日常]配置环境');
		settings = require('./dailySettings');
	} else if (process.env.NODE_ENV == 'production') {
		settings = require('./productionSettings');
		log.info('使用[线上]配置环境');
	} else {
		settings = require('./devSettings');
		log.info('使用默认[本地开发]配置环境');
	}
	return settings;
}

module.exports = getSettings();