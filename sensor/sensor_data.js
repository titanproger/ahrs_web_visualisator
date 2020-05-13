//var math3d = require('math3d');
require = require("esm")(module/*, options*/)
let math_ds = require('math-ds');
//import math_ds from 'math-ds'

/**
 * setup serial  https://github.com/nebrius/raspi-io/wiki/Getting-a-Raspberry-Pi-ready-for-NodeBots
 *
 * sudo npm install serialport --unsafe-perm --build-from-source
 */
class SensorData {

    /**
     * Constructs a new daata.
     * @constructor
     */

    constructor() {
        this.m_angles    = new math_ds.Vector3();
        this.m_acc       = new math_ds.Vector3();
        this.m_gyro_err  = new math_ds.Vector3();
        this.m_mag       = new math_ds.Vector3();
        this.m_mag_raw   = new math_ds.Vector3();
        this.m_mag_local = new math_ds.Vector3();

        this.m_fps  = 0.0;
        this.m_temp = 0.0;
        this.m_beta = 0.0;
        this.m_zeta = 0.0;
        this.m_neta = 0.0;

        this.m_index = 0;

        this.m_g = 0;
        this.m_overload = 0;
        this.m_filter_err = new math_ds.Vector3();
        this.m_time = "";


        this.m_orientation_mtx = new math_ds.Matrix3();
        this.m_orientation_mtx.set(-1,0,0,  0,-1,0,  0,0,1);
    }


    get angles() {return this.m_angles;}
    get acc() {return this.m_acc;}
    get gyroErr() {return this.m_gyro_err;}
    get mag() {return this.m_mag;}
    get magRaw() {return this.m_mag_raw;}
    get magLocal() {return this.m_mag_local;}
    get fps() {return this.m_fps;}
    get temp() {return this.m_temp;}
    get beta() {return this.m_beta;}
    get zeta() {return this.m_zeta;}
    get neta() {return this.m_neta;}

    get g() {return this.m_g;}
    get overload() {return this.m_overload;}
    /**
     * @param {string} msg
     */
    onDataMessage(msg) {
        let FLOAT_FACKTOR = 1000.;
        let list = msg.split(' ');
        this.m_index = 0;

        if(list[0] !== "O:")
            return false;

        this.__parseSkip();
        this.m_angles = this.__parseVector(list);

        //this.__parseSkip();
        this.m_acc = this.__parseVector(list);

        //this.__parseSkip();
        this.m_temp = this.__parseFloat(list) ;

        //this.__parseSkip();
        this.m_gyro_err = this.__parseVector(list);

        //this.__parseSkip();
        this.m_beta = this.__parseFloat(list)/FLOAT_FACKTOR;
        this.m_zeta = this.__parseFloat(list)/FLOAT_FACKTOR;
        this.m_neta = this.__parseFloat(list)/FLOAT_FACKTOR;

        //this.__parseSkip();
        this.m_mag = this.__parseVector(list);

        //this.__parseSkip();
        this.m_fps = this.__parseFloat(list);

        //this.__parseSkip();
        this.m_mag_raw = this.__parseVector(list);

        //this.__parseSkip();
        this.m_mag_local = this.__parseVector(list);

        //this.m_angles.x *= -1;
        this.m_angles.y *= -1;
        this.m_angles.z *= -1;
        this.m_gyro_err.x *= -1;
        this.m_gyro_err.y *= -1;

        this.m_angles.z -= 180;

        while (this.m_angles.z <0)
            this.m_angles.z += 360;
        while (this.m_angles.z >=360)
            this.m_angles.z -= 360;

        this.m_angles.applyMatrix3(this.m_orientation_mtx);
        this.m_acc.applyMatrix3(this.m_orientation_mtx);
        this.m_gyro_err.applyMatrix3(this.m_orientation_mtx);

        this.onDataChanged();
        return true;
    }

    doEmulation( t ) {
        let k = t * Math.PI  * 2;
        this.m_angles = {
            x: Math.sin( k / 20 ) * 25,   // roll
            y: Math.sin( k / 50 ) * 20,   // pith
            z: Math.sin(k  / 120 ) * 180,                   // yaw
        };

        this.m_filter_err = {
            x: Math.sin( k / 10 ) * 15,  // angle of gravity local (roll)
            y: Math.sin( k / 10 ) * 10,  // angle of gravity local (pitch)
            z: Math.sin( k / 50 ) * 20,  // angle of North local
        };

        this.m_beta = 0.1;            // if 0 ground is brawn, else green


    }

    getData() {
        return {
            angle :  this.m_angles

        }
    }

    degrees(val) {
        return val / Math.PI * 180;
    }

    onDataChanged() {
        //m_acc  = m_acc_avg.avg(m_acc);
        //m_mag  = m_mag_avg.avg(m_mag);
        //m_gerr = m_gerr_avg.avg(m_gerr);

        this.m_g = this.m_acc.length();
        this.m_overload = this.m_g / 9.8;

        let mag_err = this.degrees(Math.atan2(this.m_mag_local.y, this.m_mag_local.x));

        this.m_filter_err.x = this.degrees(Math.atan2( this.acc.y, this.acc.z));
        this.m_filter_err.y = this.degrees(Math.atan2( this.acc.x, this.acc.z));
        this.m_filter_err.z = this.m_angles.z + mag_err;

        this.m_time = new Date().toISOString().replace('T', ' ').substr(0, 19);

        //m_g_angle_roll_avg.avg(m_g_anlge_roll);
    }
    /**
     *
     * @param {Array} list

     * @returns {Vector3}
     */
    __parseVector(list) {
        if(list.length <= this.m_index + 3 )
            return new math_ds.Vector3(0,0,0);

        let FLOAT_FACKTOR = 1000.0;

        let x = parseFloat(list[this.m_index++]) / FLOAT_FACKTOR;
        let y = parseFloat(list[this.m_index++]) / FLOAT_FACKTOR;
        let z = parseFloat(list[this.m_index++]) / FLOAT_FACKTOR;

        return new math_ds.Vector3(x,y,z);
    }


    __parseSkip() {
        ++this.m_index;
    }


    /**
     *
     * @param {Array} list
     * @returns {number}
     */
    __parseFloat(list) {
        if(list.length <= this.m_index + 1 )
            return 0;

        return parseFloat(list[this.m_index++]);
    }

}


exports = module.exports = SensorData;