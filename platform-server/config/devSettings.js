var logManager = require('../dal/logger');
var log = logManager.getLogger('systemService');
var settings = {
	host: 'platformdev.100credit.com',
	mysql: {
		limit: 15,
		ip: '127.0.0.1', // 本地测试
		database: 'platform_system',
		username: 'root',
		password: 'sa',
		port: '3306'
	},
	fdfs: {
		cdnHost: 'http://img.cobarla.com',
		host: 'http://img.cobarla.com', // 日常fastdfs服务器
		poolConfig: {
			trackers: [{ // tracker 服务器 
				host: '192.168.180.19', // 日常180.19
				port: 22122
			}],
			timeout: 30000, // 默认超时时间10s 
			defaultExt: 'jpeg', // 默认后缀 当获取不到文件后缀时使用 
			charset: 'utf8' // charset默认utf8 
		}
	},
	session: {
		cookie: {
			maxAge: 21600000
		},
		redisStore: {
			host: '192.168.180.10', // 日常redis存储
			// host: '127.0.0.1', // 日常redis存储
			port: 6379,
			db: 0,
			ttl: 21600000,
			prefix: 'platform:sessionId:',
			logErrors: function(e) {
				log.error('redisStore:连接异常');
				log.error(e);
			}
		}
	},
	redisClient: {
		host: '192.168.180.10', // 日常redis存储
		// host: '127.0.0.1', // 日常redis存储
		port: 6379,
		db: 0,
		prefix: 'platform:sessionId:'
	},
	package: { // 包管理器配置
		savePath: '/opt/packageSource/' // 包存储根目录
	}
};

module.exports = settings;