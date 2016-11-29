'use strict';

var request = require('request');
var viewpath = './';

var crypto = require('crypto');
var path = require('path');
var fs = require('fs');

var getPassword = function(passwd) { // java服务端用户密码加密算法，与客户端加密统一（暂时不用，因为已在前端js中执行加密）
  var pas256 = crypto.createHash('sha256').update(passwd, 'utf8').digest('hex');
  var md5 = crypto.createHash('md5').update(passwd).digest('hex').toUpperCase();
  var newPassHash = md5.slice(0, 8) +
    pas256.slice(24, 32) +
    pas256.slice(0, 8) +
    md5.slice(16, 24) +
    md5.slice(8, 16) +
    pas256.slice(8, 16) +
    pas256.slice(16, 24) +
    md5.slice(24, 32);
  newPassHash = crypto.createHash('sha256').update(newPassHash, 'utf8').digest('hex');
  return newPassHash.slice(0, 32);
};

module.exports.index = function(req, res, next) { // 欢迎首页
  res.render(viewpath + 'index', {
    title: '首页',
    userInfo: req.session.accessToken
  });
};

module.exports.demo = function(req, res, next) { // 欢迎首页
  console.log('hehehe')
  res.render(viewpath + 'demo', {
    title: 'demo'
  });
};

module.exports.admin = function(req, res, next) { // 管理页
  if (req.session.accessToken.accessRight != 0) {
    res.render(viewpath + '404', {
      title: '权限不足',
      message: '您无权操作！',
      userInfo: req.session.accessToken
    });
  } else {
    res.render(viewpath + 'admin', {
      title: '管理',
      userInfo: req.session.accessToken
    });
  }
};

module.exports.login = function(req, res, next) { // 登录页
  res.render(viewpath + 'login', {
    title: '用户登录'
  });
};

module.exports.regist = function(req, res, next) { // 登录页
  res.render(viewpath + 'regist', {
    title: '注册与找回'
  });
};

module.exports.imgUploader = function(req, res, next) { // 图片上传
  res.render(viewpath + 'imgUploader', {
    title: '图片上传',
    userInfo: req.session.accessToken
  });
};

module.exports.imgNewUploader = function(req, res, next) { // 图片上传
  res.render(viewpath + 'imgNewUploader', {
    title: '图片上传',
    userInfo: req.session.accessToken
  });
};

module.exports.myImages = function(req, res, next) { // 我的图片库
  res.render(viewpath + 'myImages', {
    title: '我的图库',
    userInfo: req.session.accessToken
  });
};

module.exports.myImage = function(req, res, next) { // 我的图片库
  res.render(viewpath + 'myImage', {
    title: '我的图库',
    userInfo: req.session.accessToken
  });
};

module.exports.favicon = function(req, res, next) { // 我的图片库
  res.sendFile(path.join(process.cwd(), './favicon.ico'));
};