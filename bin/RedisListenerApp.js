let RedisListener = require("./RedisListener");



class RedisListenerApp extends RedisListener {

    static KEY_TEMPLATE = "volatile:*:value";

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
}

module.exports = RedisListenerApp;