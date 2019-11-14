#!/usr/bin/env node

/**
 * Module dependencies.
 */




class ValueSample {
    constructor(name, period, funct) {
        this.name = name;
        this.period = period;
        this.funct = funct;
        this.value = null;
        this.t = 0;
        this.timer_id = null;
        this.onChanged = function(ValueSample) {};
    }

    start() {
        if(this.timer_id)
            this.stop();

        this.timer_id = setInterval(()=>{this._update()}, this.period)
    }
    stop() {
        clearInterval(this.timer_id);
        this.timer_id = null;
    }

    _update() {
        this.t += this.period;
        this.value = this.funct(this.t);
        this.onChanged(this);
    }
}


let KeyNameConverter = require("./KeyNameConverter");
let RedisListener = require("./RedisListener");
let value_names = require('./values.json');

class Sampler {
    constructor() {
        this.key_name_converter = new KeyNameConverter();
        this.redis_listener     = new RedisListener( {host:"value_host", port: 6379});
        this.values = [];
        this.initValues();
    }


    initValues() {
        value_names.forEach( (record, index) => {
            let func = function(t) {
                let k = t / 1000 * Math.PI * 2;
                let offset = index / 100 * Math.PI*2;
                return Math.sin( k / 20  + offset ) * 25;
            };
            let value = new ValueSample( record[0], record[1], func);
            value.onChanged = (value)=>{this.onValueChange(value)};
            this.values.push( value );
        });
    }

    start() {
        this.values.forEach( (value) => {
            value.start();
        });
    }
    /**
     * @param value ValueSample
     */
    onValueChange(value) {
        let redis_key_name = this.key_name_converter.getRedisKeyName(value.name);
        if(!redis_key_name) {
            console.log("Can not convert ", value.name);
            return;
        }

        //console.log("Set value ", redis_key_name, value.value);
        this.redis_listener.doSetValue(redis_key_name, value.value);
    }


}

let app = new Sampler();
app.start();
