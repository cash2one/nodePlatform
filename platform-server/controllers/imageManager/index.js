'use strict';

var viewpath = './imageManager/';

module.exports.imageUpload = function(req, res, next) { // 图片上传
  res.render(viewpath + 'imageUpload/index', {
    userName: req.session.accessToken.name,
    access: req.session.accessToken,
    title: '图片上传',
    project: 'imageManager',
    pageBar: ['图片管理', '图片上传'],
    path: 'imageUpload/index'
  });
};

module.exports.myImages = function(req, res, next) { // 图片上传
  res.render(viewpath + 'myImage/index', {
    userName: req.session.accessToken.name,
    access: req.session.accessToken,
    title: '图片上传',
    project: 'imageManager',
    pageBar: ['图片管理', '我的图片'],
    path: 'myImage/index'
  });
};