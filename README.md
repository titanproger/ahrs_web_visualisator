# ahrs_web_visualisator
Visualisation of ahrs state by web interface

# What is it

It is web visualisation of AHRS system for developing and debugging the AHRS.

It is based on node js web server.

You can see the angles by any tablet pc, laptop, smartphone ..

It was written in mind to be run at raspberry pi. The server on raspberry. And client on any moblie device browser.

![alt text](https://github.com/titanproger/ahrs_web_visualisator/blob/master/readme/demo_screen_1.jpg)

![alt text](https://github.com/titanproger/ahrs_web_visualisator/blob/master/readme/mag_calibration.jpg)

Key features:
   - Direct and indercet indicators of yaw pitch roll,
   - Indication of gravity vector, (for coordinated turns)
   - Indication gyroscop temperature
   - Comunicate with arduino sensor via serial USB
   - Fullscreen mode at browser
   - No sleep mode on android devices
   - Magnitometer HARD and SOFT calibration 

## Disclaimer

 There is no code of AHRS sensor here. No fusion algoritm.
  There is an example of Arduino sketch for printing out the ahrs state.

# Installation

## install node js    
    https://github.com/nodesource/distributions/blob/master/README.md#deb

## clone the app
  ```
  git clone https://github.com/titanproger/ahrs_web_visualisator.git
  cd ahrs_web_visualisator
  ```

## install node js modules
```
  npm install
  ```
On raspberry you need install serial-port.js (for comunication with sensor)
```
  sudo npm install serialport --unsafe-perm --build-from-source
  ```

## run node js
```
  node bin/www
```

## run browser

```
  localhost:3000
```
# Build Example Arduino AHRS
 
Open ArduinoExample/ahrs_output_sample/ahrs_output_sample.ino with Arduino IDE

Burn the image to Arduino ( tested with Arduino Nano)

# Run example on raspberry

  Connect your Arduino to Raspberri Pi (you can check /dev/ttyUSB0 should be present)
  Run nodejs with node bin/www
  Open brawser at <raspberry_ip>:3000
  
# Run example on linux computer
  same as on raspberry =) but connect Arduino to your computer 

