
//! authors : Pronin E
//! license : MIT
//! https://github.com/titanproger/ahrs_web_visualisator


var noSleep = new NoSleep();

var sensor_data;
let min_side;


var m_screen_locked = false;

var socket;

var last_message = "";
var last_message_time = 0;
var last_message_time_max = 5;

var draw_scale = 1;
var m_fps = 30;
var m_data_raw = [];
var m_data_calibrate = [];
var m_data_cur = [];

var m_data_max_len = m_fps * 60 * 5;  // 5 minutes data len
//var m_data_max_len = 10 ;

var m_recording = false;

var m_mag_offset  = null;
var m_mag_matrix  = null;

var messages = [];


function addButton (name, x, y,w,h, on_click) {
    let button = createButton(name);
    button.position(x, y);
    button.mousePressed(on_click);
    button.size( w, h);
    return button;
}

function mouseClicked()  {
    m_screen_locked = true;
    noSleep.enable();
}

function setup() {

  // put setup code here
    min_side = min(windowWidth, windowHeight);

    draw_scale = min_side / 200 ;

    let cnv = createCanvas(windowWidth, windowHeight);
    //let cnv = createCanvas(min_side, min_side);
    cnv.style('display', 'block');
    background(255);
    frameRate(m_fps);

    socket = io();
    socket.on('ahrs', function(msg) { sensor_data = JSON.parse(msg); onDataChanged()});

    socket.on('ahrs_msg', function(msg){ messages.push(msg); last_message = msg;  last_message_time = last_message_time_max; });


    socket.on('disconnect', () => {
        sensor_data = null;
    });

    let w = min_side / 10;
    let h = min_side / 20;
    let x = windowWidth - w;
    let y = -h;

    //addButton('Full screen' , x, y+=h, w,h, () => {  if (screenfull.enabled) screenfull.request();}  );
    //y+=h;
    addButton('Start' , x, y+=h, w,h, () => { doStart(); });
    addButton('Stop' , x, y+=h, w,h, () => { doStop(); });
    addButton('Apply' , x, y+=h, w,h, () => { doCommit(); });
    y+=h;
    addButton('Save' , x, y+=h, w,h, () => { doCommand(E_CMD_CODE_SAVE); });
    addButton('Load' , x, y+=h, w,h, () => { doCommand(E_CMD_CODE_LOAD); });
    addButton('Default' , x, y+=h, w,h, () => { doCommand(E_CMD_CODE_LOAD_DEFAULT); });
    y+=h;
    addButton('Zoom +' , x, y+=h, w,h, () => { draw_scale *= 1.2; });
    addButton('Zoom -' , x, y+=h, w,h, () => { draw_scale *= 0.8; });
    y+=h;

    addButton('Clear' , x, y+=h, w,h, () => { doClear() });
}

function doClear() {
    m_data_cur = [];
    m_data_raw = [];
    m_data_calibrate = [];
    m_mag_offset = null;
    m_mag_matrix = null;
}

function doCommand(code) {
    socket.emit('ahrs_cmd', code);
}

function doCommit() {
    if(m_mag_offset === null)
        return;

    m_mag_offset.z = 63.38 - 0.25;
    doCommandSendVector(E_CMD_CODE_SET_MAGNITUDE_OFFSET, m_mag_offset);
    doCommandSendMatrix(E_CMD_CODE_SET_MAGNITUDE_MATRIX, m_mag_matrix);
    doClear();
}

function doCommandSendVector(code, vec) {
    let msg = JSON.stringify( {
        "code": code,
        "vec": vec,
    });
    socket.emit('ahrs_cmd_vec', msg);
}

/**
 *
 * @param code
 * @param { MATHDS.Matrix4 } matrix
 */
function doCommandSendMatrix(code, matrix) {
    let msg = JSON.stringify({
        "code": code,
        "matrix": matrix,
    });
    socket.emit('ahrs_cmd_mtx', msg);
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

    drawTextIface();

    push();
    translate(width*0.5, height*0.5);
    drawAxis();
    drawAllData();
    pop();
}



function onDataChanged() {

    if (m_recording)
        dataArrayPush(m_data_raw, sensor_data.m_mag_raw);

    if(!isConfig())
        dataArrayPush(m_data_cur, sensor_data.m_mag);

}


function dataArrayPush( array, point) {
    array.push( new MATHDS.Vector4( point.x, point.y , 0, 1) );
    if(array.length  > m_data_max_len)
        array.shift()
}


function drawTextIface() {
    let y = 0;
    let x = 10;

    let fhm = min_side * 0.02;
    let fhb = fhm * 1.5;
    let fhs = fhm * 0.75;
    textAlign(LEFT);
    textSize(fhb);
    // fill(100, 0, 0);
    // text("roll    " + nf(sensor_data.m_angles.x, 3, 2), x, y+=fhb);
    // fill(0, 100, 0);
    // text("pitch " + nf(sensor_data.m_angles.y, 3, 2), x, y+=fhb);
    // fill(0, 0, 100);
    // text("yaw   " + nf(sensor_data.m_angles.z, 3, 2), x, y+=fhb);

    //drawTextCommand();
    textSize(fhb);
    x = width / 2;
    y = height * 0.35 ;

    var alpa = last_message_time / last_message_time_max * 255;
    fill(128, 0, 0, alpa);
    textAlign(CENTER);
    y-=fhb*messages.length;
    messages.forEach( function (item)  {
        text(item, x, y+=fhb );
    });
    if(last_message_time > 0)
        last_message_time -= 0.03;
    else
        messages = [];


}


