// export class LoggerService {
//   private stage = "dev"; // from .env
//   private loggerLevel = "debug";// from .env
//   private loggerName = "indrax-api";// from .env

//   constructor() {

//     // if (this.configService.get('LOG_LEVEL')) this.loggerLevel = this.configService.get('LOG_LEVEL')
//     // if (this.configService.get('LOGZ_IO_ON')) this.logzIoOn = this.configService.get('LOGZ_IO_ON')

//     // if (this.configService.get('INDRAX_STAGE')) this.stage = this.configService.get('INDRAX_STAGE')

//       this.logzLogger = require('logzio-nodejs').createLogger({
//         token: 'dvXbXJJuNXRivJRhktWxTktEnwsyHcJz',
//         protocol: 'https',
//         host: 'listener-ca.logz.io',
//         port: '8071',
//         type: 'IndraXAPI'
//       });
//   }

//   info(message: string) {

//       var payload = {
//         env: this.stage,
//         level: "info",
//         source: this.loggerName,
//         message: message
//       }
//       this.logzLogger.log(payload)

//   }

//   warn(message: string) {

//       var payload = {
//         env: this.stage,
//         level: "warn",
//         source: this.loggerName,
//         message: message
//       }
//       this.logzLogger.log(payload)

//   }

//   debug(message: string) {

//       var payload = {
//         env: this.stage,
//         level: "debug",
//         source: this.loggerName,
//         message: message
//       }
//       this.logzLogger.log(payload)

//   }

//   error(message: string) {

//       var payload = {
//         env: this.stage,
//         level: "error",
//         source: this.loggerName,
//         message: message
//       }
//       this.logzLogger.log(payload)

//   }
// }
