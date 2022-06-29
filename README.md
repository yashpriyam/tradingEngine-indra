# kuber_trading_engine_nodejs

## Deployment Steps

https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-ubuntu-20-04

## Updating the project

https://codeburst.io/automate-your-deployment-process-with-pm2-b0fd7c256223

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

- To create a report on logz.io, we need to create a `dashboard` on logz.io.

- We can create a dashboard by navigate to dashboard tab given below discover tab and choose any type of `visualization`.After choosing the visualization
  we need to create a `bucket` and save the dashboard.

- After saving the dashboard, we can click on `Create report` button given on top to create a report.

- On create report page provide some details like Report-Name, description, choose dashboard, when_to_send_it, Time-zone and Recipients.

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
    
    
   
   
The following code is executed when the app initializes:

```typescript
(async () => {
  try {
    let arbStrategyInstance = await new ArbStrategy(
      PriceOracleExtended,
      allActions
    );
    await arbStrategyInstance.start(checkForArbitrage);
  } catch (error) {
    console.log({ error });
    LogzioLogger.debug(error);
  }
})();
```

1. new instance of `ArbStrategy` class is created,
   with all the ExchangeClass instances and all the actions

- this new instance has the following code in it's constructor
  ```typescript
  constructor(PriceOracleExtended: any[], actions: { [key: string]: any[]}) {
    this.PriceOracleExtended = PriceOracleExtended
    this.orderBookPriceMap = {};
    this.allTradePairsExchangeMap = {};
    this.commonSymbolMap = new Map();
    this.instance = (async () => {
      await this.getAllTradePairs()
      return this;
    })();
    return this.instance
  }
  ```
- the `PriceOracleExtended` is an array of PriceOracle class instances of all the exchanges
- the `orderBookPriceMap` is nested object which gets updated on recieving data from ws streams of any exchanges
- it looks like this:

```typescript
{
    TRADEPAIR_IN_STANDDARD_FORMAT: {
        EXCHANGE_NAME_WHICH_HAS_THIS_TRADE_PAIR: {
            ASK_PRICE: '',
            BID_PRICE: '',
            ASK_QUANTITY: '',
            BID_QUANTITY: '',
            SYMBOL_IN_EXCHANGE_FORMAT: ''
        },
        EXCHANGE_NAME_WHICH_HAS_THIS_TRADE_PAIR: {
            ASK_PRICE: '',
            BID_PRICE: '',
            ASK_QUANTITY: '',
            BID_QUANTITY: '',
            SYMBOL_IN_EXCHANGE_FORMAT: ''
        },
    },
    TRADEPAIR_IN_STANDDARD_FORMAT: {
        EXCHANGE_NAME_WHICH_HAS_THIS_TRADE_PAIR: {
            ASK_PRICE: '',
            BID_PRICE: '',
            ASK_QUANTITY: '',
            BID_QUANTITY: '',
            SYMBOL_IN_EXCHANGE_FORMAT: ''
        },
        EXCHANGE_NAME_WHICH_HAS_THIS_TRADE_PAIR: {
            ASK_PRICE: '',
            BID_PRICE: '',
            ASK_QUANTITY: '',
            BID_QUANTITY: '',
            SYMBOL_IN_EXCHANGE_FORMAT: ''
        },
    }
}
```

- the `allTradePairsExchangeMap` is an object which maps each exchange with list of trade pairs that it has
- it looks like this:

```typescript
{
  EXCHANGE_NAME1: [...TRADE_PAIRS_OF_EXCHANGE1],
  EXCHANGE_NAME2: [...TRADE_PAIRS_OF_EXCHANGE2],
}
```

- the `commonSymbolMap` is an js Map which maps each TRADE_PAIR in it's exchange specific format with it's standard format
- it looks like this:

```typescript
{
  TRADE_PIAR_SYMBOL_IN_EXCHANGE_FORMAT: TRADE_PIAR_SYMBOL_IN_STANDARD_FORMAT,
  TRADE_PIAR_SYMBOL_IN_EXCHANGE_FORMAT: TRADE_PIAR_SYMBOL_IN_STANDARD_FORMAT,
}
```

2. `getAllTradePairs` method of this instance is called

- this method first creates the `allTradePairsExchangeMap` by calling the `getTradePairsList` method on each PriceOracle instance from `PriceOracleExtended`.
- then it calls the `createCommonSymbolMap` method of ArbStrategy class
- the `createCommonSymbolMap` method creates the `commonSymbolMap` and also the initial strucutre of `orderBookPriceMap`
- it then updates the `allTradePairsExchangeMap` where now the each exchange has an object as value with mapping of it's trade pairs to their standard format, which looks like this:

```typescript
{
 EXCHANGE_NAME1: {TRADE_PAIR_OF_EXCHANGE1_IN_EXCHANGE_FORMAT: TRADE_PAIR_OF_EXCHANGE1_IN_STANDARD_FORMAT},
 EXCHANGE_NAME2: {TRADE_PAIR_OF_EXCHANGE1_IN_EXCHANGE_FORMAT: TRADE_PAIR_OF_EXCHANGE2_IN_STANDARD_FORMAT},
}
```

- this method also sanitizes the list of trade pairs which we'd then subscribe to, and then goes back to update all the data structures `allTradePairsExchangeMap`, `commonSymbolMap`, `orderBookPriceMap` with updated trade pairs list.

3. `listenArbitrageStream` method is called on ArbStrategy class, which then calls the `listenStream` method from ArbStrategy base class

```typescript
listenArbitrageStream = () => {
  this.listenStream(
    this.PriceOracleExtended,
    this.orderBookPriceMap,
    this.commonSymbolMap,
    checkForArbitrage // this is the function which recieves the ask and bid prices and check for %age difference, controlled by ARBITRAGE_THRESHOLD_PERCENTAGE env variable
  );
};
```

- the `listenStream` method of ArbStrategy class loops through PriceOracleExtended array,
- calls the `subscribeOrderBookDataForAllTradePairs` method on each PriceOracle instance - this method sends a subscription request to the respective trade exchange for each of it's trade pairs, and then calls the `getMessageStream` method after all the trade pairs arre subscribed
- `getMessageStream` method is a method on PriceOracle base class which listens to messages (price updates) from all the subscriptions through the `ws.onmessage` method of ws instances.
- after calling the `subscribeOrderBookDataForAllTradePairs` on each PriceOracle instance,
  the `setHandler` method is called on each PriceOracle instance with a string `orderbookhandlerMethod` (which is the name of key against which the orderBookData is present in the ws data stream, different fro every trading exchange) and a callback,
- the string and the callback is set as a key value in a data structure called as `handlers`,
- `handlers` is Map data structure in the base class PriceOracle,
- the `ws.onmessage` method goes through the `handlers` data structure on every message update from ws, and based on string in ws stream, it calls the respective callback

