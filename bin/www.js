#!/usr/bin/env node

/**
 * Module dependencies.
 */

var app = require('../app');
var debug = require('debug')('glass-view-2:server');
var http = require('http');

let Application = require('./Application');

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


const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

var navigationUpdateInProgress = false;
var smartSkyInProgress = false;
application.on("value", async (data) => {
    let code = data.code;
    let value = data.value;
    switch (code) {
        case "LAT":                
        case "LONG":
        case "NEXTLAT":
        case "NEXTLONG":        
            if(navigationUpdateInProgress)
                return;
            navigationUpdateInProgress = true;
            await wait(100);
            await UpdateNavigation();
            navigationUpdateInProgress = false;
            break;
        case "SSKYUSED":
        case "SSKYDECL":
        case "SSKYLAT":
        case "SSKYLONG":
        case "SSKYCOURSE":
        //case "SSKYWPT":
            if(smartSkyInProgress)
                return;
            smartSkyInProgress = true;
            await wait(100);
            await UpdateSmartSky()
            smartSkyInProgress = false;
            break;
    }    
});

let LatLon = require('./3dparty/latlon');
let Dms = require("./3dparty/dms.js");
let ttl = 999999;
async function UpdateNavigation() {
    try {
        let lat = application.localGetFloat("LAT");    
        let long = application.localGetFloat("LONG");    
        let next_lat = application.localGetFloat("NEXTLAT");    
        let next_long = application.localGetFloat("NEXTLONG");    
        //let heading = application.localGetFloat("HEAD");    
        let course  = application.localGetFloat("NEXTCOURSE");

        if(Number.isNaN(lat) || Number.isNaN(long) || Number.isNaN(next_lat) || Number.isNaN(next_long) || Number.isNaN(course))
            return;

        let p_plane = new LatLon(lat,long);
        let p_target = new LatLon(next_lat,next_long);                    
        
        let distance = p_plane.distanceTo(p_target)
        //let bearing  = p_plane.initialBearingTo(p_target)
        let bearing  = p_plane.finalBearingTo(p_target)
        
        let devangle = Dms.wrap180(course - bearing);
        let deviation = distance * Math.sin( devangle.toRadians() )

        // console.log("head = ", heading);
        // console.log("bearing = ", bearing);
             
        await Promise.all( [
            application.setValue("DISTANCE", distance, ttl),
            application.setValue("BEARING", bearing, ttl),
            application.setValue("DEVANGLE", devangle, ttl),
            application.setValue("DEVIATION", deviation, ttl)
        ]);    
    } catch(e) {
        console.log(e);
    }
}

async function UpdateSmartSky() {
    let SSKYUSED = application.localGetInt("SSKYUSED");     
    if(SSKYUSED !== 1)
        return;

    let SSKYLAT = application.localGetFloat("SSKYLAT");    
    let SSKYLONG = application.localGetFloat("SSKYLONG");  
    let SSKYCOURSE = application.localGetFloat("SSKYCOURSE");  
    let SSKYWPT = application.localGetString("SSKYWPT");  
    let SSKYDECL = application.localGetFloat("SSKYDECL");

    if(Number.isNaN(SSKYLAT) || Number.isNaN(SSKYLONG) || Number.isNaN(SSKYCOURSE) || Number.isNaN(SSKYWPT) || Number.isNaN(SSKYDECL))
        return;

    await Promise.all( [
        application.setValue("NEXTWPT"   , SSKYWPT, ttl),
        application.setValue("NEXTCOURSE", SSKYCOURSE, ttl),
        application.setValue("NEXTLAT"   , SSKYLAT, ttl),
        application.setValue("NEXTLONG"  , SSKYLONG, ttl),
        application.setValue("NEXTDECL"  , SSKYDECL, ttl)
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





