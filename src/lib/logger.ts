const logger = require("logzio-nodejs").createLogger({
  token: "uUTJKmQOqcfLXsaXXWTmzWyKvejoWxqU",
  protocol: "https",
  host: "listener.logz.io",
  port: "8071",
  type: "elasticsearch",
});

export default logger;
