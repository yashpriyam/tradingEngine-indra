class LogIoLoggerService {
  stage = "dev"; // from .env
  loggerLevel = "debug"; // from .env
  loggerName = "kuber-arb-engine"; // from .env
  logzLogger: any;
  token: string | undefined;
  constructor() {
    this.logzLogger = require("logzio-nodejs").createLogger({
      token: "wTMYrprFKilxYbGKaCGvUrOFOGYORNyy",
      protocol: "https",
      host: "listener.logz.io",
      port: "8071",
      type: "elasticsearch",
      debug: true,
    });
  }

  info(message: string | any, key?: object) {
    const payload = {
      ...key,
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
