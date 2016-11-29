'use strict';

var path = require('path');
var fs = require('fs');
var crypto = require('crypto');
var co = require('co');
var SETTINGS = require('../../config/settings');
var logManager = require('../../dal/logger');
var log = logManager.getLogger('packageService');
var mysql = require('../../dal/mysql');
// var apkparser = require('apkparser');  由于apkparser npm安装经常存在问题，所以使用isomorphic-pkg-reader模块替换
// https://github.com/open-nata/apkparser
// https://www.npmjs.com/package/apk-parser2
var extract = require('ipa-extract-info');
var mkdirp = require('mkdirp');
// https://www.npmjs.com/package/ipa-extract-info
var PkgReader = require('isomorphic-pkg-reader');
// https://www.npmjs.com/package/isomorphic-pkg-reader
var thunkify = require('thunkify');

var PROTOCOL_SSL = 'https://';

Date.prototype.Format = function(fmt) { //author: meizz   
	var o = {
		"M+": this.getMonth() + 1, //月份   
		"d+": this.getDate(), //日   
		"h+": this.getHours(), //小时   
		"m+": this.getMinutes(), //分   
		"s+": this.getSeconds(), //秒   
		"q+": Math.floor((this.getMonth() + 3) / 3), //季度   
		"S": this.getMilliseconds() //毫秒   
	};
	if (/(y+)/.test(fmt))
		fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
	for (var k in o)
		if (new RegExp("(" + k + ")").test(fmt))
			fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
	return fmt;
};

function createDir(writePath) {
	var exists = fs.existsSync(writePath);
	if (!exists) {
		mkdirp.sync(writePath);
		// fs.mkdirSync(writePath);
	}
}

