var fdfs = require('fdfs');
var SETTINGS = require('../config/settings');
var fdfsCfg = SETTINGS.fdfs.poolConfig;
 
var FdfsClient = new fdfs(fdfsCfg);

module.exports = FdfsClient;