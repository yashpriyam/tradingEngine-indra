import { fork } from "child_process";
import { LogzioLogger } from "../lib/logzioLogger";
import { tradeExecuterInstance } from "./TradeExecuter";

class Trigger {
  /**
   * Iterate over all price oracles instance and call the methods on every class instance
   * It calls a setHandler method to create a map of method and callback to handle messages for
   * different exchanges
   * @param priceOraclesInstances array of instance of different exhchanges
   * @param orderBookPriceMap object for storing ask and bid price
   * @param commonSymbolMap mapping for exchange symbol to common symbol
   * @param checkCondition arbitrage condition
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

      // subscribe to websocket stream of all trade pair's orderbook channel for every exchange
      await socketClient.subscribeOrderBookDataForAllTradePairs();

      /**
       * this handler handles the message for orderbook data, it create a orderbookpricemap
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

          // manage local orderbook for binance exchange
          if (exchangeName === "binance") {
            if (!priceOracleInstance.checkOrderBookData(data)) return;
          }

          const askPrice = asks[0][0]; // lowest of asks
          const askQuantity = asks[0][1];

          const bidPrice = bids[0][0]; // highest of bids
          const bidQuantity = bids[0][1];

          // getting previous value of ask and bid
          let previousAskPrice =
              orderBookPriceMap[commonSymbolMap[symbol]][exchangeName].askPrice,
            previousBidPrice =
              orderBookPriceMap[commonSymbolMap[symbol]][exchangeName].bidPrice;

          // store new ask and bid price only if one of them is different from previous value
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
    // small quantity is the minimum quantity of the bid and ask
    let smallQuantity;

    const symbolDataToUpdate = orderBookPriceMap[commonSymbolKey];

    // this will be an object of { askPrice, bidPrice, askQuantity, bidQuantity }
    const updatedExchangeData = symbolDataToUpdate[exchangeName];

    // compare ask and bid price of updated exchange to all other exchange
    for (const exchangeNameKey in symbolDataToUpdate) {
      if (exchangeName === exchangeNameKey) continue;

      let orderbookExchangeData = symbolDataToUpdate[exchangeNameKey];

      let askPriceExchange = "",
        bidPriceExchange = "";

      // check arbitrage only if bid and ask is not empyty and bid price is greater than ask price
      if (
        orderbookExchangeData.bidPrice &&
        updatedExchangeData.askPrice &&
        orderbookExchangeData.bidPrice > updatedExchangeData.askPrice
      ) {
        askPriceExchange = exchangeName;
        bidPriceExchange = exchangeNameKey;

        let bidQuantity = orderbookExchangeData.bidQuantity;
        let askQuantity = updatedExchangeData.askQuantity;

        // getting minimum quantity between ask and bid
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

      // check arbitrage only if bid and ask is not empyty and bid price is greater than ask price
      if (
        updatedExchangeData.bidPrice &&
        orderbookExchangeData.askPrice &&
        updatedExchangeData.bidPrice > orderbookExchangeData.askPrice
      ) {
        askPriceExchange = exchangeNameKey;
        bidPriceExchange = exchangeName;

        let bidQuantity = updatedExchangeData.bidQuantity;
        let askQuantity = orderbookExchangeData.askQuantity;

        // getting minimum quantity between ask and bid
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

  /**
   * This method check if arbitrage condition is valid or not.
   * If arbitrage occur then create child process otherwise just log a detailed message
   * on logz.io
   * @param askPriceExchange exchange name of ask
   * @param bidPriceExchange exchange name of bid
   * @param askPrice
   * @param bidPrice
   * @param symbol
   * @param checkCondition arbitrage condition
   * @param smallQuantity minimum quantity between ask and bid
   */
  logArbitrageMessage = (
    askPriceExchange: string,
    bidPriceExchange: string,
    askPrice: number,
    bidPrice: number,
    symbol: string,
    checkCondition: Function,
    smallQuantity: any
  ) => {
    const { valid, data: percentage_diffr } = checkCondition(
      askPrice,
      bidPrice
    );

    // if arbitrage occur then create a child process and pass the data in child process to execute actions
    if (valid) {
      // creating a child process by passing the path of child process's file into fork method
      const forkedProcess = fork(`${__dirname}/callApi.js`);

      // arbitrage opporunity

      // logs for askPriceExchange
      LogzioLogger.info(
        JSON.stringify({
          tradePair: symbol,
          askPriceExchange,
          bidPriceExchange,
          message: "Percentage differnce is greater than 1.0",
          percentage_diffr,
          timestamp: Date.now(),
          quantity: smallQuantity.value,
          askPrice,
          bidPrice,
        }),
        {
          symbol,
          exchangeName: askPriceExchange,
          exchangeTradeKey: "ask",
          arbitrage: true,
          percentage_diffr,
        }
      );

      // logs for bidPriceExchange
      LogzioLogger.info(
        JSON.stringify({
          tradePair: symbol,
          askPriceExchange,
          bidPriceExchange,
          message: "Percentage differnce is greater than 1.0",
          percentage_diffr,
          timestamp: Date.now(),
          quantity: smallQuantity.value,
          askPrice,
          bidPrice,
        }),
        {
          symbol,
          exchangeName: bidPriceExchange,
          exchangeTradeKey: "bid",
          arbitrage: true,
          percentage_diffr,
        }
      );

      tradeExecuterInstance.randomMessageExecuter(
        askPriceExchange,
        bidPriceExchange,
        symbol,
        percentage_diffr
      );

      // passing data to child process to execute actions
      forkedProcess.send({
        data: {
          tradePair: symbol,
          askPriceExchange,
          bidPriceExchange,
          message: "Percentage differnce is greater than 1.0",
          percentage_diffr,
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
          percentage_diffr,
          timestamp: Date.now(),
          smallQuantity,
        })
      );
    }
  };
}

export default Trigger;
