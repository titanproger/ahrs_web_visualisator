
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


    let x = windowWidth - 200;
    let y = 80;

    //let link = createElement('a', );

    greeting = createElement('h3', 'key <br> value <br> TTL (sec) ');
    greeting.position(x - 100, y -10);
    input_key_code = createInput();
    //input_key_code.position(x, greeting.y + greeting.height + 32);
    input_key_code.position(x, y);
    input_key_code.value("NEXTCOURSE");
    input_key_code.label

    input_key_value = createInput();
    input_key_value.position(x, input_key_code.y+ input_key_code.height + 8);
    input_key_value.value("90");

    input_key_ttl = createInput();
    input_key_ttl.position(x, input_key_value.y + input_key_value.height + 8);
    input_key_ttl.value("9999999");

    button = createButton('send');
    y = input_key_ttl.y+ input_key_ttl.height + 8
    button.position(x, y);
    button.mousePressed(()=> {
        const code = input_key_code.value();
        const value = input_key_value.value();
        const ttl = parseInt(input_key_ttl.value(), 10);

        ///////// отправка значения здесь
        socket.emit( "valueSet" , {
            code: code,
            value: value,
            ttl: ttl
        }, (e,r)=>{
            console.log("valueSet result e=", e,' r=',r);
        });
    });

    let button2 = createButton('sendBundle');
    y += button.height + 8;
    button2.position(x, y);
    button2.mousePressed(()=> {
        const code = input_key_code.value();
        const value = input_key_value.value();
        const ttl = parseInt(input_key_ttl.value(), 10);
        console.log("valueSetBundle");
        ///////// отправка значения здесь
        socket.emit( "valueSetBundle" , {
            values: [
                {
                    code: code,
                    value: value,
                    ttl: ttl
                },
                {
                    code: code+"2",
                    value: value+"2",
                    ttl: ttl
                },                
            ]            
        }, (e,r)=>{
            console.log("valueSetBoundle result e=", e,' r=',r);
        });
    });
    
    let h = 50
    let w = 100;
    let m_y = 8;

    
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

function showNotice (msg) {
    textAlign(CENTER);
    textSize(64);
    fill(128,64,64);
    text( msg , width/2, height/2 );
}

function getValue(code) {
    return values[code] === undefined ? 0 : values[code];
}
function getValueFloat(code) {
    return values[code] === undefined ? 0 : Number.parseFloat(values[code]);
}

function draw() {    
    if(m_screen_locked)
        background(255);
    else {
        background(128);
        showNotice("Press on screen");
    }

    // if(values.empty()) {
    //     showNotice("Connecting....");
    //     return;
    // }

    let ax = getValueFloat("ROLL");
    let ay = getValueFloat("PITCH");
    let az = getValueFloat("HEAD");

    let heading = getValueFloat("HEAD");
    let course = getValueFloat("NEXTCOURSE") || 0;
    let distance = getValueFloat("DISTANCE") || 0;
    let deviation = getValueFloat("DEVIATION") || 0;
    let devangle = getValueFloat("DEVANGLE") || 0;
    
    
    // put drawing code here
    //drawHorisont(ax, ay, az, width / 2, height /2 );


    drawCursor(width*0.5, height*0.75, ax, img_front, false,  ax, false);
    drawCursor(width*0.80, height*0.75, ay, img_side, ax> 90 || ax < - 90,  ay, false);
    drawHSI(width*0.20, height*0.75, heading, course, devangle, deviation, distance , img_top,  az, false);

    //drawHSI(width*0.80, height*0.5, az, img_top, false,  az, false);
    

    imageMode(CENTER);
    //image(img_aim, width/2, height/2 + img_aim.height/2, img_aim.width, img_aim.height);


    fill(200, 200, 200);
    drawGravityIndicator(width*0.5, height*0.5, 0, min_side * 0.06);
    fill(100, 200, 200);
    drawGravityIndicator(width*0.5, height*0.5, getValue("SLIP"), min_side * 0.03);

    drawTextIface();
}


