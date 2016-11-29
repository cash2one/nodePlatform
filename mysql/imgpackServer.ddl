DROP TABLE IF EXISTS `platform_app_base_info`;
CREATE TABLE `platform_app_base_info` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `app_name` varchar(45) NOT NULL COMMENT 'app名称',
  `app_project_name` varchar(45) NOT NULL COMMENT 'app工程名',
  `app_desc` varchar(255) DEFAULT NULL,
  `app_lastest_version` varchar(45) DEFAULT NULL COMMENT '最后更新版本',
  `gmt_modify_time` datetime NOT NULL,
  `gmt_create_time` datetime NOT NULL,
  `app_os_type` varchar(45) NOT NULL COMMENT 'app类型，IOS，Android',
  PRIMARY KEY (`id`),
  KEY `idx_platform_app_base_info_app_name` (`app_name`),
  KEY `idx_platform_app_base_info_id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8 COMMENT='app基础信息'



DROP TABLE IF EXISTS `platform_app_base_info`;
CREATE TABLE `platform_app_base_info` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `app_id` int(11) NOT NULL,
  `app_name` varchar(50) NOT NULL COMMENT '应用名称',
  `app_save_path` varchar(200) NOT NULL COMMENT 'app存储路径',
  `app_uploader_id` varchar(45) NOT NULL COMMENT '上传者',
  `app_version` varchar(45) NOT NULL COMMENT 'app版本号',
  `app_os_version` varchar(45) NOT NULL COMMENT 'app操作系统版本',
  `app_volume` varchar(45) DEFAULT NULL COMMENT '应用包大小 kb',
  `app_update_log` varchar(255) DEFAULT NULL COMMENT '应用更新日志',
  `app_package_name` varchar(45) DEFAULT NULL,
  `app_package_type` varchar(45) DEFAULT NULL COMMENT '安装包版本描述 debug/release/beta',
  `app_download_url` varchar(255) NOT NULL COMMENT '下载链接',
  `gmt_modify_time` datetime NOT NULL COMMENT '最后修改时间',
  `gmt_create_time` datetime NOT NULL COMMENT '创建时间',
  `mapping_file_save_path` varchar(200) DEFAULT NULL,
  `mapping_file_download_url` varchar(200) DEFAULT NULL,
  `mapping_file_modify_time` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_platform_app_file_info_app_name` (`app_name`) USING BTREE,
  KEY `idx_platform_app_file_info_app_id` (`app_id`)
) ENGINE=InnoDB AUTO_INCREMENT=59 DEFAULT CHARSET=utf8 COMMENT='app文件上传信息';



DROP TABLE IF EXISTS `platform_img_file_info`;
CREATE TABLE `platform_img_file_info` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `origin_name` varchar(255) NOT NULL COMMENT '原始文件名称',
  `uploader_nick` varchar(45) NOT NULL,
  `uploader_id` varchar(45) NOT NULL COMMENT '上传者ID',
  `file_path` varchar(255) NOT NULL COMMENT '文件存储路径',
  `file_url` varchar(255) NOT NULL COMMENT '线上url（源站地址）',
  `cdn_url` varchar(255) DEFAULT NULL COMMENT 'cdn图片地址',
  `file_volume` varchar(45) NOT NULL COMMENT '图片大小',
  `gmt_modify_time` datetime NOT NULL,
  `gmt_create_time` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `uploader_id` (`uploader_id`)
) ENGINE=InnoDB AUTO_INCREMENT=123 DEFAULT CHARSET=utf8;