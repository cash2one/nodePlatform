'strict mode';

var settings = require('../config/settings');
var mysql = require('mysql');
var mysqlCfg = settings.mysql;

// 创建连接接池
var pool = mysql.createPool({
  // connectionLimit : mysqlCfg.limit,
  host: mysqlCfg.ip,
  port: mysqlCfg.port,
  user: mysqlCfg.username,
  password: mysqlCfg.password,
  database: mysqlCfg.database
});

module.exports = pool;