function getAngleMark(angle) {
    if(angle === 0)
        return "N";
    if(angle === 45)
        return "NE";
    if(angle === 90)
        return "E";
    if(angle === 135)
        return "SE";
    if(angle  === 180)
        return "S";
    if(angle  === 225)
        return "SW";
    if(angle  === 270)
        return "w";
    if(angle  === 315)
        return "NW";
    return "";
}
function drawHorisont( roll, pitch, yaw, x,  y) {
    push(); // begin object
    translate(x, y);

    let hw = width * 2;
    let hh = height * 2;
    let mark_h = min_side * 0.1;
    //rectMode(CENTER);

    rotate(radians(-roll));

    let degrees_in_screen = 40;
    let pixels_per_degree = min_side / degrees_in_screen;
    translate(0, pitch * pixels_per_degree);

    push(); // begin object
    stroke(0);
    fill(0, 0, 0); // ground
    rect(-hw, -1, hw*2, 2);
    fill(128, 255, 128); // ground
    rect(-hw, 0 , hw*2, hh*2);
    pop(); // end of object

    noStroke();
    fill(0, 0, 0);
    let h = 100;
    textAlign(CENTER);
    let angle_step = 15;
    for(var ya = -360; ya <= +360 + 360; ya += angle_step) {
        let lx = (-yaw + ya) * pixels_per_degree;
        h=(ya % 45 === 0) ? mark_h : mark_h * 0.75;
        h=(ya % 90 === 0) ? mark_h * 1.25 : h;
        let w=(ya % 45 === 0) ? 2 : 1;

        push();
        translate(lx, 0);
        let  mark = getAngleMark((ya + 360) % 360);
        if(mark !== "") {
            textSize(min_side * 0.05);
            text(mark, 0, -h * 1.25);
        }

        //line(0, -h, 0, +h);
        //box(w, h*2, 1);
        rect(0,-h,w,h*2);
        pop();
    }


    textSize(min_side * 0.04);
    angle_step = 5;
    for(var ya = -80; ya <= 80; ya += angle_step) {
        let ly =  ya * pixels_per_degree;
        push();
        translate(0, -ly);
        let w=min_side * 0.1;

        if(ya%10 == 0) {
            w=min_side * 0.4;
            text(ya, -w/2, 0);
            text(ya, +w/2, 0);
        }


        rect(-w/2,0,w,1);
        pop();
    }

    pop(); // end of object
}
function drawCursor(x, y, angle, img,  flip,  angle_aim,  rev) {
    let d = min_side * 0.25;
    let w2 = d / 2;
    let h2 = d / 2;

    push(); // begin object
    translate(x, y);

    line(-w2, 0, +w2, 0);
    line(0, -h2, 0, +h2);

    rotate(radians(angle));
    if(angle - angle_aim > 2)
        fill(0,150,255,180);
    else if(angle - angle_aim < -2)
        fill(255,150,0,180);
    else
        fill(200,200,200,128);


    let el_d = d* 0.9;
    ellipseMode(CENTER);
    ellipse(0, 0, d, d);
    if (flip)
        scale(1, -1);
    image(img, 0, 0,el_d,el_d);


    let d2 = min_side * 0.02;

    push(); // begin aim indicator  
        if (flip)
            scale(1, -1);
        rotate(radians(-angle));
        translate(0, (rev?-1:1)*d / 2);
        fill(128, 128, 128);
        ellipseMode(CENTER);
        ellipse(0, 0, d2, d2);
    pop(); // end of object

    d2 *= 0.6;
    //draw aim
    push(); // begin aim indicator  
        rotate(radians(-angle_aim));
        translate(0, (rev?-1:1) * d / 2);
        fill(128, 255, 128);
        ellipseMode(CENTER);
        ellipse(0, 0, d2, d2);
    pop(); // end of object 

    pop(); // end of object

    let fh = min_side * 0.03;
    textAlign(CENTER);
    textSize(fh);
    fill(0, 0, 0);
    text(nf(angle, 3, 2), x, y += (d/2 + fh));

    fill(64, 0, 0);
    textSize(fh * 0.75);
    text(nf(Math.abs(angle - angle_aim), 3, 2), x, y + fh);
}

