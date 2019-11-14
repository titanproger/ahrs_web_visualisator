
let g_known_names = require('./values.json');


const COL_ID_VALUE_NAME = 0;
const COL_ID_LIFE_TIME = 1;
const COL_ID_REDIS_KEY = 2;

const KEY_EXTRA_PREFIX = "extra:";
const KEY_EXTRA_PREFIX_LEN  = 6;

class KeyNameConverter  {
    constructor(known_names) {
        this.known_names = known_names || g_known_names;
    }

    /**
     * @param value_name String
     * @returns {*}
     */
    getRedisKeyName(value_name) {
        let elem = this.__findRecord({name: value_name});
        return (elem)? elem[COL_ID_REDIS_KEY] : KEY_EXTRA_PREFIX+value_name;
    }

    /**
     * @param key_name String
     * @returns {*}
     */
    getValueName(key_name) {
        let elem = this.__findRecord({key: key_name});
        if(elem)
            return elem[COL_ID_VALUE_NAME];
        if(key_name.startsWith(KEY_EXTRA_PREFIX))
            return key_name.substr(KEY_EXTRA_PREFIX_LEN);
        return undefined;
    }

    /**
     * @param criteria Object {
     *    name: String,
     *    key: String,
     * }
     * @returns {*}
     * @private
     */
    __findRecord(criteria) {
        return this.known_names.find( (el) => {
            return (criteria.name && el[COL_ID_VALUE_NAME] == criteria.name)
                || (criteria.key && el[COL_ID_REDIS_KEY] == criteria.key)
        });
    }
}

module.exports = KeyNameConverter;