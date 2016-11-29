"use strict";

var pool = require('./pool');
var mysql = require('mysql');
var thunkify = require('thunkify');
var co = require('co');


/*数据库:增删改查,使用了mysql的format做预编译防止sql注入*/
exports.operateDB = thunkify(function(sql, params, callback) {
	var patt = new RegExp("%[0-9a-zA-Z]{2}'");
	params = patternNext(patt, params);
	sql = mysql.format(sql, params);
	pool.query(sql, function(err, results) {
		return callback(err, results);
	});
});

exports.operateDBCallBack = function(sql, params, callback) {
	var patt = new RegExp("%[0-9a-zA-Z]{2}'");
	params = patternNext(patt, params);
	sql = mysql.format(sql, params);
	pool.query(sql, function(err, results) {
		if (callback && typeof callback == 'function') {
			callback(err, results);
		}
	});
}

exports.getSql = function(sql, params) {
	var patt = new RegExp("%[0-9a-zA-Z]{2}'");
	params = patternNext(patt, params);
	sql = mysql.format(sql, params);
	return sql;
};

var patternNext = function(patt, params) {
	for (var i = 0; i < params.length; i++) {
		if (patt.test(params[i])) {
			params[i] = params[i].replace(/%[0-9a-zA-Z]{2}'/, '');
			params = patternNext(patt, params);
		}
	}
	return params;
}

exports.operateSql = function(sql) {
	return new Promise(function(reslove, reject) {
		if (!sql) {
			reject(new Error('The "sql" parameter is empty.'));
		}
		pool.query(sql, function(err, results) {
			if (!err) {
				reslove(results);
			} else {
				reject(err);
			}
		});
	});
};