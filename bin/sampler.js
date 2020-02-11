#!/usr/bin/env node

/**
 * Module dependencies.
 */
let LatLon = require('./3dparty/latlon');

class ValueSample {
    constructor(parent, name, period, funct) {
        this.parent = parent;
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

        if(this.period > 0)
            this.timer_id = setInterval(()=>{this._update()}, this.period)
    }
    stop() {
        if(this.timer_id)
            clearInterval(this.timer_id);
        this.timer_id = null;
    }

    _update() {
        this.t += this.period;
        this.value = this.funct(this.t, this);
        this.onChanged(this);
    }
}


let KeyNameConverter = require("./KeyNameConverter");
let RedisListener = require("./RedisListener");
let value_names = require('./values_samples.js');


class Sampler {
    constructor() {
        this.key_name_converter = new KeyNameConverter();
        this.redis_listener     = new RedisListener( {host:"value_host", port: 6379});
        this.values = [];
        this.enable = true;
        this.initValues();
    }


    initValues() {
        value_names.forEach( (record, index) => {
            let func_default = ((t) => {
                let k = t / 1000 * Math.PI * 2;
                let offset = index / 100 * Math.PI*2;
                return Math.sin( k / 20  + offset ) * 25;
            });
            //console.log(record[0]);
            let func = record[2] || func_default;
            let value = new ValueSample( this, record[0], record[1], func);
            value.onChanged = (value)=>{this.onValueChange(value)};
            this.values.push( value );
        });
    }

    start() {
        this.values.forEach( (value) => {
            value.start();
        });

        let dt = 1;
        setInterval( ()=> {
            this.updateEnable(dt)
            this.updateGeo(dt);
        }, dt * 1000)
    }

    async updateEnable(dt) {
        try {
            let disable = await this.getValue("EMULATION_OFF");
            this.enable = !disable;               
        } catch(err) {
            console.log("error", err);
        }
    }

    async updateGeo(dt) {
        try {
            if(!this.enable)
                return;
                
            let [lat, long, speed_kmh, track] = await Promise.all([
                this.getValue("LAT"), 
                this.getValue("LONG"),
                this.getValue("GS"),
                this.getValue("TRACK")
            ]);            
            lat = Number.parseFloat(lat);
            long = Number.parseFloat(long);
            speed_kmh = Number.parseFloat(speed_kmh); 
            track = Number.parseFloat(track); 
            
            let p1 = new LatLon(lat,long);                    
            let speed_ms = speed_kmh / 3.6;
            let distance = speed_ms * dt;            
            p1 = p1.destinationPoint( distance , track );
            
            await Promise.all( [
                this.setValue("LAT", p1.lat),
                this.setValue("LONG", p1.lon),
            ]);                   
        } catch(err) {
            console.log("error", err);
        }

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

        if(!this.enable)
            return;

        //console.log("Set value ", redis_key_name, value.value);
        this.redis_listener.doSetValue(redis_key_name, value.value);
    }

    getValue(name) {
        return new Promise((resolve, reject) => {
            let redis_key_name = this.key_name_converter.getRedisKeyName(name);
            if(!redis_key_name)
                throw  Error("Can not convert ", name);
            this.redis_listener.doGetValue(redis_key_name, (e,r)=> {
                return e ? reject(e): resolve(r)
            });
        });
    }
    setValue(name,value) {
        return new Promise((resolve, reject) => {
            let redis_key_name = this.key_name_converter.getRedisKeyName(name);
            if(!redis_key_name)
                throw  Error("Can not convert ", name);
            this.redis_listener.doSetValue(redis_key_name, value, (e,r)=> {
                return e ? reject(e): resolve(r)
            });
        });
    }
}

let app = new Sampler();
app.start();
