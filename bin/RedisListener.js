
/**
 * Module dependencies.
 */
let redis = require("redis");

const CHANNEL_KEY_EVENT = "__keyevent@0__:";
const CHANNEL_SET       = CHANNEL_KEY_EVENT+"set";
const CHANNEL_EXPIRED   = CHANNEL_KEY_EVENT+"expired";
const CHANNEL_DEL       = CHANNEL_KEY_EVENT+"del";

class RedisListener {
    constructor(connection_config, on_value_fetched) {
        this.m_redis_client_poller = this._setupRedisConnection(connection_config);
        this.m_redis_client_listener = this._setupRedisConnection(connection_config);
        this.m_key_template = "volatile:*:value";
        this.onValueFetched = on_value_fetched || function(name,value) {
            console.log("onValueFetched ", name, "=|"+value+"|");
        };

        this.onValueChanged = this.onValueFetched;
        this.onValueDeleted = this.onValueFetched;
    }

    /**
     * iterate over all values
     * @param cb_done function(err,res)
     * @param cb_fetch function(name,value)
     */
    doFetchAll(cb_done, cb_fetch) {
        cb_done = cb_done || (()=>{});
        cb_fetch = cb_fetch || this.onValueFetched;
        // TODO use Promise to clean code
        this.m_redis_client_poller.keys(this.m_key_template, (err,key_array) => {
            if(err)
                return;
            if (!Array.isArray(key_array))
                return;
            let processed_count = 0;
            key_array.forEach( (key_name) => {
                let short_key = this.convertFullKeyToShort(key_name);
                if(short_key === undefined) {
                    console.warn("can not convert to short key ", key_name );
                    return;
                }

                processed_count++;
                this._getValue(key_name, (err,key_value) => {
                    if(!err)
                        cb_fetch(short_key, key_value);
                    processed_count--;
                    if(processed_count<=0)
                        cb_done(null, {});
                })
            } );
        });
    }


    doSetValueEx(key_name, value, ttl, cb) {
        this.m_redis_client_poller.setex(this.convertShortKeyToFull(key_name), ttl, value , cb);
    }

    doSetValue(key_name, value, cb) {
        this.m_redis_client_poller.set(this.convertShortKeyToFull(key_name), value , cb);
    }


    doGetValue(key_name, cb) {
        //let key = this.convertFullKeyToShort(key_name);
        //if(key === undefined)
        //    cb(Error("Connot convert key name"));
        this._getValue(this.convertShortKeyToFull(key_name),cb )
    }

    convertFullKeyToShort(key_name) {
        if(!key_name.startsWith("volatile:") || !key_name.endsWith(":value"))
            return undefined;

        const PREFIX_LEN = 9;
        const POSTFIX_LEN = 6;
        let len = key_name.length -  PREFIX_LEN - POSTFIX_LEN;
        return key_name.substr(PREFIX_LEN , len );
    }

    convertShortKeyToFull(key_name) { return "volatile:" + key_name + ":value"; }

    runListener() {
        let db = this.m_redis_client_listener;

        db.on("message", (channel, key_name) => {
            //console.log(channel, key_name);

            let short_key = this.convertFullKeyToShort(key_name);
            if(short_key === undefined) {
                console.warn("can not convert to short key ", key_name );
                return;
            }

            if(channel == CHANNEL_SET) {
                this._getValue(key_name, (err, value) => {
                    if(err)
                        return;
                    this.onValueChanged(short_key, value);
                });
            } else if(channel == CHANNEL_EXPIRED || channel == CHANNEL_DEL) {
                this.onValueDeleted(short_key, null);
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

    _getValue(key_name, cb) {
        this.m_redis_client_poller.get(key_name, cb);
    }
}

module.exports = RedisListener;
