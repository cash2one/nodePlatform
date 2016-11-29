platform-server
================
百融金服互联网事业部内部工具平台

================

### 目录
* [开发准备](#开发准备)
    * NPM依赖安装
    * 配置项设置
    * 启动服务
* [日常和线上Git代码同步](#日常和线上Git代码同步)
* [自动化部署及发布](#自动化部署及发布)

开发准备
---------

### NPM依赖安装

```
npm install
```

### 配置项设置

请检查`config`目录下不同环境的配置文件
* `devSetting.js` : 本地环境配置
* `dailySetting.js` : 日常环境配置
* `productionSetting.js` : 线上环境配置

```
//配置文件说明，以配置为例：
var settings = {
    host: 'platform.host.com', 服务域名
    mysql: { // 数据库相关
        limit: 15,
        ip: 'xxx.xxx.xx.xxx', // 数据库vip地址
        username: 'xxx',
        password: 'xxxxx',
        database: 'xxx',
        port: '3306'
    },
    fdfs: {
        cdnHost: 'http://cdn.host.com', // cdn域名
        host: 'http://img.host.com',  // 源站域名
        poolConfig: {
            trackers: [{ // tracker servers 
                host: 'tracker server Ip1 host', // 机房tracker服务器1
                port: 22122
            },{ 
                host: 'tracker server Ip2 host', // 机房tracker服务器2
                port: 22122
            }],
            timeout: 30000, // 默认超时时间10s 
            defaultExt: 'jpeg', // 默认后缀 当获取不到文件后缀时使用 
            charset: 'utf8' // charset默认utf8 
        }
    },
    session: {
        cookie: {
            maxAge: 21600000 // session过期时间
        },
        redisStore: {
            host: 'redis server ip host',
            port: 6379,
            db: 1,
            ttl: 21600000,
            prefix: 'platform:sessionId:',
            logErrors: function(e){ // redis错误日志自定义函数
                log.error('redisStore:连接异常');
                log.error(e);
            }
        }
    },
    redisClient: {
        host: 'redis server ip host',
        port: 6379,
        db: 1,
        prefix: 'platform:sessionId:' // redis存储前缀
    },
    package: { // 包管理器配置
        savePath: '/opt/packageSource/' // 包存储根目录 * 请确保有足够权限创建此目录
    }
};
```

### 启动服务

1. 配置启动环境
    ```
    export NODE_ENV=<环境option> 
    ```
    * 环境option说明:
      * dev  :  使用本地配置
      * daily  :  使用日常配置
      * production :  使用线上配置

2. 启动进程
    * 方式一、使用守护进程进行调试
        ```
        # 代码：
            export NODE_ENV=<环境option> && node dispatch.js 
        
        # 示例：
            export NODE_ENV=dev && node dispatch.js 

        * 不支持node端修改热刷新，需重启服务，才能使（后端）修改生效
        ```
    * 方式二、使用supervisor进行热刷新开发调试 （推荐用于开发环境）
        ```
        sudo npm install -g supervisor   # 安装supervisor模块

        # 代码：
            export NODE_ENV=<环境option> && supervisor app.js  # 无法指定配置，将默认启用默认配置

        # 示例：
            export NODE_ENV=dev && supervisor app.js
            export NODE_ENV=daily && supervisor app.js
        ```
    * 方式三、使用pm2作为守护进程 （推荐用于生产环境）
        ```
        sudo npm install -g pm2   # 安装pm2模块

        # 代码：
            export NODE_ENV=<环境option> && pm2 start app.js --watch --name="platform"  # 无法指定配置，将默认启用默认配置

        # 说明：
            --watch : 当有文件变更时重启服务
            --name : 设置进程别名（用于停止、重启及监控）

        # 示例：
            export NODE_ENV=dev && pm2 start app.js --watch --name="platform"
        ```
    [pm2介绍及命令汇总](https://www.douban.com/note/314200231/)
    * 方式四、使用npm命令启动
        ```
        npm run dev # 启动本地开发环境
        
        npm run daily # 启动日常

        npm run production # 启动生产环境
        
        npm run build # 进行webpack构建
        ```

日常和线上Git代码同步
--------------------
* 目前采用主干分支开发的方式，但由于日常Git(gitlabdev.100credit.cn)与线上Git(gitlab.100credit.cn)无法打通，需要在代码提交到线上Git时，同时将代码作为镜像推送至日常Git。这样才能确保日常代码库为最新。

        ```
        git push origin master  # 提交线上代码

        git push --mirror http://gitlabdev.100credit.cn/fed/platform.git  # 将镜像推送至日常
        ```

自动化部署及发布
-------------
1. 准备工作
    * 在远端服务器上，生成自己的.ssh 公钥，并且拷贝到git中对应项目的deploy key中。
    * 在远端服务器上，自己的家目录下，配置 ~/.ssh/config文件：
        ```
        Host 192.168.180.10
        HostName 192.168.180.10
        Port 3222
        User yangyue  # 执行发布的git账号用户名
        StrictHostKeyChecking no
        ```
    * 本地 ~/.ssh/config中设置 
        ```
        Host 192.168.180.19
        HostName 192.168.180.19
        Port 3222
        User yue.yang    # 远程登录服务器的用户名
        ```

2. 发布配置`ecosystem.json`
    请务必确认`PM2_HOME='/opt/platformdev/.pm2'`,否则会导致其他同学无法看到启动的服务。
   ```
   {
      "apps": [{
        "name": "platform",
        "script": "app.js",
        "env": {
          "COMMON_VARIABLE": "true"
        },
        "env_production": {
          "NODE_ENV": "production"
        }
      }],
      "deploy": {
        "production": {
          "user": "lixiaohu", // 线上服务器发布账号名称
          "host": ["192.168.23.218"], // 线上服务器地址
          "ref": "origin/master",
          "repo": "git@gitlab.100credit.cn:fed/platform.git",
          "path": "/opt/platform", // 发布路径
          "ssh_options": "StrictHostKeyChecking=no",
          "post-deploy": "npm install && PM2_HOME='/opt/platformdev/.pm2' pm2 startOrRestart ecosystem.json --env production", // 部署脚本
          "env": {
            "NODE_ENV": "production" // 环境变量
          }
        },
        "daily": {
          "user": "lixiaohu", // 日常服务器发布账号名称
          "host": "192.168.180.19", // 日常服务器地址
          "ref": "origin/master",
          "repo": "git@192.168.180.10:fed/platform.git",
          "path": "/opt/platformdev", // 发布路径
          "ssh_options": "StrictHostKeyChecking=no",
          "post-deploy": "npm install && PM2_HOME='/opt/platformdev/.pm2' pm2 startOrRestart ecosystem.json --env daily", // 部署脚本
          "env": {
            "NODE_ENV": "daily" // 环境变量
          }
        }
      }
    }
   ```

3. 发布命令
    ```
    pm2 ecosystem # 如果没有ecosystem.json，需要手动生成部署文件ecosystem.json。之后,修改ecosystem.json,使其和上文中的配置保持一致

    pm2 deploy ecosystem.json daily setup   # 首次部署 (会在服务器端生成文件目录)

    pm2 deploy ecosystem.json daily   # 发布日常

    pm2 deploy ecosystem.json production   # 发布线上

    pm2 deploy production update # 更新部署 （尚未测试）
    ```
    * 注意事项
        1. 请确保发布时git已经全部提交；否则需要在发布命令的后面添加`--force`，强制不更新，直接发布
        2. 请务必确认`PM2_HOME='/opt/platformdev/.pm2'`,否则会导致其他同学无法看到启动的服务。
    * [更多部署相关文档](http://pm2.keymetrics.io/docs/usage/deployment/)

4. 其他命令
    * 监控相关（需要远程ssh登录到服务器）
        * 显示监控列表
            ```PM2_HOME='/opt/platformdev/.pm2' pm2 list```
            ```PM2_HOME='/opt/platform/.pm2' pm2 list```
        * 显示cpu、内存状况
            ```pm2 monit```
        * 显示实时日志或N条日志
            ```pm2 logs app [—lines 1000]```
        * 显示指定的监控详情
            ```pm2 show [id/name]```
        * 结束进程
            * 结束指定进程
                ```pm2 delete [id/name]```
            * 结束全部进程
                ```pm2 delete all```
        * [更多命令](https://www.douban.com/note/314200231/)    