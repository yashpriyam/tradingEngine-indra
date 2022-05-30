The following code is executed when the app initializes:

```typescript
let arbitrageTriggerInstance = new ArbitrageTrigger();
await arbitrageTriggerInstance.getAllTradePairs();
arbitrageTriggerInstance.listenArbitrageStream();
```

1. new instance of `ArbitrageTrigger` class is created

- this new instance has the following code in it's constructor
  ```typescript
  constructor() {
    super();
    this.priceOracleInstances = [
        new BinancePriceOracle(),
        new CryptocomPriceOracle(),
        new FtxPriceOracle(),
    ];
    this.orderBookPriceMap = {};
    this.allTradePairsExchangeMap = {};
    this.commonSymbolMap = new Map();
  }
  ```
- the `priceOracleInstances` is an array of PriceOracle class instances of all the exchanges
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

- this method first creates the `allTradePairsExchangeMap` by calling the `getTradePairsList` method on each PriceOracle instance from `priceOracleInstances`.
- then it calls the `createCommonSymbolMap` method of ArbitrageTrigger class
- the `createCommonSymbolMap` method creates the `commonSymbolMap` and also the initial strucutre of `orderBookPriceMap`
- it then updates the `allTradePairsExchangeMap` where now the each exchange has an object as value with mapping of it's trade pairs to their standard format, which looks like this:

```typescript
{
 EXCHANGE_NAME1: {TRADE_PAIR_OF_EXCHANGE1_IN_EXCHANGE_FORMAT: TRADE_PAIR_OF_EXCHANGE1_IN_STANDARD_FORMAT},
 EXCHANGE_NAME2: {TRADE_PAIR_OF_EXCHANGE1_IN_EXCHANGE_FORMAT: TRADE_PAIR_OF_EXCHANGE2_IN_STANDARD_FORMAT},
}
```

- this method also sanitizes the list of trade pairs which we'd then subscribe to, and then goes back to update all the data structures `allTradePairsExchangeMap`, `commonSymbolMap`, `orderBookPriceMap` with updated trade pairs list.

3. `listenArbitrageStream` method is called on ArbitrageTrigger class, which then calls the `listenStream` method from Trigger base class

```typescript
listenArbitrageStream = () => {
  this.listenStream(
    this.priceOracleInstances,
    this.orderBookPriceMap,
    this.commonSymbolMap,
    checkForArbitrage // this is the function which recieves the ask and bid prices and check for %age difference, controlled by ARBITRAGE_THRESHOLD_PERCENTAGE env variable
  );
};
```

- the `listenStream` method of Trigger class loops through priceOracleInstances array,
- calls the `subscribeOrderBookDataForAllTradePairs` method on each PriceOracle instance - this method sends a subscription request to the respective trade exchange for each of it's trade pairs, and then calls the `getMessageStream` method after all the trade pairs arre subscribed
- `getMessageStream` method is a method on PriceOracle base class which listens to messages (price updates) from all the subscriptions through the `ws.onmessage` method of ws instances.
- after calling the `subscribeOrderBookDataForAllTradePairs` on each PriceOracle instance,
  the `setHandler` method is called on each PriceOracle instance with a string `orderbookhandlerMethod` (which is the name of key against which the orderBookData is present in the ws data stream, different fro every trading exchange) and a callback,
- the string and the callback is set as a key value in a data structure called as `handlers`,
- `handlers` is Map data structure in the base class PriceOracle,
- the `ws.onmessage` method goes through the `handlers` data structure on every message update from ws, and based on string in ws stream, it calls the respective callback
