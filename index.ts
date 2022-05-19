"use strict";
import logger from "./src/lib/logger";
import Action from "./src/services/Action";
import BinancePriceOracle from "./src/services/BinancePriceOracle";
import checkForArbitrage from "./src/services/checkArbitrage";
import CryptocomPriceOracle from "./src/services/CryptocomPriceOracle";
import FtxPriceOracle from "./src/services/FtxPriceOracle";
import Trigger from "./src/services/Trigger";
import { fork } from "child_process";

// const LogAction = new Action(console.log);
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
  priceOracleInstances: any[];
  orderBookPriceMap: {};
  allTradePairsExchangeMap: { [key: string]: [] }; // all trade pairs from all exchanges, in exchange format
  /*
  {
    exchangeName: {all trade pairs in exchange format},
    exchangeName: {eth_btc: ETHBTC, eth_btc: ETHBTC},
    exchangeName: {all trade pairs}
  }

  {...Object.values(allTradePairsExchangeMap)} = > { eth_btc: ETHBTC, eth_btc: ETHBTC, eth_btc: ETHBTC } = commonsymbolMap

  Object.values(commonsymbolMap) = {...[ETHBTC, ETHBTC, ETHBTC]}: starting of OrderBookPriceMap

  { ETHBTC: ETHBTC, ETHBTC: ETHBTC, ETHBTC: ETHBTC }

  


  -> commonSymbolMap:
    {
      'SYMBOL_IN_EXCHANGE_FORMAT': 'commonSymbol',
      eth_btc: ETHBTC
      eth/btc: ETHBTC
      ETH_BTC: ETHBTC
    }:

  -> orderBookPriceMap======
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

  */
  tradePairsInCommonFormat: { [key: string]: {} };

  commonSymbolMap: Map<string, string>;
  /*
    {
      commonSymbol: {
        exchangeName: 'SYMBOL_IN_EXCHANGE_FORMAT',
        exchangeName: 'SYMBOL_IN_EXCHANGE_FORMAT',
        exchangeName: 'SYMBOL_IN_EXCHANGE_FORMAT',
      },
    }

    

    

    orderBookPriceMap[symbolMap[data]][exchangeName].askPrice
    orderBookPriceMap[symbolMap[data]][exchangeName].bidPrice

    binance: tradePairListOfExchangeInCommonFormat = {ETHBTC: eth_btc, BTCUSD: btc_usd}
    ftx: tradePairListOfExchangeInCommonFormat = {ETHBTC: eth/btc, BTCUSD: btc/usd}
    crypto: tradePairListOfExchangeInCommonFormat = {ETHBTC: ETH/BTC, BTCUSD: BTC/USD}
    store this all in allTradePairsExchangeMap

    Getting data from exchanges:
    getTradePairs -> allTradePairsExchangeMap -> commonSymbolsMap -> orderBookPriceMap

    Receiving ws stream updates:

    exchangeSpecificSymbolFormat ->
    commonSymbolsMap -> gets commonSymbol -> orderBookPriceMap: matches common symbol and updates ask price, bid price


*/

  constructor() {
    super();
    this.priceOracleInstances = [
      new BinancePriceOracle(),
      new CryptocomPriceOracle(),
      new FtxPriceOracle(),
    ];
    this.orderBookPriceMap = {};
    this.allTradePairsExchangeMap = {};
    this.tradePairsInCommonFormat = {};
    this.commonSymbolMap = new Map();

    // remove all the logic for creating symbol maps from trigger class
    // and put'em all here, so that all the DS are created before calling the listenstream method
  }

  // getting all trade pairs from each exchange: allTradePairsExchangeMap
  getAllTradePairs = async () => {
    for (const priceOracleInstance of this.priceOracleInstances) {
      const { commonTradePairMap } =
        await priceOracleInstance.getTradePairsList();

      this.allTradePairsExchangeMap = {
        ...this.allTradePairsExchangeMap,
        [priceOracleInstance.exchangeName]: { ...commonTradePairMap },
      };
    }

    this.createCommonSymbolMap();
    this.createOrderBookPriceMap();
  };

  createCommonSymbolMap = () => {
    // for (let exchangeKey in this.allTradePairsExchangeMap) {
    //   // let tradePairsForExchange: string[] =
    //   //   this.allTradePairsExchangeMap[exchangeKey];
    //   // tradePairsForExchange.forEach((tradePair) => {
    //   //   this.commonSymbolMap[tradePair] = tradePair
    //   //     .replace(/[^a-z0-9]/gi, "")
    //   //     .toUpperCase();
    //   // });
    // }
    // this.commonSymbolMap = { ...Object.values(this.allTradePairsExchangeMap) };
    // console.log({ value: this.allTradePairsExchangeMap });
    // console.log({ commonSymbolMap: this.commonSymbolMap });
  };

  createOrderBookPriceMap = () => {};

  listenArbirageStream = () => {
    this.listenStream(
      this.priceOracleInstances,
      this.orderBookPriceMap,
      this.commonSymbolMap,
      [],
      checkForArbitrage
    );
  };
}

// const ArbitrageTrigger1 = new Trigger(
//   [
//     {
//       priceOracleInstance: new BinancePriceOracle(),
//       exchangeName: "binance",
//       handlerMethod: "depthUpdate",
//     },
//     {
//       priceOracleInstance: new CryptocomPriceOracle(),
//       exchangeName: "cryptocom",
//       handlerMethod: "book",
//     },
//     {
//       priceOracleInstance: new FtxPriceOracle(),
//       exchangeName: "ftx",
//       handlerMethod: "orderbook",
//     },
//   ],

//   [LogAction, logzLoggerAction],
//   checkForArbitrage
// );

(async () => {
  let arbitrageTriggerInstance = new ArbitrageTrigger();
  await arbitrageTriggerInstance.getAllTradePairs();
  arbitrageTriggerInstance.listenArbirageStream();
})();
