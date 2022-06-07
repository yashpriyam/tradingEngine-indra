"use strict";
import BinanceExchange from "./src/services/BinanceExchange";
import CryptocomExchange from "./src/services/CryptocomExchange";
import FtxExchange from "./src/services/FtxExchange";
import ArbStrategy from "./src/services/ArbStrategy";
import checkForArbitrage from "./src/services/checkArbitrage";
import {
  LogAction,
  DummyServerApiCallAction,
  LogzLoggerAction,
} from "./src/services/AllActions";
import { LogzioLogger } from "./src/lib/logzioLogger";
require("dotenv").config();



const priceOracleInstances = [
  new BinanceExchange,
  new CryptocomExchange,
  new FtxExchange
]


export const allActions = [
  LogAction,
  // LogzLoggerAction,
  // DummyServerApiCallActions
];

(async () => {
  try {
    let arbStrategyInstance = await new ArbStrategy(priceOracleInstances, allActions);
    await arbStrategyInstance.start(checkForArbitrage);
  } catch (error) {
    LogzioLogger.error({ error });
  }
})();
