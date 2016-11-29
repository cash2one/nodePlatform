module.exports = function(httpServer) {
	var io = require('socket.io').listen(httpServer);
	var child = require('child_process');

	var self = this;

	//WebSocket连接监听
	io.on('connection', function(socket) {
		//socket.emit('open');//通知客户端已连接

		// 打印握手信息
		console.log(socket.handshake);

		function sendPing() {
			self.pingCMD = child.spawn('sh', ['-c','']);
			self.pingCMD.stdout.on('data', function(data) {
				console.log('now emit pingresult')
				console.log(data.toString())
				socket.emit('pingresult', data.toString());
			});
			self.pingCMD.stderr.on('data', function(data) {
				console.log('now emit err pingresult')
				console.log(data.toString())
				socket.emit('pingresult', data);
			});
			self.pingCMD.on('exit', function(code) {
				console.log('child process exited with code ' + code);
			});


		}

		socket.on('stopping', function(code) {
			console.log('stoppingstopping ');
			self.pingCMD.kill();
		});

		socket.on('startping', function(msg) {
			console.log('now startping')
			sendPing();
		});

		// 对message事件的监听
		socket.on('message', function(msg) {
			console.log('now on message')
		});

		//监听出退事件
		socket.on('disconnect', function() {
			console.log('now on disconnect')
		});
	});
};