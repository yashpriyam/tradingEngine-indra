"use strict";
import logger from "./src/lib/logger";
import Action from "./src/services/Action";
import BinancePriceOracle from "./src/services/BinancePriceOracle";
import checkForArbitrage from "./src/services/checkArbitrage";
import CryptocomPriceOracle from "./src/services/CryptocomPriceOracle";
import FtxPriceOracle from "./src/services/FtxPriceOracle";
import Trigger from "./src/services/Trigger";

export const orderBookPriceMap: orderBookMap = {};

const LogAction = new Action(console.log);
const logzLoggerAction = new Action(logger.log);

const ArbitrageTrigger = new Trigger(
  [
    {
      priceOracleInstance: new BinancePriceOracle(),
      exchangeName: "binance",
      handlerMethod: "depthUpdate",
    },
    {
      priceOracleInstance: new CryptocomPriceOracle(),
      exchangeName: "cryptocom",
      handlerMethod: "book",
    },
    {
      priceOracleInstance: new FtxPriceOracle(),
      exchangeName: "ftx",
      handlerMethod: "orderbook",
    },
  ],

  [LogAction, logzLoggerAction],
  checkForArbitrage
);

ArbitrageTrigger.listenStream();

//

// // const exchangesName: string[] = [
// //   // "binance",
// //   "bitfinex",
// //   "ftx",
// //   "bittrex",
// //   // "kucoin",
// // ];

// let cryptoComUrl: string = "wss://stream.crypto.com/v2/market";
// let binanceUrl: string = "wss://stream.binance.com:9443/ws";
// let ftxUrl: string = "wss://ftx.com/ws/";

// const LogAction = new Action(console.log);
// const LogzIOAction = new Action(logger.log);

// const orderBookData = new ExchangeData([
//   {
//     exchangeName: "cryptocom",
//     url: cryptoComUrl,
//     dataFormat: {
//       symbol: "result.instrument_name",
//       orderbookData: "result.data",
//     },
//   },
//   // {
//   //   exchangeName: "binance",
//   //   url: binanceUrl,
//   // },
//   // {
//   //   exchangeName: "ftx",
//   //   url: ftxUrl,
//   // },
// ]);

// const orderbookTrigger = new Trigger(
//   orderBookData,
//   [LogAction],
//   checkForArbitrage
// );

// orderbookTrigger.getOrderBookData();

// /*

// Trigger class always have three arguments
// ([] of data source/price oracle instances, array of actions, conditions)

//   const orderbookTrigger = new Trigger(
//     [orderBookData],
//     [LogAction, apiCallAction],
//     conditionFunction
//   );

// */