function drawGravityIndicator( x,  y,  angle,  d) {
    push(); // begin object
    translate(x, y);
    rotate(radians(angle));
    translate(0, y * 0.95);
    ellipseMode(CENTER);
    ellipse(0, 0, d, d);
    pop(); // end of object
}

function drawWithConstMatrix(func) {
    push(); // begin object
    func();
    pop();
}


function drawHSI(x, y, heading, course, devangle, deviation, distance, img,  angle_aim,  rev) {
    let d = min_side * 0.25;
    let w2 = d / 2;
    let h2 = d / 2;
    let fh = min_side * 0.03; // font height
    push(); // begin object
    translate(x, y);

    textAlign(CENTER, CENTER);
    
    textSize(fh);

    let gauge_scale = 2500;

    drawWithConstMatrix(function() {
        // повернуть на градуc heading
        rotate(-radians(heading));   
        
        let el_d = d* 0.9;
        fill(200,200,200,128);
        ellipseMode(CENTER);
        ellipse(0, 0, d, d);
        
        fill(0, 0, 0);
        text("N", 0, -h2);
        text("S", 0, h2);
        text("W", -w2, 0);
        text("E",  w2, 0);

        // нарисолвать шкалу 
        line(-w2, 0, +w2, 0);
        line(0, -h2, 0, +h2);

        drawWithConstMatrix(function() {
            // повернуть на COURSE
            rotate(radians(course)); 
            stroke(128,0,0);
            // нарисовать стрелку 
            drawWithConstMatrix(function() {
                let arrow_h = h2/10;
                let arrow_w = w2/10; 
                //translate(0, -h2 + h2/10);  
                beginShape();            
                fill(128,64,64);
                vertex(-arrow_w , -h2 + arrow_h);
                vertex(0, -h2 );
                vertex(+arrow_w , -h2 + arrow_h);
                endShape(CLOSE); 
                
                arrow_h/=2;
                arrow_w/=2;

                fill(128,128,0);                

                if(devangle > 90 || devangle < -90 )
                    scale(1,-1);

                let y = -h2 * 0.6;
                beginShape();            
                fill(128,0,0);
                vertex(-arrow_w ,  y + arrow_h);
                vertex(0        ,  y );
                vertex(+arrow_w ,  y + arrow_h);
                endShape(CLOSE);     

            });    
            drawWithConstMatrix(function() {
                let deviation_scaled = deviation / gauge_scale;
                if(deviation_scaled > 1 )
                    deviation_scaled = 1;
                if(deviation_scaled < -1 )
                    deviation_scaled = -1;
                translate(-deviation_scaled * w2, 0);                    
                fill(128,128,0);
                rect(-2, (-h2/2), 4, h2);
            });    
        });

    });

    

    //нарисовать самолетик    
    image(img, 0, 0, d* 0.2,d* 0.2);

    fill(0, 0, 0);
    y = h2 * 1.1;
    text("HEAD = " + nf(heading, 3, 2) + "°", 0, y+= fh);
    text("DST = " + nf(distance / 1000, 0, 1) + " km", 0, y+= fh);
    text("COURSE = " + nf(course, 3, 2) + "°", 0, y+= fh);

    pop(); // end of object
    
    // fill(64, 0, 0);
    // textSize(fh * 0.75);
    // text(nf(Math.abs(angle - angle_aim), 3, 2), x, y + fh);
}


