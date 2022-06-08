"use strict";
import BinanceExchange from "./src/services/BinanceExchange";
import CryptocomExchange from "./src/services/CryptocomExchange";
import FtxExchange from "./src/services/FtxExchange";
import ArbStrategy from "./src/services/ArbStrategy";
import checkForArbitrage from "./src/services/checkArbitrage";
import { LogzioLogger } from "./src/lib/logzioLogger";
import {
  ConsoleLogAction,
  LoggerAction,
  DummyArbAction,
} from "./src/services/AllActions";
require("dotenv").config();



const priceOracleInstances = [
  new BinanceExchange,
  new CryptocomExchange,
  new FtxExchange
]


export const allActions = {
  sync: [new ConsoleLogAction, new LoggerAction],
  async: [new DummyArbAction]
};


(async () => {
  try {
    let arbStrategyInstance = await new ArbStrategy(priceOracleInstances, allActions);
    await arbStrategyInstance.start(checkForArbitrage);
  } catch (error) {
    LogzioLogger.error(error);
  }
})();
