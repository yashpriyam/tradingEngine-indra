import logger from "../lib/logger";
import Action from "./Action";

class Trigger {
  priceOracles: any[];
  actions: Action[];
  checkCondition: Function;
  orderBookPriceMap: orderBookMap;
  symbolMap: Map<string, string>;

  /**
   * @param priceOracles Array of instances of ExchangePriceOracle class for different exchanges
   * @param actions array of actions to be executed when checkCondition is true
   * @param checkCondition a function which returns a data and valid boolean
   */
  constructor(
    priceOracles: any[],
    actions: Action[],
    checkCondition: Function
  ) {
    this.priceOracles = priceOracles;
    this.actions = actions;
    this.checkCondition = checkCondition;
    this.orderBookPriceMap = {};
    this.symbolMap = new Map();
  }

  /**
   *
   */
  createCommonSymbolMap() {}

  /**
   * Iterate over all price oracles instance and call the methods on every class instance
   * It calls a setHandler method to create a map of method and callback to handle messages for
   * different exchanges
   * @returns void
   */
  async listenStream() {
    for (let { priceOracleInstance, exchangeName, handlerMethod } of this
      .priceOracles) {
      const socketClient = priceOracleInstance;

      // await socketClient.getTradePairsList();

      // this.createCommonSymbolMap(socketClient.);

      socketClient.subscribeOrderBookDataForAllTradePairs();

      /**
       * this handler handles the message for orderbook data, it create a object map
       * to store the ask and bid price for every exchange for every symbol.
       * We pass that map to a function to find the arbitrage opportunities
       */
      socketClient.setHandler(
        handlerMethod,
        (params: { asks: number[]; bids: number[]; symbol: string }) => {
          let { asks, bids, symbol } = params;

          // asks and bids may be empty or undefined
          if (
            typeof asks === "undefined" ||
            asks.length === 0 ||
            typeof bids === "undefined" ||
            bids.length === 0
          )
            return;

          let symbolKey: any = "";

          // getting a common key to store data in orderbookPriceMap
          if (this.symbolMap.has(exchangeName + symbol)) {
            symbolKey = this.symbolMap.get(exchangeName + symbol);
          } else {
            symbolKey = symbol.split("_").join("").toUpperCase();
            if (exchangeName === "cryptocom")
              this.symbolMap.set(exchangeName + symbol, symbolKey);
            else if (exchangeName === "binance") {
              symbolKey = symbol.toUpperCase();
              this.symbolMap.set(exchangeName + symbol, symbolKey);
            } else if (exchangeName === "ftx") {
              symbolKey = symbol.split("/").join("").toUpperCase();
              this.symbolMap.set(exchangeName + symbol, symbolKey);
            }
          }

          const askPrice = asks[0][0]; // lowest of asks
          const askQuantity = asks[0][1];

          const bidPrice = bids[0][0];
          // const bidPrice = bids[bids.length - 1][0]; // lowest of bids
          const bidQuantity = bids[0][1];

          // get a key value pair whose quantity is lesser
          const smallQuantity =
            askQuantity >= bidQuantity ? { askQuantity } : { bidQuantity };

          if (!this.orderBookPriceMap[symbolKey])
            this.orderBookPriceMap[symbolKey] = {};

          if (!this.orderBookPriceMap[symbolKey][exchangeName])
            this.orderBookPriceMap[symbolKey][exchangeName] = {};

          const previousAskPrice =
            this.orderBookPriceMap[symbolKey][exchangeName].askPrice;

          const previousBidPrice =
            this.orderBookPriceMap[symbolKey][exchangeName].bidPrice;

          if (askPrice !== previousAskPrice || previousBidPrice !== bidPrice) {
            this.orderBookPriceMap[symbolKey][exchangeName] = {
              askPrice,
              bidPrice,
            };

            // logger.log({ orderBookPriceMap: this.orderBookPriceMap });

            console.log({
              orderBookPriceMap: this.orderBookPriceMap,
            });

            this.orderbookDataArbitrage(
              this.orderBookPriceMap,
              smallQuantity
              // symbolKey,
              // exchangeName
            );
          }
        }
      );
    }
  }

  /**
   * iterate over orderbookPriceMap for checking Arbitrage opportunites
   * by comparing the askPrice and bidPrice for differnet exchange for a trade pair
   * @param orderBookPriceMap
   * @param smallQuantity a key-value pair of smallest quantity between asks or bids
   * @returns void
   */
  orderbookDataArbitrage(
    orderBookPriceMap: orderBookMap,
    smallQuantity: any
    // symbolKey: any,
    // exchangeName: string
  ) {
    // console.log({ length: Object.keys(orderBookPriceMap).length });
    for (const symbol in orderBookPriceMap) {
      for (const askPriceExchangeKey in orderBookPriceMap[symbol]) {
        let askPrice: number =
          orderBookPriceMap[symbol][askPriceExchangeKey].askPrice;

        for (const bidPriceExchangeKey in orderBookPriceMap[symbol]) {
          if (askPriceExchangeKey === bidPriceExchangeKey) continue;

          let bidPrice: number =
            orderBookPriceMap[symbol][bidPriceExchangeKey].bidPrice;

          if (bidPrice >= askPrice) {
            if (this.checkCondition(askPrice, bidPrice).valid) {
              this.actions.forEach((singleAction) => {
                singleAction.excuteAction({
                  symbol,
                  askPriceExchange: askPriceExchangeKey,
                  bidPriceExchange: bidPriceExchangeKey,
                  message: "Percentage differnce is greater than 1.0",
                  percentage_diffr: this.checkCondition(askPrice, bidPrice)
                    .data,
                  timestamp: Date.now(),
                  smallQuantity,
                });
              });
            } else {
              logger.log({
                message: "Pecentage differnce is less than 1.0",
                symbol,
                askPriceExchange: askPriceExchangeKey,
                bidPriceExchange: bidPriceExchangeKey,
                percentage_diffr: this.checkCondition(askPrice, bidPrice).data,
                timestamp: Date.now(),
                smallQuantity,
              });
            }
          } else {
            // console.log({ askPrice, bidPrice });
          }
        }
      }
    }
  }
}

export default Trigger;
