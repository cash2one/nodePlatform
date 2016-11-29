DROP TABLE IF EXISTS `usercenter_user`;
CREATE TABLE `usercenter_user` (
  `id`         INT(11)   NOT NULL AUTO_INCREMENT,
  `nickname`   VARCHAR(15)        DEFAULT NULL
  COMMENT 'nick name',
  `phone`      VARCHAR(15)        DEFAULT NULL
  COMMENT 'phone number',
  `email`      VARCHAR(60)        DEFAULT NULL
  COMMENT 'email address',
  `passwd`     VARCHAR(32)        DEFAULT NULL
  COMMENT 'used by native userPo, third part login userPo does not have password',
  `birthday`   DATE               DEFAULT NULL
  COMMENT 'birthday',
  `gender`     TINYINT            DEFAULT NULL
  COMMENT 'gender (0 - unknown, 1 - male, 2 - female) ',
  `province`   TINYINT            DEFAULT NULL,
  `city`       TINYINT            DEFAULT NULL
  COMMENT '00 for default',
  `county`     TINYINT            DEFAULT NULL
  COMMENT '00 for default',
  `pic`        VARCHAR(150)       DEFAULT NULL
  COMMENT 'userPo pic address',
  `updatetime` TIMESTAMP NOT NULL,
  `createtime` TIMESTAMP NOT NULL,
  PRIMARY KEY (`id`)
)
  ENGINE = InnoDB
  AUTO_INCREMENT = 1000
  DEFAULT CHARSET = utf8;

DROP TABLE IF EXISTS `usercenter_user_auth`;
CREATE TABLE `usercenter_user_auth` (
  `id`         INT(11)   NOT NULL AUTO_INCREMENT,
  `uid`        INT(11)   NOT NULL
  COMMENT 'userPo id',
  `appid`      TINYINT   NOT NULL
  COMMENT 'app id',
  `authtype`   INT       NOT NULL
  COMMENT 'register type (0 - native, 1 - weixin, 2 - weibo, 3 - qq, 4 - alipay)',
  `updatetime` TIMESTAMP NOT NULL,
  `createtime` TIMESTAMP NOT NULL,
  UNIQUE uid_appid (uid, appid),
  PRIMARY KEY (`id`)
)
  ENGINE = InnoDB
  AUTO_INCREMENT = 1000
  DEFAULT CHARSET = utf8;

DROP TABLE IF EXISTS `usercenter_user_login`;
CREATE TABLE `usercenter_user_login` (
  `id`        BIGINT    NOT NULL AUTO_INCREMENT,
  `appid`     TINYINT   NOT NULL
  COMMENT 'app id',
  `uid`       INT(11)   NOT NULL
  COMMENT 'userPo id (the key of spore_user table)',
  `ip`        VARCHAR(39)        DEFAULT NULL
  COMMENT 'userPo login ip address',
  `ostype`    TINYINT            DEFAULT NULL
  COMMENT 'OS type 0 - ios , 1 - android',
  `logintime` TIMESTAMP NOT NULL,
  PRIMARY KEY (`id`)
)
  ENGINE = InnoDB
  AUTO_INCREMENT = 1000
  DEFAULT CHARSET = utf8;
