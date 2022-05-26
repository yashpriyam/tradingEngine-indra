import Action from "./Action";
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
    actions: Action[],
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

          LogzioLogger.info(JSON.stringify(params));

          // console.log({
          //   params,
          //   exchangeName,
          // });

          // asks and bids may be empty or undefined
          if (
            typeof asks === "undefined" ||
            asks.length === 0 ||
            typeof bids === "undefined" ||
            bids.length === 0
          )
            return;

          // console.log({
          //   params,
          //   exchangeName,
          // });

          if (exchangeName === "binance") {
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
   * @param smallQuantity a key-value pair of smallest quantity between asks or bids
   * @returns void
   */
  orderbookDataArbitrage(
    orderBookPriceMap: orderBookMap,
    smallQuantity: any,
    actions: any[],
    checkCondition: Function,
    commonSymbolKey: string,
    exchangeName: string
  ) {
    // Efficient approach
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

        // TODO -  for getting small quantity we need to think again,

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
        console.log({ updatedExchangeData, orderbookExchangeData });
      }
    }

    /* for (const symbol in orderBookPriceMap) {
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
              // actions.forEach((singleAction) => {
              const forkedProcess = fork(`${__dirname}/callApi.js`);

              forkedProcess.send({
                // method: singleAction.excuteAction.toString(),

                method: function hello() {
                  // something
                }.toString(),

                data: {
                  symbol,
                  askPriceExchange: askPriceExchangeKey,
                  bidPriceExchange: bidPriceExchangeKey,
                  message: "Percentage differnce is greater than 1.0",
                  percentage_diffr: data,
                  timestamp: Date.now(),
                  smallQuantity,
                },
              });

              // singleAction.excuteAction({
              //   symbol,
              //   askPriceExchange: askPriceExchangeKey,
              //   bidPriceExchange: bidPriceExchangeKey,
              //   message: "Percentage differnce is greater than 1.0",
              //   percentage_diffr: data,
              //   timestamp: Date.now(),
              //   smallQuantity,
              // });
              // });
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
    } */
  }

  logArbitrageMessage = (
    askPriceExchange: string,
    bidPriceExchange: string,
    askPrice: number,
    bidPrice: number,
    symbol: string,
    checkCondition: Function,
    smallQuantity: number
  ) => {
    const { valid, data } = checkCondition(askPrice, bidPrice);

    if (valid) {
      const forkedProcess = fork(`${__dirname}/callApi.ts`);

      forkedProcess.send({
        // method: singleAction.excuteAction.toString(),
        method: function hello() {
          // console.log("hello");
        }.toString(),

        data: {
          symbol,
          askPriceExchange,
          bidPriceExchange,
          message: "Percentage differnce is greater than 1.0",
          percentage_diffr: data,
          timestamp: Date.now(),
          smallQuantity,
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
