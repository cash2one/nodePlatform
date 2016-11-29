nodePlatform
============

# redis
    使用redis来存储session信息。

## redis-server
* 启动方法：

    ```
    # 正确安装redis，使用[redis-server 配置文件所在位置]进行启动
    redis-server /opt/redis-3.2.4/redis.conf
    ```

## redis-client
* 启动方法：
    
    ```
    # 正确安装redis-client，[redis-cli -h 服务器地址]进行启动
    redis-cli -h 127.0.0.1
    ```

# mysql
    使用mysql作为数据存储。

## 相关数据库及表结构

### 数据库

* `platform_system`数据库创建语句

    ```
    CREATE DATABASE `platform_system` /*!40100 DEFAULT CHARACTER SET utf8 */
    ```

### 表结构
* `platform_app_file_info`
    * 说明：app文件上传信息表
    * 表结构：

    ```
    CREATE TABLE `platform_app_file_info` (
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
    ) ENGINE=InnoDB AUTO_INCREMENT=68 DEFAULT CHARSET=utf8 COMMENT='app文件上传信息'
    ```

* `platform_app_base_info`
    * 说明：app基础信息
    * 表结构：

    ```
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
    ) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8 COMMENT='app基础信息'
    ```

* `platform_img_file_info`
    * 说明：图片服务文件上传信息表
    * 表结构：

    ```
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
    ) ENGINE=InnoDB AUTO_INCREMENT=182 DEFAULT CHARSET=utf8 COMMENT='图片服务文件上传信息表'
    ```
