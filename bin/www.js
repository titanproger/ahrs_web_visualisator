#!/usr/bin/env node

/**
 * Module dependencies.
 */

var app = require('../app');
var debug = require('debug')('glass-view-2:server');
var http = require('http');
let KeyNameConverter = require("./KeyNameConverter");
let RedisListener = require("./RedisListener");




/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

/**
 * Create HTTP server.
 */

var server = http.createServer(app);
var io = require('socket.io')(server);

let redis_listener = new RedisListener( );
let key_name_converter = new KeyNameConverter();

const MESSAGE_VALUE_CHANGED = "value";
const MESSAGE_VALUE_DELETED = "valueDel";
const MESSAGE_VALUE_SET     = "valueSet";

io.on('connection', function(socket){
    console.log('a user connected');
    socket.on('disconnect', function(){
        console.log('user disconnected');
    });

    socket.on(MESSAGE_VALUE_SET, (data, cb) => {
        try {
            doValueSet(data.code, data.value, data.ttl , cb);
        }  catch (er) {
            console.warn("Exception on value set", er);
        }
    });

    redis_listener.doFetchAll(null, (key_name, value )=> {
        ConvertKeyToCode(key_name, value, (code,value) => {
            isValueValid(value) && socket.emit(MESSAGE_VALUE_CHANGED, makeMessageValueChanged(code,value))
        });
    });
});

function doValueSet(code, value, ttl, cb) {
    let key = key_name_converter.getRedisKeyName(code);
    redis_listener.doSetValueEx(key,value, ttl, cb);
}

function doValueGet(code,cb) {
    let key = key_name_converter.getRedisKeyName(code);
    console.log("key = ", key);
    redis_listener.doGetValue(key,cb);
}

function doValueGetAll(cb) {
    let key = key_name_converter.getRedisKeyName(code);
    redis_listener.doGetValue(key,cb);
}



redis_listener.onValueChanged = function(key_name, value ) {
    ConvertKeyToCode(key_name, value, (code,value) => {
        isValueValid(value) && io.emit(MESSAGE_VALUE_CHANGED, makeMessageValueChanged(code,value))
    });
};

redis_listener.onValueDeleted = function(key_name, value ) {
    ConvertKeyToCode(key_name, value, (code,value) => {
        io.emit(MESSAGE_VALUE_DELETED, { "code": code })
    });
};

redis_listener.runListener();

function ConvertKeyToCode(key_name, value, cb) {
    let code = key_name_converter.getValueName(key_name);
    if(code === undefined) {
        console.warn("not get code for key ", key_name);
        return;
    }
    cb(code, value);
}

function isValueValid(value) {
    return value !== null && value !== "null";
}
function makeMessageValueChanged(code,value) {
    return {
        code: code,
        value: value
    };
}

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);
function normalizePort(val) {
  let port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}
function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}

////////////////////////////////////////////////////

let jayson = require('jayson');
let ValueJsonRpcServer = jayson.server( {
    valueSet: (params, cb)  => {
        try {
            doValueSet(params.code, params.value, params.ttl , cb);
        }  catch (err) {
            console.warn("Exception on value set", err);
            cb(err);
        }
    },
    valueGet : (params, cb) => {
        try {
            doValueGet(params.code, cb);
        }  catch (err) {
            console.warn("Exception on value get", err);
            cb(err);
        }
    },
    valueGetAll : (params, cb) => {
        cb("Not supported");
    }
});

let json_rpc_port = port+1;
ValueJsonRpcServer.http().listen(json_rpc_port,  ()  => {
    console.log('Listening json_rpc port on *:'+json_rpc_port);
});
