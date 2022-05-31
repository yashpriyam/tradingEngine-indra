# kuber_trading_engine_nodejs


## Deployment Steps

https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-ubuntu-20-04


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

### installation
```
npm install logzio-nodejs

```

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

`info` - log general application data. 

`error` - log any type of error message.

`debug` - log data or message for debugging purpose.

`warn` - log warning message.

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


## How to create Report on Logz.io

* To create a report on logz.io, we need to create a `dashboard` on logz.io.

* We can create a dashboard by navigate to dashboard tab given below discover tab and choose any type of `visualization`.After choosing the visualization 
  we need to create a `bucket` and save the dashboard.

* After saving the dashboard, we can click on `Create report` button given on top to create a report.

* On create report page provide some details like Report-Name, description, choose dashboard, when_to_send_it, Time-zone and Recipients.

`When_To_Send_It` : This field is used to provide the details of time to send the report to Recipients.

`Recipients` : Provide an email or endpoint on which we want to receive the report.

## Steps to create visualisation for Trade pairs per exchange.

- Navigate to Visualisation tab given below the discover tab in logs menu
- Add field to the index on which we need to add visualisation
- On visualisation page, click on create visualisation
- Choose the visualisation type.
- For Trade pair per exchange, we chose “Vertical Bar”
- After choosing visualisation type, we need to setup the metrics and buckets.
    - **Metric aggregations** are used to calculate a value for each bucket.
    - **Bucket aggregations** groups documents together in one bucket according to your logic and requirements.
- For Trade pair per exchange,
    - we chose “MAX” metrics aggregator and symbolCount as a field value.
    - In bucket aggregator, we configure X-axis by choosing aggregator as term, exchange Name as a field.
    We also create a sub aggregator to split series. For that we chose the aggregator as term and add symbolCount as Field.
    For sub aggregator, we choose the size = 1.


