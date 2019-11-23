let KeyNameConverter = require("./KeyNameConverter");
let RedisListener = require("./RedisListener");


const MESSAGE_VALUE_CHANGED = "value";
const MESSAGE_VALUE_DELETED = "valueDel";
const MESSAGE_VALUE_SET     = "valueSet";


class Application {
    constructor(socket_io) {
        this.key_name_converter = new KeyNameConverter();
        this.redis_listener     = new RedisListener( {host:"value_host", port: 6379});
        this.values = {};           
        this.io = socket_io;
        this.io.on('connection', (socket) => (this._onSocketConnected(socket)));
        
        this.redis_listener.onValueChanged = (key_name, value ) =>  {
            this._convertKeyToCode(key_name, value, (code,value) => {
                if(!this._isValueValid(value))
                    return;

                this.values[code] = value;    
                this.emitChanged(code, value)                  
            });
        };
        this.redis_listener.onValueDeleted = (key_name, value ) => {
            this._convertKeyToCode(key_name, value, (code,value) => {                
                this.values[code] = undefined
                this.emitDeleted(code);                
            });
        };        
    }

    emitDeleted(code)        { 
        this.io.emit(MESSAGE_VALUE_DELETED, {code}) 
        this.emit(MESSAGE_VALUE_DELETED, {code}) 
    }
    emitChanged(code, value) { 
        this.emit(MESSAGE_VALUE_CHANGED, {code, value});
        this.io.emit(MESSAGE_VALUE_CHANGED, {code, value})
    }

    localGetString(name) {
        return this.values[name];
    }
    localGetFloat(name) {
        return Number.parseFloat(this.values[name]);
    }
    localGetInt(name) {
        return Number.parseInt(this.values[name]);
    }

    run() {
        this.redis_listener.runListener();

        this.redis_listener.doFetchAll(null, (key_name, value )=> {
            try {
                this._convertKeyToCode(key_name, value, (code,value) => {
                    if(this._isValueValid(value))
                        this.values[code] = value
                });
            } catch(e) {
                //console.log(e);                        
            }
        });
    }   

    _onSocketConnected(socket) {
        console.log('a user connected');        
        socket.on('disconnect',() => console.log('user disconnected'));        
        socket.on(MESSAGE_VALUE_SET, (data, cb) => {            
            let promise = this.setValue(data.code,data.value, data.ttl);
            if(typeof(cb) !== "function")
                return;

            promise.then((r) => cb(null, r))
                .catch((e) => cb(e));                                
        });
    
        for( let code in this.values) {
            let value = this.values[code];
            this.emitChanged(code, value);
        }
    }
    

    _convertKeyToCode(key_name, value, cb) {                
        let code = this.key_name_converter.getValueName(key_name);
        if(code === undefined) {
            throw new Error("not get code for key ", key_name);            
            return;
        }
        cb(code, value);
    }
    
    getValue(name) {
        return new Promise((resolve, reject) => {
            let redis_key_name = this.key_name_converter.getRedisKeyName(name);            
            this.redis_listener.doGetValue(redis_key_name, (e,r)=> {
                return e ? reject(e): resolve(r)
            });
        });
    }
    setValue(name,value, ttl) {
        return new Promise((resolve, reject) => {
            let redis_key_name = this.key_name_converter.getRedisKeyName(name);            
            this.redis_listener.doSetValueEx(redis_key_name, value, ttl, (e,r)=> {
                return e ? reject(e): resolve(r)
            });
        });
    }
    _isValueValid(value) {
        return value !== null && value !== "null";
    }   
}

var ee = require('event-emitter');
ee(Application.prototype);

module.exports = Application;