#!/usr/bin/env node
"use strict";

var
	watchr = require('watchr'),
	resque = require('coffee-resque'),
	exec = require('child_process').exec,
	fs = require('fs');

// Dem globals.
var conf = {
	bindir: null,
	red: null,
	redis : {
		host : null,
		port : null
	},
	action : null
}

var fatal = function() {
	console.log('FATAL:', arguments);
	process.exit(1);
}

var usage = function() {
	fatal('usage: ./watchrque.js [<redishost:port>|</path/to/bin/dir>] <Class1>:<Queue1>:<Events>:<Directory1,...,DirectoryN>" ... <ClassN>:<QueueN>:<Events>:<Directory1,...,DirectoryN>');
}

var launch_watchrs = function(path, xclass, queue, events, onAction) {
	console.log('Watching:', path);
	watchr.watch({
		path: path,
		listeners: {
			change: function(changeType, filePath, fileCurrentStat, filePreviousStat) {
				if(events[changeType] !== true) {
					return;
				}
				console.log('WATCHR-EVENT:', {
					filename:filePath, path:path, class:xclass, queue:queue, events:events});
				onAction(xclass, queue, filePath, path, changeType);
			},
			error: function(err) {
				console.log('WATCHR ERROR:', err);
			}
		}
	});
}


var eventsToArray = function(abbrevs) {
	var events = {};
	for (var v in abbrevs) {
		var abbrev = abbrevs[v];
		if(abbrev == 'a') {
			events.create = true;
			events.update = true;
			events.delete = true;
			break;
		} else if(abbrev === 'c') {
			events.create = true;
		} else if(abbrev === 'd') {
			events.delete = true;
		} else if(abbrev === 'u') {
			events.update = true;
		}
	}
	return events;
}

var action = {
	exec : function(xclass, queue, filePath, path, changeType) {
		var cmd = conf.bindir+'/'+xclass+'/'+queue+" '"+xclass+"' '"+queue+"' '"+filePath+"' '"+path+"' '"+changeType+"'";
		console.log('EXEC:', cmd);
		exec(cmd, function(err, stdout, stderr) {
			if(err) {
				console.log('EXEC:', err);
			}
		});
	},
	resque : function(xclass, queue, filePath, path, changeType) {
		conf.red.enqueue(queue, xclass,
			[{filename:filePath,path:path,changetype:changeType}]);
	}
}


var resque_connector = function() {
	resque_connect();
}

var resque_connect = function() {

	conf.red = resque.connect({
		host: conf.redis.host,
		port: conf.redis.port
	});

	conf.red.redis.on('error', function(err) {
		fatal(err);
	});

	conf.red.redis.on('connect', function(err) {
		console.log('Connected to redis');
	});
}


var main = function(argc, argv) {
	var dir, onAction, stat;

	if(argc < 4) {
		usage();
	}

	if(argv[2][0] == '/') {
		try {
			stat = fs.statSync(argv[2]);
		} catch(err) {
			fatal('Bin directory must exist', err);
		}
		conf.bindir = argv[2];
		conf.action = onAction = action.exec;
	} else {
		var redis;
		redis = argv[2].split(':');

		if(redis.length < 2) {
			fatal('Please specify redis host & port: <host:port>');
		}

		conf.redis.host = redis[0];
		conf.redis.port = redis[1];

		resque_connector();
		conf.action = onAction = action.resque;
	}

	for(var k = 3; k < argc; k++) {
		var tokens = argv[k].split(':');
		if(tokens.length < 4) {
			fatal('Watch argument should be: <class:queue:eventtypes:directory1,...directoryN>');
		}
		var xclass = tokens[0];
		var queue = tokens[1];
		var events = tokens[2];
		var directories = tokens[3].split(',');

		for (var v in directories) {
			var directory = directories[v];
			launch_watchrs(directory, xclass, queue, eventsToArray(events), onAction);
		}
	}
}

main(process.argv.length, process.argv);