function drawTextIface() {
    let y = 0;
    let x = 10;    
    let fhm = min_side * 0.02 * 0.6;
    let fhb = fhm * 1.5;
    let fhs = fhm * 0.75;
    let step = width / 4
    textAlign(LEFT);
    textSize(fhb);
    fill(50, 50, 50);


    var sortable = [];
    for (code in values) {
        let value = values[code];
        sortable.push({value,code });
    }
    sortable.sort((a,b) => (('' + a.code).localeCompare(b.code)));    

    sortable.forEach( (elem ) => {
        let code =  elem.code;      
        let value = elem.value;
        // пытаемся преобразовать в float
        let value_f = Number.parseFloat(value);
        if(!Number.isNaN(value_f))
            value = nf(value_f, 1,1);

        text(code + " = " + value, x, y+=fhb);

        if(y > height / 2) {
            x += step;
            y = 0;
        }        
    });


    // fill(0, 100, 0);
    // text("pitch " + nf(sensor_data.m_angles.y, 3, 2), x, y+=fhb);
    // fill(0, 0, 100);
    // text("yaw   " + nf(sensor_data.m_angles.z, 3, 2), x, y+=fhb);
    //
    // textSize(fhm);
    // fill(100, 0, 100);
    // text("roll err  " + nf(sensor_data.m_gyro_err.x, 1, 5), x, y+=fhb);
    // text("pitch err " + nf(sensor_data.m_gyro_err.y, 1, 5), x, y+=fhm);
    // text("yaw err   " + nf(sensor_data.m_gyro_err.z, 1, 5), x, y+=fhm);
    //
    // //y+= fhm;
    // fill(100, 100, 0);
    // text("beta " + nf(sensor_data.m_beta, 1, 5), x, y+=fhm);
    // text("zeta " + nf(sensor_data.m_zeta, 1, 5), x, y+=fhm);
    // text("neta " + nf(sensor_data.m_neta, 1, 5), x, y+=fhm);
    //
    //
    // x = width - 200;
    // y = 0;
    // // textSize(fhb);
    // // fill(100, 100, 100);
    // // text("mag.x " + sensor_data.m_mag_raw.x, x, y+=fhb);
    // // //fill(0, 100, 0);
    // // text("mag.y " + sensor_data.m_mag_raw.y, x, y+=fhb);
    // // //fill(0, 0, 100);
    // // text("mag.z " + sensor_data.m_mag_raw.z, x, y+=fhb);
    // //
    // // fill(100, 100, 100);
    // // text("acc.x " + sensor_data.m_acc.x, x, y+=fhb);
    // // //fill(0, 100, 0);
    // // text("acc.y " + sensor_data.m_acc.y, x, y+=fhb);
    // // //fill(0, 0, 100);
    // // text("acc.z " + sensor_data.m_acc.z, x, y+=fhb);
    //
    //
    // fill(100, 100, 0);
    // text("g " + nf(sensor_data.m_g, 1, 2), x, y+=fhb);
    // //text("a " +  nf(g_anlge_roll,1,2), x, y+=30);
    // text("overload " + nf(sensor_data.m_overload, 1, 1), x, y+=fhb);
    //
    // x = width/2 - 100;
    // y = 0;
    // fill(100, 0, 0);
    // text("temp " + sensor_data.m_temp, x, y+=fhb);
    // text("fps " + sensor_data.m_fps, x, y+=fhb);
    // text("time " + sensor_data.m_time, x, y+=fhb);
    //
    // //drawTextCommand();
    // textSize(fhb);
    // x = width / 2;
    // y = height /2 - 100;
    //
    //
    // var alpa = last_message_time / last_message_time_max * 255;
    // fill(128, 0, 0, alpa);
    // textAlign(CENTER);
    // y-=fhb*messages.length;
    // messages.forEach( function (item)  {
    //     text(item, x, y+=fhb );
    // });
    // if(last_message_time > 0)
    //     last_message_time -= 0.03;
    // else
    //     messages = [];
    //
    // // var alpa = last_message_time / last_message_time_max * 255;
    // // fill(128, 0, 0, alpa);
    // // textAlign(CENTER);
    // // text(last_message, x, y+=14 );
    // // last_message_time -= 0.03;
}