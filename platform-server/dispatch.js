var cfork = require('cfork');
var util = require('util');

var logManager = require('./dal/logger');
var log = logManager.getLogger('systemService');

cfork({
        exec: './app.js',
        limit: 60,
        count: 1
    })
    .on('fork', function(worker) {
        log.warn('[实例:%d] 新实例启动', worker.process.pid);
    })
    .on('disconnect', function(worker) {
        log.warn('[宿主:%s] 实例:%s disconnect, suicide: %s, state: %s.', process.pid, worker.process.pid, worker.suicide, worker.state);
    })
    .on('exit', function(worker, code, signal) {
        var exitCode = worker.process.exitCode;
        var err = new Error(util.format('实例 %s 挂了 (code: %s, signal: %s, suicide: %s, state: %s)',
            worker.process.pid, exitCode, signal, worker.suicide, worker.state));
        err.name = 'WorkerDiedError';
        log.error('[宿主:%s] 实例退出: %s', process.pid, err.stack);
    })
    .on('unexpectedExit', function(worker, code, signal) {
        log.error('守护进程捕获到的意外退出：'+code);
        log.error(signal);
    })
    .on('reachReforkLimit', function () {
        console.log('到达最大重启次数')
    });