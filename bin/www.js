#!/usr/bin/env node

/**
 * Module dependencies.
 */

var app = require('../app');
var debug = require('debug')('glass-view-2:server');
var http = require('http');

let Application = require('./application');

/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

/**
 * Create HTTP server.
 */

var server = http.createServer(app);

let io = require('socket.io')(server);

let application = new Application(io);
application.run();


var navigationUpdateInProgress = false;
application.on("value", async (data) => {
    let code = data.code;
    let value = data.value;
    if(code == "LAT"|| code == "LONG" || code == "NEXTLAT" || code == "NEXTLONG" || code == "HEAD") {
        if(navigationUpdateInProgress)
            return;
        navigationUpdateInProgress = true;
        await UpdateNavigation();
        navigationUpdateInProgress = false;
    }    
});

let LatLon = require('./3dparty/latlon');
let Dms = require("./3dparty/dms.js");

async function UpdateNavigation() {
    let lat = application.localGetFloat("LAT");    
    let long = application.localGetFloat("LONG");    
    let next_lat = application.localGetFloat("NEXTLAT");    
    let next_long = application.localGetFloat("NEXTLONG");    
    let heading = application.localGetFloat("HEAD");    
    let course  = application.localGetFloat("NEXTCOURSE");    
    
    let p_plane = new LatLon(lat,long);
    let p_target = new LatLon(next_lat,next_long);                    
    
    let distance = p_plane.distanceTo(p_target)
    //let bearing  = p_plane.initialBearingTo(p_target)
    let bearing  = p_plane.finalBearingTo(p_target)
    
    let devangle = Dms.wrap180(course - bearing);
    let deviation = distance * Math.sin( devangle.toRadians() )

    // console.log("head = ", heading);
    // console.log("bearing = ", bearing);
        
    let ttl = 5;
    await Promise.all( [
        application.setValue("DISTANCE", distance, ttl),
        application.setValue("BEARING", bearing, ttl),
        application.setValue("DEVANGLE", devangle, ttl),
        application.setValue("DEVIATION", deviation, ttl)
    ]);    

}



/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);
function normalizePort(val) {
  let port = parseInt(val, 10);
  if (isNaN(port)) { return val; }
  if (port >= 0) { return port; }
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
    valueSet: async (params, cb)  => {
        try {
            r = await application.setValue(params.code, params.value, params.ttl);
            cb(null, r);               
        }  catch (err) {
            console.warn("Exception on value set", err);
            cb(err);
        }
    },
    valueGet : async (params, cb) => {
        try {
            r = await application.getValue(params.code);
            cb(null, r);            
        }  catch (err) {
            console.warn("Exception on value get", err);
            cb(err);
        }
    },
    valueGetAll : async (params, cb) => {
        cb("Not supported");
    }
});

let json_rpc_port = port+1;
ValueJsonRpcServer.http().listen(json_rpc_port,  ()  => {
    console.log('Listening json_rpc port on *:'+json_rpc_port);
});





