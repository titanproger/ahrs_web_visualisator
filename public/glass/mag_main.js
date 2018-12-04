
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
function mouseClicked() {
    m_screen_locked = true;
    noSleep.enable();

    //todo send reset pitch roll
}

var socket;

var last_message = "";
var last_message_time = 0;
var last_message_time_max = 5;

function addButton (name, x, y,w,h, on_click) {
    let button = createButton(name);
    button.position(x, y);
    button.mousePressed(on_click);
    button.size( w, h);
    return button;
}

function setup() {

  // put setup code here
    min_side = min(windowWidth, windowHeight);

    let cnv = createCanvas(windowWidth, windowHeight);
    //let cnv = createCanvas(min_side, min_side);
    cnv.style('display', 'block');
    background(255);
    frameRate(30);


    img_front = loadImage("images/front.png");
    img_aim   = loadImage("images/aim.png");
    img_top   = loadImage("images/top.png");
    img_side  = loadImage("images/side.png");

    socket = io();
    // socket.on('chat message', function(msg){
    //     $('#messages').append($('<li>').text(msg));
    // });

    socket.on('ahrs', function(msg){ sensor_data = JSON.parse(msg); });

    socket.on('ahrs_msg', function(msg){  last_message = msg;  last_message_time = last_message_time_max; });


    socket.on('disconnect', () => {
        sensor_data = null;
    });

    let w = min_side / 10;
    let h = min_side / 20;
    let x = windowWidth - w;
    let y = -h;

    addButton('Full screen' , x, y+=h, w,h, () => {  if (screenfull.enabled) screenfull.request();}  );
    y+=h;
    addButton('Reset' , x, y+=h, w,h, () => { doCommand(E_CMD_CODE_RESET_PITCH_ROLL); });
    addButton('Calibrate' , x, y+=h, w,h, () => { doCommand(E_CMD_CODE_CALIBRATE_GYRO); });
    addButton('Boost' , x, y+=h, w,h, () => { doCommand(E_CMD_CODE_BOOST_FILTER); });
    y+=h;
    addButton('Gyr' , x, y+=h, w,h, () => { doCommand(E_CMD_CODE_TOGGLE_GYRO); });
    addButton('Acc' , x, y+=h, w,h, () => { doCommand(E_CMD_CODE_TOGGLE_ACC); });
    addButton('Mag' , x, y+=h, w,h, () => { doCommand(E_CMD_CODE_TOGGLE_MAG); });
    y+=h;
    addButton('Beta' , x, y+=h, w,h, () => { doCommand(E_CMD_CODE_CHANGE_BETA); });
    addButton('Zeta' , x, y+=h, w,h, () => { doCommand(E_CMD_CODE_CHANGE_ZETA); });
    addButton('Neta' , x, y+=h, w,h, () => { doCommand(E_CMD_CODE_CHANGE_NETA); });
    y+=h;
    addButton('Save' , x, y+=h, w,h, () => { doCommand(E_CMD_CODE_SAVE); });
    addButton('Load' , x, y+=h, w,h, () => { doCommand(E_CMD_CODE_LOAD); });
    addButton('Default' , x, y+=h, w,h, () => { doCommand(E_CMD_CODE_LOAD_DEFAULT); });
    y+=h;
    addButton('Debug' , x, y+=h, w,h, () => { doCommand(E_CMD_CODE_DEBUG_ACTION); });

}


