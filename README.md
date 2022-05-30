# kuber_trading_engine_nodejs



## Project Setup

Follow these given steps to set up and run this project on your local machine:

1. Clone this Repository:
 ```
 git clone https://github.com/Indra-Capital/kuber_trading_engine_nodejs
 ```
2. Run `cd kuber_trading_engine_nodejs`

3. Install NPM packages
```
npm install
``` 
4. Create an `.env` file in the root directory and add all the entries given in `.env.sample` file

5. Run the server 
  ```
  npm run listen
  ```
  
## About logz.io

Logz.io is an end-to-end cloud monitoring service built for scale. 
It’s the best-of-breed open source monitoring tools on a fully managed cloud service.

### Setup

To send logs on logz.io, we need to create an account on https://logz.io and get the token.

```
const logzLogger = require("logzio-nodejs").createLogger({
   token: ENTER_YOUR_TOKEN_HERE,
   protocol: "https",
   host: "listener.logz.io",
   port: "8071",
   type: ADD_YOUR_LOG_TYPE,
 });

```

### Usage 

In our application,we have created a logger class and add four different methods to log different type of messages.
Every method get the message as an argument and use `logzLogger.log(payload)` to send the logs on logz.io.

The structure of payload in our app is:

```
const payload = {
  env: this.stage,
  level: ADD_TYPE_OF_LEVEL,
  source: this.loggerName,
  message: message,
};

```
we need to provide different type of level to every method. 
For example - we have given `level:"info"` to info method of logger class. 

We use these class methods to log any type of message in our application.
