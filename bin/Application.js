let KeyNameConverter = require("./KeyNameConverter");
let RedisListenerApp = require("./RedisListenerApp");
let asyncCallback = require("./helpers/asyncCallback");

let EventRecorder = require("./EventRecorder");

const fs = require("fs");
const zlib = require('zlib')
const { pipeline } = require('stream');


const MESSAGE_VALUE_CHANGED         = "value";
const MESSAGE_VALUE_CHANGED_BUNDLE  = "valueBundle";
const MESSAGE_VALUE_DELETED         = "valueDel";
const MESSAGE_VALUE_SET             = "valueSet";
const MESSAGE_VALUE_SET_BUNDLE      = "valueSetBundle";



class Application {
    constructor(socket_io) {
        this.key_name_converter = new KeyNameConverter();                     
        this.redis_listener = this._initRedisListener({host:"value_host", port: 6379});        
        this.values = {};           
        this.io = socket_io;
        this.io.on('connection', (socket) => (this._onSocketConnected(socket)));  
        
        this._initEventRecorder();
    }

    _initRedisListener(redisConfig) {        
        let redisListener = new RedisListenerApp(redisConfig);
                        
        redisListener.on(RedisListenerApp.EVENT_FETCHED, async ({name, value}) =>  { try {                
            if (!Application._isValueValid(value))
                return;        
            let code =this._convertKeyToCode(name);
            this.emit("ValueFetched", {code, value});        
            this.values[code] = value;            
        } catch(e) {} });  

        redisListener.on(RedisListenerApp.EVENT_CHANGED, async ({name, value} ) =>  { try {                                                                           
            if (!Application._isValueValid(value))
                return;                
            this.onValueChanged(this._convertKeyToCode(name), value)                            
        } catch(e) {} });

        redisListener.on(RedisListenerApp.EVENT_DELETED, async ({name}) =>  { try {             
            this.onValueDeleted(this._convertKeyToCode(name));            
        } catch(e) {} });  

        redisListener.on("error", (e) => {
            console.log("Redis error ", e);
        });
        
        return  redisListener;            
    }


    _initEventRecorder() {
        let recorder = new EventRecorder();
        this.on("ValueChanged",({code, value }) => {            
            recorder.onEvent({  n: "c", d: {code, value } });                                    
        })
        this.on("ValueDeleted",({code, value }) => {
            recorder.onEvent({  n: "d", d: {code} });
        })
        
        let fstream = fs.createWriteStream("./logs/log.json");
                        
        pipeline(
            recorder.stream,
            zlib.createGzip(),
            fstream,
            (err) => {
                if (err) {
                console.error('Pipeline failed', err);
                } else {
                console.log('Pipeline succeeded');
                }
            }
        );
        


        this.recorder = recorder
    }

    onValueDeleted(code) {
        delete this.values[code];
        this.emit("ValueDeleted", {code});
        this.emitDeleted(code);
    }
    onValueChanged(code, value) { 
        this.values[code] = value;
        this.emit("ValueChanged", {code, value});
        this.emitChanged(code, value);        
    }

    emitDeleted(code, socket) {     
        let emit_object =  socket ? socket : this.io; 
        emit_object.emit(MESSAGE_VALUE_DELETED, {code}) 
    }
    emitChanged(code, value, socket) {         
        let emit_object =  socket ? socket : this.io;
        emit_object.emit(MESSAGE_VALUE_CHANGED, {code, value})
    }
    emitBundle(values ,socket) {
        let payload = {values};
        let emit_object =  socket ? socket : this.io;
        emit_object.emit(MESSAGE_VALUE_CHANGED_BUNDLE, payload);        
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

    async run() {
        this.redis_listener.runListener();            
        this.redis_listener.doFetchAll("volatile:*:value");
    }   

    _onSocketConnected(socket) {
        console.log('a user connected');        
        socket.on('disconnect',() => console.log('user disconnected'));        
        socket.on(MESSAGE_VALUE_SET, (data, cb) => {
            asyncCallback(cb,()=>this.setValue(data.code,data.value, data.ttl));            
        });

        socket.on(MESSAGE_VALUE_SET_BUNDLE, (data, cb) => {            
            asyncCallback(cb, ()=>{
                let promises = data.values.map(data => this.setValue(data.code,data.value, data.ttl));      
                return Promise.all(promises);
            } );            
        });    

        for( let code in this.values) 
            this.emitChanged(code, this.values[code], socket);        
        this.emitBundleAll(socket);
    }    
    emitBundleAll(socket) {
        let values = []
        for( const code in this.values) {
            const value = this.values[code];
            values.push({code, value});            
        }
        this.emitBundle(values, socket);
    }
    _convertKeyToCode(key_name) {                
        let code = this.key_name_converter.getValueName(key_name);
        if(code === undefined)
            throw new Error("not get code for key "+ key_name);
        return code;
    }
    _convertCodeToKey(code) {                
        return this.key_name_converter.getRedisKeyName(code);                    
    }
    async getValue(code) {                
        return this.redis_listener.doGetValue(this._convertCodeToKey(code))
    }
    async setValue(code,value, ttl) {        
        let redis_key_name = this._convertCodeToKey(code);
        return this.redis_listener.doSetValueEx(redis_key_name, value, ttl);
    }
    static _isValueValid(value) {
        return value !== undefined && value !== null && value !== "null";
    }   
}

var ee = require('event-emitter');
ee(Application.prototype);

module.exports = Application;