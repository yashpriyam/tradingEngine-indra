import { fork } from "child_process";
import { LogzioLogger } from "../lib/logzioLogger";

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
    checkCondition: Function
  ) {
    for (let priceOracleInstance of priceOraclesInstances) {
      const socketClient = priceOracleInstance;
      const exchangeName = priceOracleInstance.exchangeName;

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

          LogzioLogger.info(JSON.stringify(params), {
            exchangeName,
            symbol,
            commonSymbol: commonSymbolMap[symbol],
          });

          // asks and bids may be empty or undefined
          if (
            typeof asks === "undefined" ||
            asks.length === 0 ||
            typeof bids === "undefined" ||
            bids.length === 0
          )
            return;

          if (exchangeName === "binance") {
            if (!priceOracleInstance.checkOrderBookData(data)) return;
          }

          const askPrice = asks[0][0]; // lowest of asks
          const askQuantity = asks[0][1];

          const bidPrice = bids[0][0]; // highest of bids
          const bidQuantity = bids[0][1];

          let previousAskPrice =
              orderBookPriceMap[commonSymbolMap[symbol]][exchangeName].askPrice,
            previousBidPrice =
              orderBookPriceMap[commonSymbolMap[symbol]][exchangeName].bidPrice;

          if (askPrice !== previousAskPrice || previousBidPrice !== bidPrice) {
            orderBookPriceMap[commonSymbolMap[symbol]][exchangeName] = {
              askPrice,
              bidPrice,
              askQuantity,
              bidQuantity,
              exchangeSymbol: symbol,
            };

            this.orderbookDataArbitrage(
              orderBookPriceMap,
              checkCondition,
              commonSymbolMap[symbol],
              exchangeName
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
   * @param checkCondition
   * @param commonSymbolKey
   * @param exchangeName
   * @returns void
   */
  orderbookDataArbitrage(
    orderBookPriceMap: orderBookMap,
    checkCondition: Function,
    commonSymbolKey: string,
    exchangeName: string
  ) {
    let smallQuantity;

    const symbolDataToUpdate = orderBookPriceMap[commonSymbolKey];

    // this will be an object of { askPrice, bidPrice }
    const updatedExchangeData = symbolDataToUpdate[exchangeName];

    for (const exchangeNameKey in symbolDataToUpdate) {
      if (exchangeName === exchangeNameKey) continue;

      let orderbookExchangeData = symbolDataToUpdate[exchangeNameKey];

      let askPriceExchange = "",
        bidPriceExchange = "";

      if (
        orderbookExchangeData.bidPrice &&
        updatedExchangeData.askPrice &&
        orderbookExchangeData.bidPrice > updatedExchangeData.askPrice
      ) {
        askPriceExchange = exchangeName;
        bidPriceExchange = exchangeNameKey;

        let bidQuantity = orderbookExchangeData.bidQuantity;
        let askQuantity = updatedExchangeData.askQuantity;

        smallQuantity =
          askQuantity <= bidQuantity
            ? { quantityKey: "ask", value: askQuantity }
            : { quantityKey: "bid", value: bidQuantity };

        this.logArbitrageMessage(
          askPriceExchange,
          bidPriceExchange,
          updatedExchangeData.askPrice,
          orderbookExchangeData.bidPrice,
          commonSymbolKey,
          checkCondition,
          smallQuantity
        );
      }

      if (
        updatedExchangeData.bidPrice &&
        orderbookExchangeData.askPrice &&
        updatedExchangeData.bidPrice > orderbookExchangeData.askPrice
      ) {
        askPriceExchange = exchangeNameKey;
        bidPriceExchange = exchangeName;

        let bidQuantity = updatedExchangeData.bidQuantity;
        let askQuantity = orderbookExchangeData.askQuantity;

        smallQuantity =
          askQuantity <= bidQuantity
            ? { quantityKey: "ask", value: askQuantity }
            : { quantityKey: "bid", value: bidQuantity };

        this.logArbitrageMessage(
          askPriceExchange,
          bidPriceExchange,
          orderbookExchangeData.askPrice,
          updatedExchangeData.bidPrice,
          commonSymbolKey,
          checkCondition,
          smallQuantity
        );
      } else {
        LogzioLogger.info(
          JSON.stringify({ updatedExchangeData, orderbookExchangeData })
        );
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
    smallQuantity: any
  ) => {
    const { valid, data } = checkCondition(askPrice, bidPrice);

    if (valid) {
      const forkedProcess = fork(`${__dirname}/callApi.js`);

      forkedProcess.send({
        data: {
          tradePair: symbol,
          askPriceExchange,
          bidPriceExchange,
          message: "Percentage differnce is greater than 1.0",
          percentage_diffr: data,
          timestamp: Date.now(),
          quantity: smallQuantity.value,
          askPrice,
          bidPrice,
        },
      });
    } else {
      LogzioLogger.info(
        JSON.stringify({
          message: "Pecentage differnce is less than 1.0",
          symbol,
          askPriceExchange,
          bidPriceExchange,
          percentage_diffr: data,
          timestamp: Date.now(),
          smallQuantity,
        })
      );
    }
  };
}

export default Trigger;
