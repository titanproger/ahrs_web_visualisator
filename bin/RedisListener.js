
/**
 * Module dependencies.
 */

// let redis = require("redis");
let redis = require('redis-promisify')
let EventEmitter = require('events')

const CHANNEL_KEY_EVENT = "__keyevent@0__:";
const CHANNEL_SET       = CHANNEL_KEY_EVENT+"set";
const CHANNEL_EXPIRED   = CHANNEL_KEY_EVENT+"expired";
const CHANNEL_DEL       = CHANNEL_KEY_EVENT+"del";

// TODO refactor redis listener to separate npm 

class RedisListener extends EventEmitter {
    static EVENT_FETCHED = "fetched";
    static EVENT_CHANGED = "changed";
    static EVENT_DELETED = "deleted";

    constructor(connection_config) {
        super();
        // We need two redis connection
        // for value fetching        
        this.m_redis_client_poller   = this._setupRedisConnection(connection_config);
        // for subscribe update events
        this.m_redis_client_listener = this._setupRedisConnection(connection_config);                
    }

    onValueFetched(name,value) {        
        this.emit(RedisListener.EVENT_FETCHED, {name,value})
    }
    onValueChanged(name,value) {        
        this.emit(RedisListener.EVENT_CHANGED, {name,value});    
    }
    onValueDeleted(name) {
        this.emit(RedisListener.EVENT_DELETED, {name});    
    }
    /**     
     * iterate over all values     
     * @param cbEach function(name,value)
     */
    async doFetchAll(template = "*", cbEach = undefined) {
        cbEach = cbEach || ((name,value)=>this.onValueFetched(name,value));        
        let key_array = await this.m_redis_client_poller.keysAsync(template);        
        if (!Array.isArray(key_array))
            return;
        let processed_count = 0;
        return Promise.all( 
            key_array.map(async(key_name) => { 
                let short_key = this.convertRedisKeyToLocalKey(key_name);
                if(short_key === undefined)                     
                    return;                
                let key_value = await this._getValue(key_name);
                cbEach(short_key, key_value);
            })                       
        );        
    }


    async doSetValueEx(key_name, value, ttl) {
        if(ttl==0)
            return this.doDelValue(key_name);
        return this.m_redis_client_poller.setexAsync(this.convertLocalKeyToRedisKey(key_name), ttl, value);
    }

    async doSetValue(key_name, value) {
        return this.m_redis_client_poller.setAsync(this.convertLocalKeyToRedisKey(key_name), value);
    }

    async doGetValue(key_name) {
        return this._getValue(this.convertLocalKeyToRedisKey(key_name))
    }

    async doDelValue(key_name) {
        return this.m_redis_client_poller.delAsync(this.convertLocalKeyToRedisKey(key_name));        
    }

    convertRedisKeyToLocalKey(key_name) { return key_name; }
    convertLocalKeyToRedisKey(key_name) { return key_name; }

    runListener() {
        let db = this.m_redis_client_listener;

        db.on("message", async (channel, key_name) => {
            let short_key = this.convertRedisKeyToLocalKey(key_name);
            if(short_key === undefined)                 
                return;                    
            if(channel == CHANNEL_SET) {
                let value = await this._getValue(key_name);                    
                this.onValueChanged(short_key, value);                
            } else if(channel == CHANNEL_EXPIRED || channel == CHANNEL_DEL) {                    
                this.onValueDeleted(short_key);
            }
        });

        db.subscribe([CHANNEL_EXPIRED, CHANNEL_SET, CHANNEL_DEL]);
    }
    /**
     * @param config { }
     * @returns RedisClient
     * @private
     */
    _setupRedisConnection(config) {
        let connection = redis.createClient(config);
        connection.on("error", (err) => { console.log("Error " + err);});
        return connection;
    }

    async _getValue(key_name) {
        return this.m_redis_client_poller.getAsync(key_name);
    }
}

module.exports = RedisListener;
