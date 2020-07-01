
const E_CMD_CODE_NONE = 0;
const E_CMD_CODE_RESET_PITCH_ROLL      = 1;  // сбросить крен тангаж
const E_CMD_CODE_SET_YAW_BY_MAG        = 2;  // установить углы по магнетометру
const E_CMD_CODE_SET_PITCH_ROLL_BY_ACC = 3;  // установить углы по акселерометру
const E_CMD_CODE_BOOST_FILTER          = 4;  // установить углы по акселерометру

const E_CMD_CODE_CHANGE_BETA           = 5;
const E_CMD_CODE_CHANGE_ZETA           = 6;
const E_CMD_CODE_CHANGE_NETA           = 7;
const E_CMD_CODE_CHANGE_ZETA_MAG       = 8;

const E_CMD_CODE_SET_GRAVITY_VECTOR  = 10;  // текущее направление силы тяжести принять за 0 (roll pitch)
const E_CMD_CODE_SET_YAW_NORTH       = 11;  // текущее направление на север принять за 0 (yaw)
const E_CMD_CODE_DEFAULT_ORIENTATION = 12;  // сбросить модификатор ориентации

const E_CMD_CODE_CALIBRATE_GYRO       = 20;
const E_CMD_CODE_SET_MAGNITUDE_OFFSET = 21;
const E_CMD_CODE_SET_MAGNITUDE_MATRIX = 22;

const E_CMD_CODE_SET_ACC_OFFSET       = 23;
const E_CMD_CODE_SET_ACC_SCALE        = 24;

const E_CMD_CODE_DEBUG_ACTION         = 30;
const E_CMD_CODE_TOGGLE_GYRO          = 31;
const E_CMD_CODE_CALIBRATION_STOP     = 32;  // code = space - useful when send calibration
const E_CMD_CODE_TOGGLE_MAG           = 33;
const E_CMD_CODE_TOGGLE_ACC           = 34;


const E_CMD_CODE_SAVE                = 40;
const E_CMD_CODE_LOAD                = 41;
const E_CMD_CODE_LOAD_DEFAULT        = 42;
const E_CMD_CODE_TOGGLE_PRINT_MODE   = 43;

