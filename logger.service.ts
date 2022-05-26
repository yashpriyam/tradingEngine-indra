import * as bunyan from "bunyan";
import * as path from "path";
import * as fs from "fs";

// import { Injectable } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';

export class LoggerService {
  private logger = null;
  private logzIoOn = false;
  private logzLogger = null;
  private stage = "dev"; // from .env
  private loggerLevel = "debug";// from .env
  private loggerName = "indrax-api";// from .env

  constructor() {
    const RotatingFileStream = require("bunyan-rotating-file-stream");

    // if (this.configService.get('LOG_LEVEL')) this.loggerLevel = this.configService.get('LOG_LEVEL')
    // if (this.configService.get('LOGZ_IO_ON')) this.logzIoOn = this.configService.get('LOGZ_IO_ON')

    // if (this.configService.get('INDRAX_STAGE')) this.stage = this.configService.get('INDRAX_STAGE')

    const logFileDir = path.join(require("os").homedir(), "logs")
    const logFilePath = path.join(logFileDir, this.loggerName)
    
    if (!fs.existsSync(logFilePath)) {
      if (!fs.existsSync(logFileDir)) fs.mkdirSync(logFileDir);
      fs.mkdirSync(logFilePath);
      fs.createWriteStream(this.loggerName + ".log").end();
    }
    
    this.logger = bunyan.createLogger({
      name: this.loggerName,
      level: this.loggerLevel,
      streams: [
        {
          stream: new RotatingFileStream({
            path: path.join(logFilePath, this.loggerName +".log"),
            period: "1d",
            rotateExisting: true,
          }),
        },
        {
          stream: process.stdout,
        },
      ],
      src: true,
    });

    if (this.logzIoOn) {
      this.logzLogger = require('logzio-nodejs').createLogger({
        token: 'dvXbXJJuNXRivJRhktWxTktEnwsyHcJz',
        protocol: 'https',
        host: 'listener-ca.logz.io',
        port: '8071',
        type: 'IndraXAPI'
      });
    }
  }

  info(message: string) {
    this.logger.info(message);

    if (this.logzLogger) {
      var payload = {
        env: this.stage,
        level: "info",
        source: this.loggerName,
        message: message
      }
      this.logzLogger.log(payload)
    }
  }

  warn(message: string) {
    this.logger.warn(message);
    
    if (this.logzLogger) {
      var payload = {
        env: this.stage,
        level: "warn",
        source: this.loggerName,
        message: message
      }
      this.logzLogger.log(payload)
    }
  }

  debug(message: string) {
    this.logger.debug(message);
    
    if (this.logzLogger) {
      var payload = {
        env: this.stage,
        level: "debug",
        source: this.loggerName,
        message: message
      }
      this.logzLogger.log(payload)
    }
  }

  error(message: string) {
    this.logger.error(message);
        if (this.logzLogger) {
      var payload = {
        env: this.stage,
        level: "error",
        source: this.loggerName,
        message: message
      }
      this.logzLogger.log(payload)
    }
  }
}