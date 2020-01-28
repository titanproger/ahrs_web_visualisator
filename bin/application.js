let KeyNameConverter = require("./KeyNameConverter");
let RedisListener = require("./RedisListener");


const MESSAGE_VALUE_CHANGED         = "value";
const MESSAGE_VALUE_CHANGED_BUNDLE  = "valueBundle";
const MESSAGE_VALUE_DELETED         = "valueDel";
const MESSAGE_VALUE_SET             = "valueSet";
const MESSAGE_VALUE_SET_BUNDLE      = "valueSetBundle";



async function asyncCallback(cb, f) {
    if(!cb) {
        f();
        return;
    }

    try {
        cb(null, await f());
    } catch(err) {
        cb(err);
    }
}


class Application {
    constructor(socket_io) {
        this.key_name_converter = new KeyNameConverter();
        this.redis_listener     = new RedisListener( {host:"value_host", port: 6379});
        this.values = {};           
        this.io = socket_io;
        this.io.on('connection', (socket) => (this._onSocketConnected(socket)));
        
        this.redis_listener.onValueChanged = (key_name, value ) =>  {
            try {
                this._convertKeyToCode(key_name, value, (code, value) => {
                    if (!this._isValueValid(value))
                        return;

                    this.values[code] = value;
                    this.emitChanged(code, value)
                });
            } catch(e) {

            }
        };
        this.redis_listener.onValueDeleted = (key_name, value ) => {
            try {
                this._convertKeyToCode(key_name, value, (code,value) => {
                    this.values[code] = undefined
                    this.emitDeleted(code);
                });
            } catch(e) {

            }
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
    emitBundle(values) {
        let payload = {values};
        this.emit(MESSAGE_VALUE_CHANGED_BUNDLE, payload);
        this.io.emit(MESSAGE_VALUE_CHANGED_BUNDLE, payload);
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
            asyncCallback(cb,()=>this.setValue(data.code,data.value, data.ttl));            
        });

        socket.on(MESSAGE_VALUE_SET_BUNDLE, (data, cb) => {            
            asyncCallback(cb,()=>{
                let promises = [];
                data.values.forEach(data => {
                    promises.push(this.setValue(data.code,data.value, data.ttl) )
                });      
                return Promise.all(promises);               
            } );            
        });    
        
        for( let code in this.values) {
            let value = this.values[code];            
            this.emitChanged(code, value);
        }
        this.emitBundleAll();
    }    
    emitBundleAll() {
        let values = []
        for( const code in this.values) {
            const value = this.values[code];
            values.push({code, value});            
        }
        this.emitBundle(values);
    }
    _convertKeyToCode(key_name, value, cb) {                
        let code = this.key_name_converter.getValueName(key_name);
        if(code === undefined)
            throw new Error("not get code for key "+ key_name);
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