module.exports.postPackageUploader = function(req, res, next) { // 上传包
	var username = req.session.accessToken.name;
	var appUploaderId = req.session.accessToken.uid; // 上传者ID
	for (var name in req.body) {
		var base64Data = name.replace(/^data:[\w]*\;base64,/, "")
		base64Data = base64Data.replace(/\s/g, '+')
		var dataBuffer = new Buffer(base64Data, 'base64');

		var fileName = req.headers.x_filename || req.headers['x-tvs-filename'];
		var appName = fileName.split('-')[0]; // app名称
		// var appVersion = fileName.match(/v\d+\.\d+\.\d+/); // app版本号
		var appVersion = fileName.match(/\d+\.\d+\.\d+/)[0]; // app版本号
		var suffix = fileName.split('.').pop(); // 文件后缀名
		var appPackageType = fileName.split('-').length == 3 ? fileName.split('-')[2].split('.')[0] : null; // 安装包版本描述 debug/release/beta ...
		var appOsVersion = 'unknown'; // 操作系统类型
		var pkId = req.query.pkid || null;
		var isSaveAndroidMapping = false;
		if (suffix === 'ipa') {
			appOsVersion = 'ios';
		} else if (suffix === 'apk') {
			appOsVersion = 'android'
		} else if (suffix === 'mapping') {
			appOsVersion = 'android';
			isSaveAndroidMapping = true;
		}
		var packageSaveRootPath = SETTINGS.package.savePath + appOsVersion + '/' + appName + '/';
		// var writePath = path.join(process.cwd(), 'public/package/' + appOsVersion + '/' + appName);
		try {
			createDir(packageSaveRootPath);
		} catch (e) {
			log.error(JSON.stringify({
				type: 'postPackageUploader:createDir',
				status: 'failure',
				msg: '创建存储目录失败',
				username: username,
				fileName: fileName,
				appName: appName,
				packageSaveRootPath: packageSaveRootPath, //存储路径
				appUploaderId: appUploaderId,
				error: e
			}));
			log.error(e);
		}
		var appSavePath = path.join(packageSaveRootPath, fileName);
		var isUpdatePackage = fs.existsSync(appSavePath);
		var writeFiles = function() {
			fs.writeFile(appSavePath, dataBuffer, function(err) {
				if (!err) {
					co(function*() {
						var ret = {};
						var appPackageName = '';
						if (appOsVersion == 'android') {
							/*由于apkparser npm安装经常存在问题，所以使用isomorphic-pkg-reader模块替换
							appPackageName = yield apkparser.parse(appSavePath).then((manifest) => {
								return manifest._packageName;
							}).catch((e) => {
								log.warn(JSON.stringify({type: 'postPackageUploader:writeFiles:manifestParse',status: 'failure',msg: '安卓manifest文件解析失败',username: username,fileName: fileName,appName: appName,appSavePath: appSavePath, //存储路径appUploaderId: appUploaderId,appVersion: appVersion,appOsVersion: appOsVersion,appPackageName: appPackageName,appPackageType: appPackageType,appVolume: dataBuffer.length,error: e}));
								return '解析期间发生错误!';
							});

							var appDownloadUrl = PROTOCOL_SSL + SETTINGS.host + '/packageDownloader/' + appOsVersion + '/' + appName + '/' + fileName;

							log.info(JSON.stringify({type: 'postPackageUploader:writeFiles',status: 'success',msg: '包上传成功',username: username,fileName: fileName,appName: appName,appSavePath: appSavePath, //存储路径appUploaderId: appUploaderId,appVersion: appVersion,appOsVersion: appOsVersion,appPackageName: appPackageName,appPackageType: appPackageType,appVolume: dataBuffer.length,appDownloadUrl: appDownloadUrl,error: false}));

							res.json({infos: {fileName: fileName,appName: appName,appSavePath: appSavePath, //存储路径appUploaderId: appUploaderId,appVersion: appVersion,appOsVersion: appOsVersion,appPackageName: appPackageName,appPackageType: appPackageType,appVolume: dataBuffer.length,appDownloadUrl: appDownloadUrl},success: true,code: '200',msg: '创建成功'});*/

							var reader = new PkgReader(appSavePath, 'apk', {
								iconType: 'base64',
								searchResource: true
							});
							reader.parse = thunkify(reader.parse);

							reader.parse()(function(err, pkgInfo) {
								if (err) {
									log.warn(JSON.stringify({
										type: 'postPackageUploader:writeFiles:manifestParse',
										status: 'failure',
										msg: '安卓manifest文件解析失败',
										username: username,
										fileName: fileName,
										appName: appName,
										appSavePath: appSavePath, //存储路径
										appUploaderId: appUploaderId,
										appVersion: appVersion,
										appOsVersion: appOsVersion,
										appPackageName: '安卓manifest文件解析失败',
										appPackageType: appPackageType,
										appVolume: dataBuffer.length,
										error: err
									}));
									res.json({
										success: false,
										code: 'UNKNOWN',
										msg: '安卓manifest文件解析失败',
										error: err
									});
								} else {
									appPackageName = pkgInfo.package;
									var appDownloadUrl = PROTOCOL_SSL + SETTINGS.host + '/packageDownloader/' + appOsVersion + '/' + appName + '/' + fileName;

									log.info(JSON.stringify({
										type: 'postPackageUploader:writeFiles',
										status: 'success',
										msg: '包上传成功',
										username: username,
										fileName: fileName,
										appName: appName,
										appSavePath: appSavePath, //存储路径
										appUploaderId: appUploaderId,
										appVersion: appVersion,
										appOsVersion: appOsVersion,
										appPackageName: appPackageName,
										appPackageType: appPackageType,
										appVolume: dataBuffer.length,
										appDownloadUrl: appDownloadUrl,
										error: false
									}));

									res.json({
										infos: {
											fileName: fileName,
											appName: appName,
											appSavePath: appSavePath, //存储路径
											appUploaderId: appUploaderId,
											appVersion: appVersion,
											appOsVersion: appOsVersion,
											appPackageName: appPackageName,
											appPackageType: appPackageType,
											appVolume: dataBuffer.length,
											appDownloadUrl: appDownloadUrl
										},
										success: true,
										code: '200',
										msg: '创建成功'
									});
								}
							});
						} else if (appOsVersion == 'ios') {
							var fd = fs.openSync(appSavePath, 'r');
							var plistUrl = PROTOCOL_SSL + SETTINGS.host + '/packageDownloader/' + appOsVersion + '/' + appName + '/' + fileName.replace(/\.ipa$/, '.plist');
							var appUrl = PROTOCOL_SSL + SETTINGS.host + '/packageDownloader/' + appOsVersion + '/' + appName + '/' + fileName;
							var getIosPlist = function(done) {
								extract(fd, function(extractErr, info, raw) {
									var pkName = '未解析到包名';
									if (extractErr) {
										log.warn(JSON.stringify({
											type: 'postPackageUploader:writeFiles:iosParse',
											status: 'failure',
											msg: '未解析到IOS包名',
											username: username,
											appUploaderId: appUploaderId,
											fileName: fileName,
											appName: appName,
											appSavePath: appSavePath, //存储路径
											appVersion: appVersion,
											appOsVersion: appOsVersion,
											appPackageName: appPackageName,
											appPackageType: appPackageType,
											appVolume: dataBuffer.length,
											error: extractErr
										}));
									} else {
										var result = {
											info: info,
											error: false
										};
										if (info && info[0] && info[0].CFBundleIdentifier) { // ios安装包需单独存储plist文件
											var plistName = fileName.replace(/\.ipa$/, '.plist');
											// var plistSavePath = path.join(process.cwd(), 'public/package/' + appOsVersion + '/' + appName + '/' + plistName);
											var plistSavePath = path.join(packageSaveRootPath + plistName);
											var plistTmpl = '<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd"><plist version="1.0"><dict><key>items</key><array><dict><key>assets</key><array><dict><key>kind</key><string>software-package</string><key>url</key><string>$url$</string></dict></array><key>metadata</key><dict><key>bundle-identifier</key><string>$bundleIdentifier$</string><key>bundle-version</key><string>$bundleVersion$</string><key>kind</key><string>software</string><key>title</key><string>$title$</string></dict></dict></array></dict></plist>';
											var plistContent = plistTmpl.replace(/\$url\$/, appUrl).replace(/\$bundleIdentifier\$/, info[0].CFBundleIdentifier).replace(/\$bundleVersion\$/, appVersion).replace(/\$title\$/, info[0].CFBundleName);
											try {
												fs.writeFileSync(plistSavePath, plistContent);
												log.debug(JSON.stringify({
													type: 'postPackageUploader:writeFiles:plist',
													status: 'success',
													msg: 'plist生成成功',
													username: username,
													appUploaderId: appUploaderId,
													plistSavePath: plistSavePath,
													error: false
												}));
											} catch (err) {
												log.warn(JSON.stringify({
													type: 'postPackageUploader:writeFiles:plist',
													status: 'failure',
													msg: 'plist生成失败',
													username: username,
													appUploaderId: appUploaderId,
													plistSavePath: plistSavePath,
													error: false
												}));
												result.error = {
													err: err,
													msg: '创建plist失败'
												}
											}
										}
									}
									done(null, result);
								});
							};
							var plistResult = yield getIosPlist;
							var plistInfo = plistResult.info;
							appPackageName = plistInfo && plistInfo[0] && plistInfo[0].CFBundleIdentifier || '未解析到包名';;
							if (!plistResult.error) {
								log.info(JSON.stringify({
									type: 'postPackageUploader:writeFiles:plist',
									status: 'success',
									msg: '包上传成功',
									username: username,
									appUploaderId: appUploaderId,
									fileName: fileName,
									appName: appName,
									appSavePath: appSavePath, //存储路径
									appVersion: appVersion,
									appOsVersion: appOsVersion,
									appPackageName: appPackageName,
									appPackageType: appPackageType,
									appVolume: dataBuffer.length,
									appDownloadUrl: plistUrl,
									error: false
								}));

								res.json({
									infos: {
										fileName: fileName,
										appName: appName,
										appSavePath: appSavePath, //存储路径
										appUploaderId: appUploaderId,
										appVersion: appVersion,
										appOsVersion: appOsVersion,
										appPackageName: appPackageName,
										appPackageType: appPackageType,
										appVolume: dataBuffer.length,
										appDownloadUrl: plistUrl
									},
									success: true,
									code: '200',
									msg: '创建成功'
								});
							} else { // plist创建失败
								log.warn(JSON.stringify({
									type: 'postPackageUploader:writeFiles:plist',
									status: 'failure',
									msg: 'plist创建失败',
									username: username,
									appUploaderId: appUploaderId,
									error: plistResult.error
								}));
								res.json({
									success: false,
									code: 'UNKNOWN',
									msg: plistResult.error.msg,
									error: plistResult.error
								});
							}
						}
					});
				} else {
					log.error(JSON.stringify({
						type: 'postPackageUploader:writeFiles',
						status: 'failure',
						msg: '包存储失败',
						username: username,
						appUploaderId: appUploaderId,
						error: err
					}));
					res.json({
						success: false,
						code: 'UNKNOWN',
						msg: '安装包写入失败，请检查该文件',
						error: err
					});
				}
			});
		};

		if (isSaveAndroidMapping) { // 存储安卓mapping文件，直接覆盖源文件
			var updateMapping = function(done) {
				var appDownloadUrl = PROTOCOL_SSL + SETTINGS.host + '/packageDownloader/' + appOsVersion + '/' + appName + '/' + fileName;
				var updateParams = ['platform_app_file_info', 'mapping_file_save_path', appSavePath, 'mapping_file_download_url', appDownloadUrl, 'mapping_file_modify_time', new Date(), 'id', pkId];
				var sql = 'update ??  set ?? = ?, ?? = ?, ?? = ? where ?? = ?;';
				var updateSql = mysql.getSql(sql, updateParams);
				co(function*() {
					var ret = {};
					try {
						var results = yield mysql.operateDB(updateSql, []);
						log.info(JSON.stringify({
							type: 'postPackageUploader:updateMapping',
							status: 'success',
							msg: 'mapping文件写入DB成功',
							username: username,
							appUploaderId: appUploaderId,
							fileName: fileName,
							packageId: pkId,
							appDownloadUrl: appDownloadUrl,
							updateSql: updateSql,
							appSavePath: appSavePath,
							error: false
						}));

					} catch (eee) {
						log.error(JSON.stringify({
							type: 'postPackageUploader:updateMapping',
							status: 'failure',
							msg: 'mapping文件写入DB失败',
							username: username,
							appUploaderId: appUploaderId,
							fileName: fileName,
							packageId: pkId,
							appDownloadUrl: appDownloadUrl,
							updateSql: updateSql,
							appSavePath: appSavePath,
							error: eee
						}));
					}
					done(null, true);
				});
			};
			fs.writeFile(appSavePath, dataBuffer, function(err) {
				if (!err) {
					log.info(JSON.stringify({
						type: 'postPackageUploader:writeFiles',
						status: 'success',
						msg: 'Mapping文件写入成功',
						username: username,
						appUploaderId: appUploaderId,
						appSavePath: appSavePath,
						error: false
					}));
					co(function*() {
						var isInDBase = yield updateMapping;
						res.json({
							success: true,
							code: '200',
							msg: '上传mapping文件成功',
							mapping: true
						});
					});
				} else {
					log.error(JSON.stringify({
						type: 'postPackageUploader:writeFiles',
						status: 'failure',
						msg: 'Mapping文件写入失败',
						username: username,
						appUploaderId: appUploaderId,
						appSavePath: appSavePath,
						error: err
					}));
				}
			});
		} else {
			if (isUpdatePackage) { // 已经存在该安装包：case1：上传但没有最后确定， case2：上传并且已经存入数据库
				var checkIsInDB = function(done) { // 检测是否已经正式上传了该版本的安装包
					var selectParams = ['platform_app_file_info', 'app_save_path', appSavePath];
					var sql = 'SELECT count(id) FROM ?? where ?? = ?'
					var tmspSql = mysql.getSql(sql, selectParams);
					var isInDb = false;
					co(function*() {
						var ret = {};
						try {
							var results = yield mysql.operateDB(tmspSql, []);
							if (results[0]['count(id)'] <= 0) { // 只上传文件，但没有更新至数据库
								isInDb = false;
							} else {
								isInDb = true;
							}
						} catch (eee) {
							log.error(JSON.stringify({
								type: 'postPackageUploader:checkIsInDB',
								status: 'failure',
								msg: '检查包文件inDB失败',
								username: username,
								appUploaderId: appUploaderId,
								error: eee
							}));
						}
						done(null, isInDb);
					});
				};

				co(function*() {
					var isInDBase = yield checkIsInDB;
					if (isInDBase) { // 已经保存至数据库，
						res.json({
							infos: false,
							success: true,
							code: '202',
							msg: '服务端已存在该版本的同名文件了！'
						});
					} else {
						writeFiles();
					}
				});
			} else {
				writeFiles();
			}
		}
	}
};

