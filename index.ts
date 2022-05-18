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

class ArbitrageTrigger extends Trigger {
  priceOracleInstances: any[]
  orderBookPriceMap: {}
  allTradePairsExchangeMap: {[key: string]: {}} // all trade pairs from all exchanges, in exchange format
  /*
  {
    exchangeName: {all trade pairs in exchange format},
    exchangeName: {all trade pairs},
    exchangeName: {all trade pairs}
  }
  */
  tradePairsInCommonFormat: {[key: string]: {}}
/*
{
  commonSymbol: {
    exchangeName: 'SYMBOL_IN_EXCHANGE_FORMAT',
    exchangeName: 'SYMBOL_IN_EXCHANGE_FORMAT',
    exchangeName: 'SYMBOL_IN_EXCHANGE_FORMAT',
  },
  commonSymbol: {
    exchangeName: 'SYMBOL_IN_EXCHANGE_FORMAT',
    exchangeName: 'SYMBOL_IN_EXCHANGE_FORMAT',
    exchangeName: 'SYMBOL_IN_EXCHANGE_FORMAT',
  },
}

orderBookPriceMap======
{
  commonSymbol: {
    exchangeName: {askPrice, bidPrice},
    exchangeName: {askPrice, bidPrice},
    exchangeName: {askPrice, bidPrice},
  },
  commonSymbol: {
    exchangeName: {askPrice, bidPrice},
    exchangeName: {askPrice, bidPrice},
    exchangeName: {askPrice, bidPrice},
  },
}

symbolMap
{
  'SYMBOL_IN_EXCHANGE_FORMAT': 'commonSymbol',
  eth_btc: ETHBTC
  eth/btc: ETHBTC
  ETH_BTC: ETHBTC
}

orderBookPriceMap[symbolMap[data]][exchangeName].askPrice
orderBookPriceMap[symbolMap[data]][exchangeName].bidPrice

binance: tradePairListOfExchangeInCommonFormat = {ETHBTC: eth_btc, BTCUSD: btc_usd}
ftx: tradePairListOfExchangeInCommonFormat = {ETHBTC: eth/btc, BTCUSD: btc/usd}
crypto: tradePairListOfExchangeInCommonFormat = {ETHBTC: ETH/BTC, BTCUSD: BTC/USD}
store this all in allTradePairsExchangeMap
*/

  constructor(){
    super()
    this.priceOracleInstances = [new BinancePriceOracle(), new CryptocomPriceOracle(), new FtxPriceOracle()]
    this.orderBookPriceMap = {}
    this.allTradePairsExchangeMap = {}
    this.tradePairsInCommonFormat = {}

    // getting all trade pairs from each exchange: allTradePairsExchangeMap
    for (const priceOracleInstance of this.priceOracleInstances) {
      this.allTradePairsExchangeMap = {...this.allTradePairsExchangeMap,
        [priceOracleInstance.exchangeName]: [...priceOracleInstance.getTradePairsList().binanceTradePairsList]
      }
    }
    // remove all the logic for creating symbol maps from trigger class
    // and put'em all here, so that all the DS are created before calling the listenstream method
  }
}
const ArbitrageTrigger1 = new Trigger(
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

new ArbitrageTrigger().listenStream();
