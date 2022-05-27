"use strict";
import BinancePriceOracle from "./src/services/BinancePriceOracle";
import checkForArbitrage from "./src/services/checkArbitrage";
import CryptocomPriceOracle from "./src/services/CryptocomPriceOracle";
import FtxPriceOracle from "./src/services/FtxPriceOracle";
import Trigger from "./src/services/Trigger";
import { LogAction, DummyServerApiCallAction } from "./src/services/AllActions";
require("dotenv").config();

/**
 * create an instance for arbitrage trigger to trigger the orderbook data
 * for different exchange
 */

class ArbitrageTrigger extends Trigger {
  priceOracleInstances: any[];
  allTradePairsExchangeMap: { [key: string]: any }; // all trade pairs from all exchanges, in exchange format
  /*
  {
    exchangeName: {eth_btc: ETHBTC, eth_btc: ETHBTC},
  }
  */
  commonSymbolMap: Map<string, string>;
  /*
    -> commonSymbolMap:
    {
      eth_btc: ETHBTC
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
    // console.log({ comm: this.commonSymbolMap });

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

export const allActions = [DummyServerApiCallAction];

(async () => {
  let arbitrageTriggerInstance = new ArbitrageTrigger();
  await arbitrageTriggerInstance.getAllTradePairs();
  arbitrageTriggerInstance.listenArbirageStream();
})();
