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
console.log({ logger });

// const logzLoggerAction = new Action(logger.log);

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
  allTradePairsExchangeMap: { [key: string]: any }; // all trade pairs from all exchanges, in exchange format
  /*
  {
    exchangeName: [eth_btc, eth_btc, eth_btc],
    exchangeName: {eth_btc: ETHBTC, eth_btc: ETHBTC},
  }
  */
  commonSymbolMap: Map<string, string>;
  /*
    -> commonSymbolMap:
    {
      'SYMBOL_IN_EXCHANGE_FORMAT': 'commonSymbol',
      eth_btc: ETHBTC
      eth/btc: ETHBTC
      ETH_BTC: ETHBTC
    }:
  */
  orderBookPriceMap: {};
  /*
    -> orderBookPriceMap======
      {
        commonSymbol: {
          exchangeName: {askPrice, bidPrice, exchangeSymbol},
          exchangeName: {askPrice, bidPrice, exchangeSymbol},
        },
        commonSymbol: {
          exchangeName: {askPrice, bidPrice, exchangeSymbol},
        },
      }

      {
      "ETETER", -> exchangeSymbol -> 
      "WERWERE",
      "EWRRRER"
    }
  
    */
  /*
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
    this.commonSymbolMap = new Map();
  }

  // getting all trade pairs from each exchange: allTradePairsExchangeMap
  getAllTradePairs = async () => {
    for (const priceOracleInstance of this.priceOracleInstances) {
      this.allTradePairsExchangeMap = {
        ...this.allTradePairsExchangeMap,
        [priceOracleInstance.exchangeName]: [
          ...(await priceOracleInstance.getTradePairsList()),
        ],
      };
    }

    // console.log({ value: this.allTradePairsExchangeMap });

    this.createCommonSymbolMap();
  };

  createCommonSymbolMap = () => {
    const commonSymbolFreq = {};
    // const commonSymbolWithFreq1 = {}

    for (let exchangeKey in this.allTradePairsExchangeMap) {
      let tradePairsForExchange: string[] =
        this.allTradePairsExchangeMap[exchangeKey];

      tradePairsForExchange.forEach((tradePair) => {
        const commonSymbol = tradePair.replace(/[^a-z0-9]/gi, "").toUpperCase();
        this.commonSymbolMap[tradePair] = commonSymbol;
        commonSymbolFreq[commonSymbol] = ++commonSymbolFreq[commonSymbol] || 1;
        this.orderBookPriceMap[commonSymbol] = {
          ...this.orderBookPriceMap[commonSymbol],
          [exchangeKey]: {
            askPrice: "",
            bidPrice: "",
            exchangeSymbol: tradePair,
          },
        };
      });
      this.allTradePairsExchangeMap[exchangeKey] = { ...this.commonSymbolMap };
    }
    console.log({ comm: this.commonSymbolMap });

    // get rid of all commonSymbols with value 1 in commonSymbolFreq
    for (const [key, value] of Object.entries(commonSymbolFreq)) {
      if (value === 1) {
        const [exchangeName, { exchangeSymbol }]: [string, any] = [
          Object.keys(this.orderBookPriceMap[key])[0],
          Object.values(this.orderBookPriceMap[key])[0],
        ];

        delete this.allTradePairsExchangeMap[exchangeName][exchangeSymbol];
        delete this.commonSymbolMap[exchangeSymbol];
        delete this.orderBookPriceMap[key];
      }
    }

    for (const exchangeInstance of this.priceOracleInstances) {
      const { exchangeName, updateTradePairsList }: any = exchangeInstance;
      updateTradePairsList([
        ...Object.keys(this.allTradePairsExchangeMap[exchangeName]),
      ]);
    }

    console.log({ allTradePairsExchangeMap: this.allTradePairsExchangeMap });

    console.log({ orderBookPriceMap: this.orderBookPriceMap });
  };

  listenArbirageStream = () => {
    this.listenStream(
      this.priceOracleInstances,
      this.orderBookPriceMap,
      this.commonSymbolMap,
      [LogAction],
      checkForArbitrage
    );
  };
}

export const allActions = [LogAction];

(async () => {
  let arbitrageTriggerInstance = new ArbitrageTrigger();
  await arbitrageTriggerInstance.getAllTradePairs();
  arbitrageTriggerInstance.listenArbirageStream();
})();
