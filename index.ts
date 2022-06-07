"use strict";
import BinanceExchange from "./src/services/BinanceExchange";
import checkForArbitrage from "./src/services/checkArbitrage";
import CryptocomExchange from "./src/services/CryptocomExchange";
import FtxExchange from "./src/services/FtxExchange";
import Trigger from "./src/services/Trigger";
import {
  LogAction,
  DummyServerApiCallAction,
  LogzLoggerAction,
} from "./src/services/AllActions";
import { LogzioLogger } from "./src/lib/logzioLogger";
import Action from "./src/services/Action";
require("dotenv").config();

//  ONE_TIME_DATA
const sendOneTimeData = process.argv.slice(2)[0];

/**
 * create an instance for arbitrage trigger to trigger the orderbook data
 * for different exchange
 */
class ArbitrageTrigger extends Trigger {
  priceOracleInstances: any[];
  allTradePairsExchangeMap: { [key: string]: any }; // all trade pairs from all exchanges, in exchange format

  commonSymbolMap: Map<string, string>;

  orderBookPriceMap: {};

  constructor() {
    super();
    this.priceOracleInstances = [
      new BinanceExchange(),
      new CryptocomExchange(),
      new FtxExchange(),
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

    this.createCommonSymbolMap();
  };

  createCommonSymbolMap = () => {
    const commonSymbolFreq = {};

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
            askQuantity: "",
            bidQuantity: "",
            exchangeSymbol: tradePair,
          },
        };
      });

      this.allTradePairsExchangeMap[exchangeKey] = { ...this.commonSymbolMap };
    }

    // get rid of all commonSymbols with value 1 in commonSymbolFreq
    for (const [key, value] of Object.entries(commonSymbolFreq)) {
      if (value === 1) {
        const [exchangeName, { exchangeSymbol }]: [string, any] = [
          Object.keys(this.orderBookPriceMap[key])[0],
          Object.values(this.orderBookPriceMap[key])[0],
        ];

        if (sendOneTimeData)
          LogzioLogger.info(
            "trade pair which do not overlap with other exchange",
            {
              exchangeSymbol,
              exchangeName,
              commonSymbol: this.commonSymbolMap[exchangeSymbol],
              overlap: false,
            }
          );

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

    if (sendOneTimeData)
      this.createCombinationForExchanges(this.orderBookPriceMap);

    if (sendOneTimeData)
      LogzioLogger.info(
        JSON.stringify({
          allTradePairsExchangeMap: this.allTradePairsExchangeMap,
          orderBookPriceMap: this.orderBookPriceMap,
          commonSymbolMap: this.commonSymbolMap,
        })
      );
  };

  // create Combination For Exchanges having common trade pairs
  createCombinationForExchanges = (orderBookPriceMap: object) => {
    let exchangeCombinationCountMap: Object = {};

    for (let key in orderBookPriceMap) {
      let commonSymbol = orderBookPriceMap[key];

      let exchangeArray = Object.keys(commonSymbol);

      exchangeArray = exchangeArray.sort();

      let combinationsOfExchange = this.generateCombinationsForArray(
        exchangeArray,
        2
      );

      // console.log({ combinationsOfExchange });

      combinationsOfExchange.forEach((exchnageCombination) => {
        exchangeCombinationCountMap[exchnageCombination] =
          ++exchangeCombinationCountMap[exchnageCombination] || 1;
      });
    }

    // LogzioLogger.info(
    //   "count of combinations of exchanges having common trade Pairs",
    //   {
    //     ...exchangeCombinationCountMap,
    //   }
    // );

    for (let key in exchangeCombinationCountMap) {
      // console.log({
      //   exchangeCombinationKey: key,
      //   exchangeCombinationCount: exchangeCombinationCountMap[key],
      // });

      LogzioLogger.info(
        "count of combinations of exchanges having common trade Pairs",
        {
          exchangeCombinationKey: key,
          exchangeCombinationCount: exchangeCombinationCountMap[key],
        }
      );
    }
  };

  // code for creating combinations from given array
  generateCombinationsForArray = (array: string[], min: number) => {
    const fn = function (
      n: number,
      src: string[],
      got: string[],
      all: string[]
    ) {
      if (n == 0) {
        if (got.length > 0) {
          all[all.length] = got.join("-");
        }
        return;
      }
      for (let j = 0; j < src.length; j++) {
        fn(n - 1, src.slice(j + 1), got.concat([src[j]]), all);
      }
      return;
    };

    let all: string[] = [];
    for (let i = min; i < array.length; i++) {
      fn(i, array, [], all);
    }
    all.push(array.join("-"));
    return all;
  };

  listenArbitrageStream = () => {
    this.listenStream(
      this.priceOracleInstances,
      this.orderBookPriceMap,
      this.commonSymbolMap,
      checkForArbitrage
    );
  };
}

export const allActions = [
  LogAction,
  // LogzLoggerAction,
  // DummyServerApiCallActions
];

(async () => {
  let arbitrageTriggerInstance = new ArbitrageTrigger();

  try {
    await arbitrageTriggerInstance.getAllTradePairs();
    arbitrageTriggerInstance.listenArbitrageStream();
  } catch (error) {
    LogzioLogger.error({ error });
  }
})();
