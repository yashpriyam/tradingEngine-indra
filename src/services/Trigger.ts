import logger from "../lib/logger";
import Action from "./Action";

class Trigger {
  /**
   * Iterate over all price oracles instance and call the methods on every class instance
   * It calls a setHandler method to create a map of method and callback to handle messages for
   * different exchanges
   * @returns void
   */
  async listenStream(
    priceOraclesInstances: any[],
    orderBookPriceMap: { [key: string]: {} },
    commonSymbolMap: Map<string, string>,
    actions: Action[],
    checkCondition: Function
  ) {
    for (let priceOracleInstance of priceOraclesInstances) {
      const socketClient = priceOracleInstance;
      const exchangeName = socketClient.exchangeName;

      await socketClient.subscribeOrderBookDataForAllTradePairs();

      /**
       * this handler handles the message for orderbook data, it create a object map
       * to store the ask and bid price for every exchange for every symbol.
       * We pass that map to a function to find the arbitrage opportunities
       */
      socketClient.setHandler(
        socketClient.orderbookhandlerMethod,
        (params: {
          asks: number[];
          bids: number[];
          symbol: string;
          data: string;
        }) => {
          let { asks, bids, symbol, data } = params;

          // asks and bids may be empty or undefined
          if (
            typeof asks === "undefined" ||
            asks.length === 0 ||
            typeof bids === "undefined" ||
            bids.length === 0
          )
            return;

          if (priceOracleInstance.exchangeName === "binance") {
            if (!priceOracleInstance.checkOrderBookData(data)) return;
          }

          const askPrice = asks[0][0]; // lowest of asks
          const askQuantity = asks[0][1];

          const bidPrice = bids[0][0];
          // const bidPrice = bids[bids.length - 1][0]; // lowest of bids
          const bidQuantity = bids[0][1];

          // get a key value pair whose quantity is lesser
          const smallQuantity =
            askQuantity >= bidQuantity ? { askQuantity } : { bidQuantity };

          // New logic: for updating orderBookPriceMap from ws data stream
          // orderBookPriceMap[symbolMap[data]][exchangeName].askPrice
          // orderBookPriceMap[symbolMap[data]][exchangeName].bidPrice

          let previousAskPrice =
              orderBookPriceMap[commonSymbolMap[symbol]][exchangeName].askPrice,
            previousBidPrice =
              orderBookPriceMap[commonSymbolMap[symbol]][exchangeName].bidPrice;

          if (askPrice !== previousAskPrice || previousBidPrice !== bidPrice) {
            orderBookPriceMap[commonSymbolMap[symbol]][exchangeName] = {
              askPrice,
              bidPrice,
              exchangeSymbol: symbol,
            };

            // logger.log({ orderBookPriceMap: this.orderBookPriceMap });

            this.orderbookDataArbitrage(
              orderBookPriceMap,
              smallQuantity,
              actions,
              checkCondition
              // commonSymbolKey,
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
    smallQuantity: any,
    actions: any[],
    checkCondition: Function
    // commonSymbolKey: any,
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

          const { valid, data } = checkCondition(askPrice, bidPrice);

          if (bidPrice >= askPrice) {
            if (valid) {
              actions.forEach((singleAction) => {
                singleAction.excuteAction({
                  symbol,
                  askPriceExchange: askPriceExchangeKey,
                  bidPriceExchange: bidPriceExchangeKey,
                  message: "Percentage differnce is greater than 1.0",
                  percentage_diffr: data,
                  timestamp: Date.now(),
                  smallQuantity,
                });
              });
            } else {
              console.log({
                message: "Pecentage differnce is less than 1.0",
                symbol,
                askPriceExchange: askPriceExchangeKey,
                bidPriceExchange: bidPriceExchangeKey,
                percentage_diffr: data,
                timestamp: Date.now(),
                smallQuantity,
              });
            }
          } else {
            console.log("bidPrice is lower than askPrice", {
              askPrice,
              bidPrice,
            });
          }
        }
      }
    }
  }

  logArbitrageMessage = (
    askPriceExchange: string,
    bidPriceExchange: string,
    askPrice: number,
    bidPrice: number,
    symbol: string,
    checkCondition: Function,
    smallQuantity: number,
    actions: any[]
  ) => {
    if (checkCondition(askPrice, bidPrice).valid) {
      actions.forEach((singleAction) => {
        singleAction.excuteAction({
          symbol,
          askPriceExchange,
          bidPriceExchange,
          message: "Percentage differnce is greater than 1.0",
          percentage_diffr: checkCondition(askPrice, bidPrice).data,
          timestamp: Date.now(),
          smallQuantity,
        });
      });
    } else {
      logger.log({
        message: "Pecentage differnce is less than 1.0",
        symbol,
        askPriceExchange,
        bidPriceExchange,
        percentage_diffr: checkCondition(askPrice, bidPrice).data,
        timestamp: Date.now(),
        smallQuantity,
      });
    }
  };
}

export default Trigger;
