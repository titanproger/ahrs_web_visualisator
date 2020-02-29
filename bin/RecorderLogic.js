let EventRecorder = require("./EventRecorder");
const fs = require("fs");
const zlib = require('zlib')
const stream = require('stream');
const util = require('util');
const pipeline = util.promisify(stream.pipeline);

let app;

const MESSAGE_RECORD_SET            = "recordSet";
const MESSAGE_REPLAY_SET            = "replaySet";


const APP_EVENT_VALUE_CHANGED = "ValueChanged";
const APP_EVENT_VALUE_DELETED = "ValueDeleted";

const VALUE_NAME_REPLAY_TIME = "REPLAY_TIME";
const VALUE_NAME_REPLAY_NAME = "REPLAY_NAME";
const VALUE_NAME_RECORD_NAME = "RECORD_NAME";
const VALUE_NAME_RECORD_TIME = "RECORD_TIME";
const VALUE_NAME_EMULATION_OFF = "EMULATION_OFF";


let IGNORE_VALUES = [
    VALUE_NAME_REPLAY_TIME,
    VALUE_NAME_REPLAY_NAME,
    VALUE_NAME_RECORD_NAME,
    VALUE_NAME_EMULATION_OFF
];

//let LOG_FILENAME = "./logs/log.json";


let timerRecord = null;
async function recordStart(filename) {
    if(!app)
        return;

    recordStop();
    let recorder = new EventRecorder();
    app.on(APP_EVENT_VALUE_CHANGED,({code, value }) => { 
        if(IGNORE_VALUES.includes(code) )           
            return;
        recorder.onEvent({  n: "c", d: {code, value } });                                            
    })
    app.on(APP_EVENT_VALUE_DELETED,({code, value }) => {
        if(IGNORE_VALUES.includes(code) )           
            return;
        recorder.onEvent({  n: "d", d: {code} });
    })

    timerRecord = setInterval( ()=>{
        try {
        let recTime = recorder.getRecordTime() / 1000;
        app.setValue(VALUE_NAME_RECORD_TIME, recTime , 1);        
        } catch(e) {

        }
    },1000);

    

    let fstream = fs.createWriteStream(filename);        
    app.recorder = recorder;

    try {
        await pipeline(
            recorder.stream,
            zlib.createGzip(),
            fstream,               
        );
        console.log('Pipeline succeeded');
    } catch(e) {
        console.error('Pipeline failed', e);
    }
            
}

function recordStop() {        
    if(timerRecord) {
        clearInterval(timerRecord);
        timerRecord = null;
    }

    if(!app.recorder)
        return;
    app.recorder.stop();
    app.recorder = null;
    
}

async function replayStart(filename) {
    replayStop();
    let fstream = fs.createReadStream(filename);
    let recorder = new EventRecorder();
    
    recorder.onEventFromRecord = (record) => {                              
        if(record.n == 'c') // chagned
            app.onValueChanged(record.d.code, record.d.value);                       
        if(record.n == 'd')
            app.onValueDeleted(record.d.code);  
            
        app.setValue(VALUE_NAME_REPLAY_TIME, record.ts / 1000, 1);
    }

    recorder.play();
    app.recorder = recorder;
    try {
        await pipeline(
            fstream,
            zlib.createGunzip(),
            recorder.streamInput,                
        );
        console.log('Pipeline succeeded');
    } catch(e) {
        console.error('Pipeline failed', e);
    }   
}

function replayStop() {
    if(!app.recorder)
        return;
    app.recorder.stop();
    app.recorder = null;
}

module.exports = function RecorderLogic(application) {
    app = application;

    console.log("record logic inited");

    app.on(MESSAGE_RECORD_SET , async ({enable}) => {           
        console.log("record start", enable );         
        if(enable) {  
            let ts = new Date().toISOString();
            let filename = "./logs/record_"+ts+".json.gzip"
            app.setValue(VALUE_NAME_RECORD_NAME, filename, 999999);
            recordStart(filename);
        } else {                    
            recordStop();                    
            //app.delValue(VALUE_NAME_RECORD_NAME, "", 0);
            app.delValue(VALUE_NAME_RECORD_TIME, "", 0);
        }        
    });   

    app.on(MESSAGE_REPLAY_SET , async({enable}) => {                    
        console.log("replay start");         
        if(enable) {                                
            let filename = await app.getValue(VALUE_NAME_REPLAY_NAME);
            if(!filename) {
                filename = await app.getValue(VALUE_NAME_RECORD_NAME);
                await app.setValue(VALUE_NAME_REPLAY_NAME, filename, 999999);
            }            
            replayStart(filename);
        } else {
            replayStop();                    
            app.delValue(VALUE_NAME_REPLAY_NAME);
            app.delValue(VALUE_NAME_REPLAY_TIME);
            
        }        
    });  
    

}