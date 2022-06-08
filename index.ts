"use strict";
import BinanceExchange from "./src/services/BinanceExchange";
import CryptocomExchange from "./src/services/CryptocomExchange";
import FtxExchange from "./src/services/FtxExchange";
import ArbStrategy from "./src/services/ArbStrategy";
import checkForArbitrage from "./src/services/checkArbitrage";
import { LogzioLogger } from "./src/lib/logzioLogger";
import {
  ConsoleLogAction, LoggerAction, DummyArbAction
} from "./src/services/AllActions";
import KucoinExchange from "./src/services/KucoinExchange";
import BitfinexExchange from "./src/services/BitfinexExchange";
require("dotenv").config();



const PriceOracleExtended = [
  // new BinanceExchange,
  // new CryptocomExchange,
  // new FtxExchange,
  new KucoinExchange,
  // new BitfinexExchange
]


export const allActions = {
  sync: [new ConsoleLogAction, new LoggerAction],
  async: [new DummyArbAction]
};


(async () => {
  try {
    let arbStrategyInstance = await new ArbStrategy(PriceOracleExtended, allActions);
    await arbStrategyInstance.start(checkForArbitrage);
  } catch (error) {
    console.log({error})
    LogzioLogger.debug(error);
  }
})();
