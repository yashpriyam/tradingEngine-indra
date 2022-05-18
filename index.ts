"use strict";
import logger from "./src/lib/logger";
import Action from "./src/services/Action";
import BinancePriceOracle from "./src/services/BinancePriceOracle";
import checkForArbitrage from "./src/services/checkArbitrage";
import CryptocomPriceOracle from "./src/services/CryptocomPriceOracle";
import FtxPriceOracle from "./src/services/FtxPriceOracle";
import Trigger from "./src/services/Trigger";
import { fork } from "child_process";

const LogAction = new Action(console.log);
const logzLoggerAction = new Action(logger.log);

// const forkedProcess = fork(`${__dirname}/src/services/callApi.js`);

// forkedProcess.send({
//   exchangeName: "binance",
// });

// forkedProcess.on("message", async (message: any) => {
//   console.log({
//     binaceInstance: JSON.parse(message.binancePriceOracleInstance),
//     otherFunction: message.stringFunction,
//   });

//   let { stringFunction } = message;
//   let asyncFn = new Function("return " + stringFunction)();
//   let data = await asyncFn();
//   console.log({ data });
// });

/**
 * create an instance for arbitrage trigger to trigger the orderbook data
 * for different exchange
 */
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
