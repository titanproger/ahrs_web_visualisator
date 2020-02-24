
const { PassThrough, Writable } = require('stream');

class EventRecorder  {
    constructor() {                
        this.started = null;
        this.stream = new PassThrough();
    }

    start() {
        this.stream = new PassThrough();
        this.started = null;
    }

    onEvent(event) {        
        let ts = Math.trunc( Date.now());                 
        if(!this.started)
            this.started = ts;
        event.ts = ts - this.started;     
        this.stream.write(JSON.stringify(event)+'\n');
    }

    stop() {
        this.started = null;        
        this.stream.end();
    }            
}

module.exports = EventRecorder;