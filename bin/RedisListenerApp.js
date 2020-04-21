let RedisListener = require("./RedisListener");



class RedisListenerApp extends RedisListener {

    static KEY_TEMPLATE = "volatile:*:value";
    static KEY_BARO     = "ahrs:conrol_pressure_mmhg";

   // convert volatile:ahrs:acc:roll:value   ->  ahrs:acc:roll:
   convertRedisKeyToLocalKey(name) {
        if(!name.startsWith("volatile:") || !name.endsWith(":value"))
            return undefined;    
        const PREFIX_LEN = 9;
        const POSTFIX_LEN = 6;
        let len = name.length -  PREFIX_LEN - POSTFIX_LEN;
        return name.substr(PREFIX_LEN , len );
    }        
    // convert ahrs:acc:roll -> volatile:ahrs:acc:roll:value
    convertLocalKeyToRedisKey(name) { 
        return "volatile:" + name + ":value"; 
    }

    convertHPAtoMMHG(value) { return (value / 1013.25 ) * 760 }
    convertMMHGtoHPA(value) { return Math.round((value / 760) * 1013.25) }


    async doSetValueEx(key_name, value, ttl) {
        if(key_name == RedisListenerApp.KEY_BARO)
            value = this.convertHPAtoMMHG(parseFloat(value));

        return super.doSetValueEx(key_name, value, ttl);        
    }

    async doSetValue(key_name, value) {
        if(key_name == RedisListenerApp.KEY_BARO)
            value = this.convertHPAtoMMHG(parseFloat(value));
        return super.doSetValue(key_name, value);
    }

    async doGetValue(key_name) {        
        let value = await super.doGetValue(key_name);
        if(key_name == RedisListenerApp.KEY_BARO)
            value = this.convertMMHGtoHPA(parseFloat(value));
        return value
    }

    onValueFetched(name,value) { 
        if(name == RedisListenerApp.KEY_BARO)
            value = this.convertMMHGtoHPA(parseFloat(value));                
        this.emit(RedisListener.EVENT_FETCHED, {name,value})
    }
    onValueChanged(name,value) {
        if(name == RedisListenerApp.KEY_BARO) {
            value = this.convertMMHGtoHPA(parseFloat(value));                  
        }
        super.onValueChanged(name,value);
    }
    onValueDeleted(name) {
        this.emit(RedisListener.EVENT_DELETED, {name});    
    }
    
}

module.exports = RedisListenerApp;