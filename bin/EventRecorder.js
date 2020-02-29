
const { PassThrough, Writable } = require('stream');

class EventRecorder  {
    constructor() {                
        this.started = null;
        this.stream = new PassThrough();
        this.initRead();                
    }

    initRead() {
        this.streamInput = new PassThrough();
        this.inputBuffer = ""; 
        this.maxTime = 0;       
        this.streamInput.on("data", (data) => {
            let str = data.toString('utf8')
            this.inputBuffer+=str;   
            this.processInputBuffer();
        });

        
    }

    processInputBuffer() {        
        let lines = this.inputBuffer.split("\n");
        if(!lines || lines.length <= 0)
            return;
        let lastLine = lines.pop();
        if(lastLine.length && lastLine[lastLine.length] == '\n') {
            lines.push(); 
            lastLine = "";
        } 
            
        this.inputBuffer = lastLine;
        lines.forEach(element => {
            let el = JSON.parse(element);
            this.onRecord(el);
        }); 
                
        let ts = Math.trunc( Date.now());
        if(this.lastTsFire > ts) {
            this.streamInput.pause();
            setTimeout( ()=>{
                this.streamInput.resume();
            }, this.lastTsFire - ts)      
        }                    
    }

    play() {                
        this.started = null;
        this.lastTsFire = 0;
    }
    
    onRecord(record){
        let ts = Math.trunc( Date.now());
        if(!this.started)
            this.started = ts;

        let timeFromStart = ts - this.started;    
        let delta = record.ts - timeFromStart;        
        let tsFire = ts + delta;
        
        if(tsFire > this.lastTsFire) {
            this.lastTsFire = tsFire;
        }

        setTimeout(()=>{
            this.onEventFromRecord(record);
        }, delta > 0 ? delta : 0) 
    }

    onEventFromRecord(record) {
        console.log("record", record);
    }

    onEvent(event) {        
        let ts = Math.trunc( Date.now());                 
        if(!this.started)
            this.started = ts;
        event.ts = ts - this.started;
        this.lastRecordTime = event.ts;     
        this.stream.write(JSON.stringify(event)+'\n');
    }

    getRecordTime() { 
        return this.lastRecordTime
    }

    start() {        
        this.stream = new PassThrough();
        this.started = null;
    }

    stop() {
        this.started = null;        
        this.stream.end();
        this.streamInput.end();
    }            
}

module.exports = EventRecorder;