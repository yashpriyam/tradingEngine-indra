var logger = require('logzio-nodejs').createLogger({
  token: 'wTMYrprFKilxYbGKaCGvUrOFOGYORNyy',
  protocol: 'https',
  host: 'listener.logz.io',
  port: '8071',
  type: 'elasticsearch'
});

export default logger;