module.exports.finishPackageUploader = function(req, res, next) { // 确认上传
	var username = req.session.accessToken.name;
	var appUploaderId = req.body.appUploaderId;
	// var appUploaderId = req.body.appUploaderId;
	// var appDownloadUrl = SETTINGS.host + '/packageDownloader/' + req.body.appOsVersion + '/' + req.body.appName + '/' + req.body.fileName;
	var insertKey = ['app_id', 'app_name', 'app_save_path', 'app_uploader_id', 'app_version', 'app_os_version', 'app_volume', 'app_update_log', 'app_package_name', 'app_package_type', 'app_download_url', 'gmt_modify_time', 'gmt_create_time'];
	var insertParams = [req.body.appId, req.body.appName, req.body.appSavePath, appUploaderId, req.body.appVersion, req.body.appOsVersion, req.body.appVolume, req.body.appUpdateLog, req.body.appPackageName, req.body.appPackageType, req.body.appDownloadUrl, new Date(), new Date()];
	var sql = 'insert into platform_app_file_info (' + insertKey.toString() + ') values (?,?,?,?,?,?,?,?,?,?,?,?,?)';
	var tmspSql = mysql.getSql(sql, insertParams);

	var updateParams = ['platform_app_base_info', 'app_lastest_version', req.body.appVersion, 'gmt_modify_time', new Date(), 'id', req.body.appId];
	var sql = 'update ??  set ?? = ?, ?? = ? where ?? = ?;';
	var updateSql = mysql.getSql(sql, updateParams);

	co(function*() {
		var ret = {};
		try {
			var results = yield mysql.operateDB(tmspSql, []);
			var baseResult = yield mysql.operateDB(updateSql, []);
			log.info(JSON.stringify({
				type: 'finishPackageUploader',
				status: 'success',
				msg: '包上传完成',
				username: username,
				appUploaderId: appUploaderId,
				fileName: req.body.fileName,
				insertSQL: tmspSql,
				updateSql: updateSql,
				error: false
			}));
			res.json({
				success: true,
				code: '200',
				msg: '创建成功',
				platformSrc: '//' + SETTINGS.host + '/packageDownloader/' + req.body.appOsVersion + '/' + req.body.appName + '/' + req.body.fileName
			});
		} catch (eee) {
			log.error(JSON.stringify({
				type: 'finishPackageUploader',
				status: 'failure',
				msg: '包上传失败',
				username: username,
				appUploaderId: appUploaderId,
				fileName: req.body.fileName,
				error: eee
			}));
			log.error(eee);
			res.json({
				success: false,
				code: '-1',
				msg: '创建失败，数据库写入失败',
				platformSrc: '' // 平台图片url
			});
			//  todo
		}
	});
};

