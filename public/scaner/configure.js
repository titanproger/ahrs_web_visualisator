
//! authors : Pronin E
//! license : MIT
//! https://github.com/titanproger/ahrs_web_visualisator

var sensor_data;
let img_front;
let img_top;
let img_side;
let img_aim;
let min_side;

var noSleep = new NoSleep();
var m_screen_locked = false;

function mouseClicked()
{
    m_screen_locked = true;
    noSleep.enable();
}

var socket;

var last_message = "";
var last_message_time = 0;
var last_message_time_max = 5;
var messages = [];

function addButton (name, x, y,w,h, on_click) {
    let button = createButton(name);
    button.position(x, y);
    button.mousePressed(on_click);
    button.size( w, h);
    return button;
}


var values = { };


function createSenderForm() {

    let input_key_code,input_key_value,button, greeting;
    let input_key_ttl;


    let x = 0;
    let y = 0;

    let h = 50
    let w = 100;
    let m_y = 8;
    //y-=(h+m_y);

    addButton("Wifi Spot OFF", x, y+=h+m_y,w,h, ()=>{
        let ok = confirm("TURN off spot wifi?");
        if(!ok) 
            return;            
        socket.emit( "configure" , {cmd: "spotOff"}, (e,r) => {
            if(e)
                return alert("failed");
                
            alert("result = "+ JSON.stringify(r));
        } );        
    }) 
    addButton("Wifi Spot ON", x, y+=h+m_y,w,h, ()=>{
        let ok = confirm("ENABLE WIFI SPOT ?");
        if(!ok) 
            return;
        socket.emit( "configure" , {cmd: "spotOn"}, (e,r) => {
            if(e)
                return alert("failed");
            alert("result = "+ JSON.stringify(r));
        } );
    }) 

    addButton("Simulation ON", x, y+=h+m_y,w,h, ()=>{
        socket.emit( "valueSet" , {
            code: "EMULATION_OFF",
            value: 1,
            ttl: 0
        });
    })   

    addButton("Simulation OFF", x, y+=h+m_y,w,h, ()=>{
        socket.emit( "valueSet" , {
            code: "EMULATION_OFF",
            value: 1,
            ttl: 60*60
        });
    })    

    
    addButton("Record start ", x, y+=h+m_y,w,h, ()=>{
        socket.emit( "recordSet" , {
            enable: true            
        });
    }) 

    addButton("Record stop", x, y+=h+m_y,w,h, ()=>{
        socket.emit( "recordSet" , {
            enable: false            
        });
    }) 
    
    addButton("replay start ", x, y+=h+m_y,w,h, ()=>{
        socket.emit( "replaySet" , {
            enable: true            
        });
    }) 

    addButton("replay stop", x, y+=h+m_y,w,h, ()=>{
        socket.emit( "replaySet" , {
            enable: false            
        });
    }) 
}


function setup() {
  // put setup code here
    min_side = min(windowWidth, windowHeight);

    let cnv = createCanvas(windowWidth, windowHeight);
    //let cnv = createCanvas(min_side, min_side);
    cnv.style('display', 'block');
    background(255);
    frameRate(30);

    img_front = loadImage("../glass/images/front.png");
    img_aim   = loadImage("../glass/images/aim.png");
    img_top   = loadImage("../glass/images/top.png");
    img_side  = loadImage("../glass/images/side.png");

    socket = io();

    socket.on('value', function(msg){
        onValue(msg.code, msg.value)
    });

    socket.on('valueBundle', function(msg){
        //console.log("on valueBundle", msg)
        msg.values.forEach(msg => onValue(msg.code, msg.value) );        
    });

    socket.on('valueDel', function(msg){
        onValueDel(msg.code)
    });

    //socket.on('ahrs_msg', function(msg){ messages.push(msg); last_message = msg;  last_message_time = last_message_time_max; });


    socket.on('disconnect', () => {
    });

    let w = min_side / 10;
    let h = min_side / 20;
    let x = windowWidth - w;
    let y = -h;

    addButton('Full screen' , x, y+=h, w,h, () => {  if (screenfull.enabled) screenfull.request();}  )
    createSenderForm();
}


function onValue(name,value) {
    values[name] = value;
}

function onValueDel(name) {
    delete values[name];
}

function keyPressed() {
    console.log(keyCode);
}


function windowResized() {
    min_side = min(windowWidth, windowHeight);
    //resizeCanvas(min_side, min_side);
    resizeCanvas(windowWidth, windowHeight);
}

function draw() {            
    background(255);    
    showNotice(socket.connected ? "online" : "offline");    
}


function showNotice (msg) {
    textAlign(CENTER);
    textSize(64);
    fill(128,64,64);
    text( msg , width/2, height/2 );
}