function drawAxis() {
    let w = width;
    let h = height;
    let len = 5;
    let step = 10;
    stroke(0);
    strokeWeight(1);
    line(0, -h, 0, +h);
    line(-w, 0, w, 0);
    for (let x = 0; x< +w; x+=draw_scale*step ) {
        line(x, -len, x, +len);
        line(-x, -len, -x, +len);
    }

    for (let y = 0; y< +h; y+=draw_scale*step ) {
        line(-len, y, len, y);
        line(-len, -y, len, -y);
    }
}

function isConfig() {
    return m_mag_offset !== null;
}

function drawAllData() {
    let line_width = 4;


    if(m_recording || isConfig())
        drawData(m_data_raw, line_width, color(255, 128, 128));
    if(m_recording && sensor_data !== null)
        line(0, 0, sensor_data.m_mag_raw.x * draw_scale, sensor_data.m_mag_raw.y * draw_scale);


    if(!m_recording && !isConfig()) {
        drawData(m_data_cur, line_width, color(128, 255, 128));
        if(sensor_data !== null)
            line(0, 0, sensor_data.m_mag.x * draw_scale, sensor_data.m_mag.y * draw_scale);
    }

    if(isConfig())
        drawData(m_data_calibrate, line_width, color(128, 128, 255));

    //line(0, 0, sensor_data.m_mag.x * draw_scale, sensor_data.m_mag.y * draw_scale); TODO show line current


    // p2 = new Point(sensor_data.m_mag_raw.x, sensor_data.m_mag_raw.y);
    // p2.x -= mag_offset.x;
    // p2.y -= mag_offset.y;
    // p2 = RotateVector(mag_matrix, p2);
    // line(0, 0, p2.x * scale, p2.y * scale);
}

function drawData( data_array , line_width, line_color)
{
    stroke(line_color);
    strokeWeight(line_width);  // Thicker
    var prev_point = null;
    data_array.forEach(function(item, index, array) {
        if(prev_point)
            line(prev_point.x * draw_scale, prev_point.y * draw_scale, item.x * draw_scale, item.y * draw_scale);
        prev_point = item;
    });
}

function doStart()
{
    m_recording = true;
    doClear();
}

function doStop()
{
    m_recording = false;
    updateCalibration();
}

function updateCalibration() {
    if(m_data_raw.length <= 0)
        return;

    CopyDataToResult();
    HardIronCalibration();
    SoftIronCalibration();
}

function CopyDataToResult() {

    m_data_calibrate = [];
    m_data_raw.forEach(function(item, index, array) {
        m_data_calibrate.push( new MATHDS.Vector4(item.x, item.y, item.z, 1));
    });
}

function  HardIronCalibration() {

    let pmin = new MATHDS.Vector4(10000, 10000 , 0,0);
    let pmax = new MATHDS.Vector4(-10000, -10000 , 0,0);

    m_data_calibrate.forEach( function(item, index, array) {
        pmin.min(item);
        pmax.max(item);
    });

    m_mag_offset = pmin.add(pmax).divideScalar(2);
    //m_mag_offset.multiplyScalar(-1);
    applyOffsetToData(m_mag_offset);
}

function applyOffsetToData(offset) {
    m_data_calibrate.forEach( function(item, index, array) {
        item.sub(offset);
    });
}

function VectorAngle(vector) {
    return - Math.atan2(vector.y , vector.x);
}

function  SoftIronCalibration() {
    let pmin = FindMinLenPoint();
    let pmax = FindMaxLenPoint();

    let min_len = pmin.length();
    let max_len = pmax.length();

    let angle = VectorAngle(pmax);
    console.log("angle max "+ angle);
    // let mtx_rot_1 = MATHDS.Matrix3();
    // mtx_rot_1.setRotate()
    rot1 = new MATHDS.Matrix4();
    rot1.makeRotationZ(angle);

    scale1 = new MATHDS.Matrix4();
    scale1.scale(min_len/max_len, 1, 1);

    applyMatrixToData(rot1);
    applyMatrixToData(scale1);
    //applyMatrixToData(rot2);

    //correction of min length
    pmax = FindMaxLenPoint();
    min_len = pmax.length();

    scale2 = new MATHDS.Matrix4();
    scale2.scale(min_len/max_len, 1, 1);

    rot2 = new MATHDS.Matrix4();
    rot2.makeRotationZ(-angle);


    m_mag_matrix = new MATHDS.Matrix4();
    m_mag_matrix.premultiply(rot1);
    m_mag_matrix.premultiply(scale2);
    m_mag_matrix.premultiply(rot2);

    CopyDataToResult();
    applyOffsetToData(m_mag_offset);
    applyMatrixToData(m_mag_matrix);
}


/**
 * Applies a quaternion to data.
 * @param {Quaternion} q - A quaternion.
 */

function applyQuternionToData( q) {
    m_data_calibrate.forEach( function(item, index, array) {
        item.applyQuaternion(q);
    });
}
/**
 * Applies a quaternion to data.
 * @param {Matrix4} m
 */


function applyMatrixToData(m) {
    m_data_calibrate.forEach( function(item, index, array) {
        item.applyMatrix4(m);
    });
}

function FindMinLenPoint() {
    let pmin = new MATHDS.Vector4(100000, 100000,0,0);
    let min_len = 100000;
    m_data_calibrate.forEach( function(item, index, array) {
        let len = item.length();
        if (len < min_len) {
            min_len = len;
            pmin = item;
        }
    });
    return pmin;
}

function FindMaxLenPoint() {
    let pmax = new MATHDS.Vector4(0,0,0,0);
    let max_len = 0;
    m_data_calibrate.forEach( function(item, index, array) {
        let len = item.length();
        if (len > max_len) {
            max_len = len;
            pmax = item;
        }
    });
    return pmax;
}