module.exports.dropPackage = function(req, res, next) { // 删除指定包
	var username = req.session.accessToken.name;
	var appUploaderId = req.session.accessToken.uid; // 上传者ID
	var appSavePath = '';
	var id = req.body.id;
	var delParams = ['platform_app_file_info', 'id', id];
	var tmspSql = 'delete from ?? where ?? = ?';
	var delSql = mysql.getSql(tmspSql, delParams);

	co(function*() {
		var selectParams = ['app_save_path', 'platform_app_file_info', 'id', id];
		var tmspSql = 'select ?? from ?? where ?? = ?';
		var sql = mysql.getSql(tmspSql, selectParams);
		log.debug(JSON.stringify({
			type: 'dropPackage',
			username: username,
			appUploaderId: appUploaderId,
			status: 'todo',
			msg: '准备执行查询语句',
			sql: sql,
			packageId: id,
			error: false
		}));
		return yield mysql.operateSql(sql);
	}).then(function(data) {
		if (data[0] && data[0].app_save_path) {
			appSavePath = data[0].app_save_path;
			try {
				if (appSavePath.slice(-3) == 'ipa') {
					var plistFilePath = appSavePath.slice(0, -3) + 'plist';
					fs.unlinkSync(plistFilePath);
					log.info(JSON.stringify({
						type: 'dropPackage',
						username: username,
						appUploaderId: appUploaderId,
						status: 'success',
						msg: '删除plist文件成功',
						fileUrl: plistFilePath,
						packageId: id,
						error: false
					}));
				}
				fs.unlinkSync(appSavePath);
				log.info(JSON.stringify({
					type: 'dropPackage',
					username: username,
					appUploaderId: appUploaderId,
					status: 'success',
					msg: '删除package文件成功',
					fileUrl: appSavePath,
					packageId: id,
					error: false
				}));
			} catch (e) {
				if (e.message.indexOf('no such file or directory') != -1) { // 不存在包文件，则直接删除sql记录
					log.warn(JSON.stringify({
						type: 'dropPackage',
						username: username,
						appUploaderId: appUploaderId,
						status: 'failure',
						msg: '删除package文件失败，因为文件不存在。',
						fileUrl: appSavePath,
						packageId: id,
						error: e
					}));
				} else { // 其他错误则跳出
					log.error(JSON.stringify({
						type: 'dropPackage',
						username: username,
						appUploaderId: appUploaderId,
						status: 'failure',
						msg: '删除package文件失败',
						fileUrl: appSavePath,
						packageId: id,
						error: e
					}));
					return e;
				}
			}
		} else {
			log.info(JSON.stringify({
				type: 'dropPackage',
				username: username,
				appUploaderId: appUploaderId,
				status: 'success',
				msg: '删除package文件失败，因为mysql中找不到该id的记录。',
				packageId: id,
				error: false
			}));
		}

		log.info(JSON.stringify({
			type: 'dropPackage',
			username: username,
			appUploaderId: appUploaderId,
			status: 'todo',
			msg: '准备执行删除语句',
			sql: delSql,
			packageId: id,
			error: false
		}));
		return mysql.operateSql(delSql);
	}).then(function(data) {
		log.info(JSON.stringify({
			type: 'dropPackage',
			status: 'success',
			msg: 'mysql记录删除成功',
			sql: delSql,
			packageId: id,
			data: data,
			error: false
		}));
		return res.json({
			success: true,
			code: '200',
			msg: 'mysql删除成功'
		});
	}).catch(function(e) {
		log.error(JSON.stringify({
			type: 'dropPackage',
			status: 'failure',
			msg: '删除包时出现错误',
			fileUrl: appSavePath,
			packageId: id,
			error: e
		}));
		return res.json({
			success: false,
			code: 'UNKNOWN',
			msg: 'mysql删除失败'
		});
	});
};