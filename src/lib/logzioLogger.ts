class LogIoLoggerService {
  stage = "dev"; // from .env
  loggerLevel = "debug"; // from .env
  loggerName = "indrax-api"; // from .env
  logzLogger: any;
  token: string | undefined;
  constructor() {
    // if (this.configService.get('LOG_LEVEL')) this.loggerLevel = this.configService.get('LOG_LEVEL')
    // if (this.configService.get('LOGZ_IO_ON')) this.logzIoOn = this.configService.get('LOGZ_IO_ON')
    // if (this.configService.get('INDRAX_STAGE')) this.stage = this.configService.get('INDRAX_STAGE')

    // this.token = process.env.logzToken;

    this.logzLogger = require("logzio-nodejs").createLogger({
      // token: "wTMYrprFKilxYbGKaCGvUrOFOGYORNyy",
      token: "uUTJKmQOqcfLXsaXXWTmzWyKvejoWxqU",
      protocol: "https",
      host: "listener.logz.io",
      port: "8071",
      type: "elasticsearch",
    });
  }

  info(message: string) {
    const payload = {
      env: this.stage,
      level: "info",
      source: this.loggerName,
      message: message,
    };
    this.logzLogger.log(payload);
  }

  warn(message: string) {
    const payload = {
      env: this.stage,
      level: "warn",
      source: this.loggerName,
      message: message,
    };
    this.logzLogger.log(payload);
  }

  debug(message: string) {
    const payload = {
      env: this.stage,
      level: "debug",
      source: this.loggerName,
      message: message,
    };
    this.logzLogger.log(payload);
  }

  error(message: string | any) {
    const payload = {
      env: this.stage,
      level: "error",
      source: this.loggerName,
      message: message,
    };
    this.logzLogger.log(payload);
  }
}

export const LogzioLogger = new LogIoLoggerService();