function doCommand(code) {
    socket.emit('ahrs_cmd', code);
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

function draw() {


    if(m_screen_locked)
        background(255);
    else {
        background(128);
        showNotice("Press on screen");
    }

    if(sensor_data == null) {
        showNotice("Connecting....");
        return;
    }

    // put drawing code here
    drawHorisont(sensor_data.m_angles.x, sensor_data.m_angles.y,sensor_data.m_angles.z, width / 2, height /2 );


    drawCursor(width*0.5, height*0.75, sensor_data.m_angles.x, img_front, false,  sensor_data.m_filter_err.x, false);
    drawCursor(width*0.80, height*0.75, sensor_data.m_angles.y, img_side, sensor_data.m_angles.x > 90 || sensor_data.m_angles.x < - 90,  sensor_data.m_filter_err.y, false);
    drawCursor(width*0.20, height*0.75, sensor_data.m_angles.z, img_top, false,  sensor_data.m_filter_err.z, false);
    

    imageMode(CENTER);
    image(img_aim, width/2, height/2 + img_aim.height/2, img_aim.width, img_aim.height);


    fill(200, 200, 200);
    drawGravityIndicator(width*0.5, height*0.5, 0, min_side * 0.06);
    fill(100, 200, 200);
    drawGravityIndicator(width*0.5, height*0.5,  - sensor_data.m_filter_err.x, min_side * 0.03);
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

    if(sensor_data.m_beta == 0 && sensor_data.m_zeta == 0)
        fill(206, 130, 16); // ground
    else
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
    push(); // begin object
    translate(x, y);
    rotate(radians(angle));
    if(angle - angle_aim > 2)
        fill(0,150,255,180);
    else if(angle - angle_aim < -2)
        fill(255,150,0,180);
    else
        fill(200,200,200,128);
    let d = min_side * 0.25;
    let w2 = d / 2;
    let h2 = d / 2;

    ellipseMode(CENTER);
    ellipse(0, 0, d, d);
    if (flip)
        scale(1, -1);
    image(img, 0, 0,d *0.9,d*0.9);

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



function drawTextIface() {
    let y = 0;
    let x = 10;

    let fhm = min_side * 0.02;
    let fhb = fhm * 1.5;
    let fhs = fhm * 0.75;
    textAlign(LEFT);
    textSize(fhb);
    fill(100, 0, 0);
    text("roll    " + nf(sensor_data.m_angles.x, 3, 2), x, y+=fhb);
    fill(0, 100, 0);
    text("pitch " + nf(sensor_data.m_angles.y, 3, 2), x, y+=fhb);
    fill(0, 0, 100);
    text("yaw   " + nf(sensor_data.m_angles.z, 3, 2), x, y+=fhb);

    textSize(fhm);
    fill(100, 0, 100);
    text("roll err  " + nf(sensor_data.m_gyro_err.x, 1, 5), x, y+=fhb);
    text("pitch err " + nf(sensor_data.m_gyro_err.y, 1, 5), x, y+=fhm);
    text("yaw err   " + nf(sensor_data.m_gyro_err.z, 1, 5), x, y+=fhm);

    //y+= fhm;
    fill(100, 100, 0);
    text("beta " + nf(sensor_data.m_beta, 1, 5), x, y+=fhm);
    text("zeta " + nf(sensor_data.m_zeta, 1, 5), x, y+=fhm);
    text("neta " + nf(sensor_data.m_neta, 1, 5), x, y+=fhm);


    x = width - 200;
    y = 0;
    // textSize(fhb);
    // fill(100, 100, 100);
    // text("mag.x " + sensor_data.m_mag_raw.x, x, y+=fhb);
    // //fill(0, 100, 0);
    // text("mag.y " + sensor_data.m_mag_raw.y, x, y+=fhb);
    // //fill(0, 0, 100);
    // text("mag.z " + sensor_data.m_mag_raw.z, x, y+=fhb);
    //
    // fill(100, 100, 100);
    // text("acc.x " + sensor_data.m_acc.x, x, y+=fhb);
    // //fill(0, 100, 0);
    // text("acc.y " + sensor_data.m_acc.y, x, y+=fhb);
    // //fill(0, 0, 100);
    // text("acc.z " + sensor_data.m_acc.z, x, y+=fhb);


    fill(100, 100, 0);
    text("g " + nf(sensor_data.m_g, 1, 2), x, y+=fhb);
    //text("a " +  nf(g_anlge_roll,1,2), x, y+=30);
    text("overload " + nf(sensor_data.m_overload, 1, 1), x, y+=fhb);

    x = width/2 - 100;
    y = 0;
    fill(100, 0, 0);
    text("temp " + sensor_data.m_temp, x, y+=fhb);
    text("fps " + sensor_data.m_fps, x, y+=fhb);
    text("time " + sensor_data.m_time, x, y+=fhb);

    //drawTextCommand();
    textSize(fhb);
    x = width / 2;
    y = height /2 - 100;


    var alpa = last_message_time / last_message_time_max * 255;
    fill(128, 0, 0, alpa);
    textAlign(CENTER);
    text(last_message, x, y+=14 );
    last_message_time -= 0.03;
}