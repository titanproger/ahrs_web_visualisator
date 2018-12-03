# ahrs_web_visualisator
Visualisation of ahrs state by web interface

# What is it

It is web visualisation of AHRS system for developing and debugging the AHRS.

It is based on node js web server.

You can see the angles by any tablet pc, laptop, smartphone ..

It was written in mind to be run at raspberry pi. The server on raspberry. And client on any moblie device browser.

![alt text](https://github.com/titanproger/ahrs_web_visualisator/blob/master/readme/demo_screen_1.jpg)

Key features:
    Direct and indercet indicators of yaw pitch roll,
    Indication of gravity vector, (for coordinated turns)
    Indication gyroscop temperature
    Comunicate with arduino sensor via serial USB
    Fullscreen mode at browser
    No sleep mode on android devices

## Disclaimer

 There is no code of AHRS sensor here. No fusion algoritm.

# Installation

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
