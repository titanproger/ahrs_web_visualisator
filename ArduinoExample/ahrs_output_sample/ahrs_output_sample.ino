
float roll = 0;
float pitch = 0;
float yaw = 0;



float accx = 0;
float accy = 0;
float accz = 0;

float temp = 0;
float gyro_err_x = 0;
float gyro_err_y = 0;
float gyro_err_z = 0;

// any 3 parameter to configure your ahrs- i use this as fusiion gain 
// if they are all zero - then color of earth will be changed 
float param_1 = 1;  
float param_2 = 0.2;
float param_3 = 1;

float mag_x = 0;
float mag_y = 0;
float mag_z = 0;


float mag_raw_x = 0;
float mag_raw_y = 0;
float mag_raw_z = 0;
int fps = 20;


void setup() {
  // put your setup code here, to run once:

  Serial.begin(115200);
}

void loop() {
  // put your main code here, to run repeatedly:
  unsigned long time_ms = millis();
  float t = time_ms / 1000.0f;
  updateVaribles(t);
  printVaribles();
  updateInputCommands();
  
  delay(1000 / 20);
}


enum ECommandCode {
    E_CMD_CODE_NONE = 0,
    E_CMD_CODE_RESET_PITCH_ROLL      = 1,  // сбросить крен тангаж
    E_CMD_CODE_SET_YAW_BY_MAG        = 2,  // установить углы по магнетометру
    E_CMD_CODE_SET_PITCH_ROLL_BY_ACC = 3,  // установить углы по акселерометру
    E_CMD_CODE_BOOST_FILTER          = 4,  // установить углы по акселерометру

    E_CMD_CODE_CHANGE_BETA           = 5,
    E_CMD_CODE_CHANGE_ZETA           = 6,
    E_CMD_CODE_CHANGE_NETA           = 7,

    E_CMD_CODE_SET_GRAVITY_VECTOR  = 10,  // текущее направление силы тяжести принять за 0 (roll pitch)
    E_CMD_CODE_SET_YAW_NORTH       = 11,  // текущее направление на север принять за 0 (yaw)
    E_CMD_CODE_DEFAULT_ORIENTATION = 12,  // сбросить модификатор ориентации

    E_CMD_CODE_CALIBRATE_GYRO       = 20,
    E_CMD_CODE_SET_MAGNITUDE_OFFSET = 21,
    E_CMD_CODE_SET_MAGNITUDE_MATRIX = 22,

    E_CMD_CODE_SET_ACC_OFFSET       = 23,
    E_CMD_CODE_SET_ACC_SCALE        = 24,

    E_CMD_CODE_DEBUG_ACTION         = 30,
    E_CMD_CODE_TOGGLE_GYRO          = 31,
    E_CMD_CODE_CALIBRATION_STOP     = 32,  // code = space - useful when send calibration
    E_CMD_CODE_TOGGLE_MAG           = 33,
    E_CMD_CODE_TOGGLE_ACC           = 34,


    E_CMD_CODE_SAVE                = 40,
    E_CMD_CODE_LOAD                = 41,
    E_CMD_CODE_LOAD_DEFAULT        = 42,
    E_CMD_CODE_TOGGLE_PRINT_MODE   = 43,
};
  
void updateInputCommands() {
  if (!Serial.available())
        return;

  uint8_t b = Serial.read();

  switch (b) {
    case E_CMD_CODE_NONE:
      break;
    case E_CMD_CODE_CHANGE_BETA:
      param_1 += 0.1;
      break;
    case E_CMD_CODE_CHANGE_ZETA:
      param_2 += 0.1;
      break;
    case E_CMD_CODE_CHANGE_NETA:
      param_3 += 0.1;
      break;
    default:
       Serial.println("Command not defined. ");
  }    
}

void updateVaribles(float t) {
  float x = t * PI;

  roll = sin(x / 10.0) * 15;
  pitch = sin(x / 20.0) * 15;
  yaw = sin(x / 40.0) * 15;
  
  temp = t;//23 + sin(x / 5) * 5;  
  

  accx = 0;
  accy = 0 + sin(x /6);
  accz = 9.8; 

  mag_x = cos(x / 20) * 32;
  mag_y = sin(x / 20) * 45;
  mag_z = sin(x / 20) * 37;

  // raw mag data with offsets
  mag_raw_x = mag_x + 10; 
  mag_raw_y = mag_y + 15;
  mag_raw_z = mag_z + 18;
  
}


void printVaribles() {

  float SCALE_FACTOR = 1000;
  Serial.print("O: "); //short by Orientation
  Serial.print(roll * SCALE_FACTOR);
  Serial.print(" ");
  Serial.print(pitch * SCALE_FACTOR);
  Serial.print(" ");
  Serial.print(yaw * SCALE_FACTOR);
  Serial.print(" ");

  Serial.print(accx * SCALE_FACTOR);
  Serial.print(" ");
  Serial.print(accy * SCALE_FACTOR);
  Serial.print(" ");
  Serial.print(accz * SCALE_FACTOR);
  Serial.print(" ");

  Serial.print(temp);
  Serial.print(" ");

  Serial.print(gyro_err_x  * SCALE_FACTOR);
  Serial.print(" ");
  Serial.print(gyro_err_y * SCALE_FACTOR);
  Serial.print(" ");
  Serial.print(gyro_err_z * SCALE_FACTOR);
  Serial.print(" ");

  Serial.print(param_1  * SCALE_FACTOR);
  Serial.print(" ");
  Serial.print(param_2  * SCALE_FACTOR);
  Serial.print(" ");
  Serial.print(param_3  * SCALE_FACTOR);
  Serial.print(" ");
   
  
  Serial.print(mag_x * SCALE_FACTOR);
  Serial.print(" ");
  Serial.print(mag_y * SCALE_FACTOR);
  Serial.print(" ");
  Serial.print(mag_z * SCALE_FACTOR);
  Serial.print(" ");


  Serial.print(fps);
  Serial.print(" ");

  Serial.print(mag_raw_x  * SCALE_FACTOR);
  Serial.print(" ");
  Serial.print(mag_raw_y  * SCALE_FACTOR);
  Serial.print(" ");
  Serial.print(mag_raw_z  * SCALE_FACTOR);
  Serial.print(" ");

  Serial.print(0);
  Serial.print(" ");
  Serial.print(0);
  Serial.print(" ");
  Serial.print(0);
  Serial.print(" ");
                  
  Serial.println();
}
