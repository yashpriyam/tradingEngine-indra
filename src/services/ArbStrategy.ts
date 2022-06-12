import { fork } from "child_process";
import { LogzioLogger } from "../lib/logzioLogger";
// import { tradeExecuterInstance } from "./TradeExecuter";

/**
 * ArbStrategy class to get the orderbook data
 * from different exchanges and execute actions based on checkCondition
 */
const sendOneTimeData = process.argv.slice(2)[0];
class ArbStrategy implements Strategy {
  private PriceOracleExtended: any[];
  private allTradePairsExchangeMap: { [key: string]: any }; // all trade pairs from all exchanges, in exchange format
  private commonSymbolMap: Map<string, string>;
  private instance: any
  private orderBookPriceMap: {};

  constructor(PriceOracleExtended: any[], actions: { [key: string]: any[]}) {
    this.PriceOracleExtended = PriceOracleExtended
    this.orderBookPriceMap = {};
    this.allTradePairsExchangeMap = {};
    this.commonSymbolMap = new Map();
    this.instance = (async () => {      
      await this.getAllTradePairs()
      return this;
    })();
    return this.instance
  }
  
  /**
   * Iterate over all price oracles instance and call the methods on every class instance
   * It calls a setHandler method to create a map of method and callback to handle messages for
   * different exchanges
   * @param checkCondition arbitrage condition
   * @returns void
   */
  async start(
    checkCondition: Function
  ) {

    for (let priceOracleInstance of this.PriceOracleExtended) {
      const socketClient = priceOracleInstance;
      const exchangeName = priceOracleInstance.exchangeName;


      // subscribe to websocket stream of all trade pair's orderbook channel for every exchange
      await socketClient.subscribeOrderBookDataForAllTradePairs();

      /**
       * this handler handles the message for orderbook data, it create a orderbookpricemap
       * to store the ask and bid price for every exchange for every symbol.
       * We pass that map to a function to find the arbitrage opportunities
       */      
      socketClient.setHandler(
        socketClient.orderbookhandlerMethod,
        (params: {
          asks: number[];
          bids: number[];
          symbol: string;
          data: string;
        }) => {
          let { asks, bids, symbol, data } = params;
          console.log({params});

          if(exchangeName === "kucoin"){
            symbol = symbol.split(":")[1];
          }

          LogzioLogger.info(JSON.stringify(params), {
            exchangeName,
            symbol,
            commonSymbol: this.commonSymbolMap[symbol],
          });

          // asks and bids may be empty or undefined
          if (
            typeof asks === "undefined" ||
            asks.length === 0 ||
            typeof bids === "undefined" ||
            bids.length === 0
          )
            return;

          // manage local orderbook for binance exchange
          if (exchangeName === "binance") {
            if (!priceOracleInstance.checkOrderBookData(data)) return;
          }

          const askPrice = asks[0][0]; // lowest of asks
          const askQuantity = asks[0][1];

          const bidPrice = bids[0][0]; // highest of bids
          const bidQuantity = bids[0][1];

          // console.log({orderBookPriceMap: this.orderBookPriceMap})

          // getting previous value of ask and bid
          let previousAskPrice =
              this.orderBookPriceMap[this.commonSymbolMap[symbol]][exchangeName].askPrice,
            previousBidPrice =
              this.orderBookPriceMap[this.commonSymbolMap[symbol]][exchangeName].bidPrice;

          // store new ask and bid price only if one of them is different from previous value
          if (askPrice !== previousAskPrice || previousBidPrice !== bidPrice) {
            this.orderBookPriceMap[this.commonSymbolMap[symbol]][exchangeName] = {
              askPrice,
              bidPrice,
              askQuantity,
              bidQuantity,
              exchangeSymbol: symbol,
            };

            this.check(
              checkCondition,
              this.commonSymbolMap[symbol],
              exchangeName
            );
          }
        }
      );
    }
  }

  /**
   * iterate over orderbookPriceMap for checking Arbitrage opportunites
   * by comparing the askPrice and bidPrice for differnet exchange for a trade pair
   * @param orderBookPriceMap
   * @param checkCondition
   * @param commonSymbolKey
   * @param exchangeName
   * @returns void
   */
  private check(
    checkCondition: Function,
    commonSymbolKey: string,
    exchangeName: string
  ) {
    // small quantity is the minimum quantity of the bid and ask
    let smallQuantity;

    const symbolDataToUpdate = this.orderBookPriceMap[commonSymbolKey];

    // this will be an object of { askPrice, bidPrice, askQuantity, bidQuantity }
    const updatedExchangeData = symbolDataToUpdate[exchangeName];

    // compare ask and bid price of updated exchange to all other exchange
    for (const exchangeNameKey in symbolDataToUpdate) {
      if (exchangeName === exchangeNameKey) continue;

      let orderbookExchangeData = symbolDataToUpdate[exchangeNameKey];

      let askPriceExchange = "",
        bidPriceExchange = "";

      // check arbitrage only if bid and ask is not empyty and bid price is greater than ask price
      if (
        orderbookExchangeData.bidPrice &&
        updatedExchangeData.askPrice &&
        orderbookExchangeData.bidPrice > updatedExchangeData.askPrice
      ) {
        askPriceExchange = exchangeName;
        bidPriceExchange = exchangeNameKey;

        let bidQuantity = orderbookExchangeData.bidQuantity;
        let askQuantity = updatedExchangeData.askQuantity;

        // getting minimum quantity between ask and bid
        smallQuantity =
          askQuantity <= bidQuantity
            ? { quantityKey: "ask", value: askQuantity }
            : { quantityKey: "bid", value: bidQuantity };

        this.logArbitrageMessage(
          askPriceExchange,
          bidPriceExchange,
          updatedExchangeData.askPrice,
          orderbookExchangeData.bidPrice,
          commonSymbolKey,
          checkCondition,
          smallQuantity
        );
      }

      // check arbitrage only if bid and ask is not empyty and bid price is greater than ask price
      if (
        updatedExchangeData.bidPrice &&
        orderbookExchangeData.askPrice &&
        updatedExchangeData.bidPrice > orderbookExchangeData.askPrice
      ) {
        askPriceExchange = exchangeNameKey;
        bidPriceExchange = exchangeName;

        let bidQuantity = updatedExchangeData.bidQuantity;
        let askQuantity = orderbookExchangeData.askQuantity;

        // getting minimum quantity between ask and bid
        smallQuantity =
          askQuantity <= bidQuantity
            ? { quantityKey: "ask", value: askQuantity }
            : { quantityKey: "bid", value: bidQuantity };

        this.logArbitrageMessage(
          askPriceExchange,
          bidPriceExchange,
          orderbookExchangeData.askPrice,
          updatedExchangeData.bidPrice,
          commonSymbolKey,
          checkCondition,
          smallQuantity
        );
      } else {
        LogzioLogger.info(
          JSON.stringify({ updatedExchangeData, orderbookExchangeData })
        );
      }
    }
  }


  private async getAllTradePairs (){    
    for (const priceOracleInstance of this.PriceOracleExtended) {
      this.allTradePairsExchangeMap = {
        ...this.allTradePairsExchangeMap,
        [priceOracleInstance.exchangeName]: [
          ...(await priceOracleInstance.getTradePairsList()),
        ],
      };
    }

    this.createCommonSymbolMap();
  };

  private createCommonSymbolMap = () => {
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

    for (const exchangeInstance of this.PriceOracleExtended) {
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

  private createCombinationForExchanges = (orderBookPriceMap: object) => {
    let exchangeCombinationCountMap: Object = {};

    for (let key in orderBookPriceMap) {
      let commonSymbol = orderBookPriceMap[key];

      let exchangeArray = Object.keys(commonSymbol);

      exchangeArray = exchangeArray.sort();

      let combinationsOfExchange = this.generateCombinationsForArray(
        exchangeArray,
        2
      );

      combinationsOfExchange.forEach((exchnageCombination) => {
        exchangeCombinationCountMap[exchnageCombination] =
          ++exchangeCombinationCountMap[exchnageCombination] || 1;
      });
    }

    for (let key in exchangeCombinationCountMap) {
      LogzioLogger.info(
        "count of combinations of exchanges having common trade Pairs",
        {
          exchangeCombinationKey: key,
          exchangeCombinationCount: exchangeCombinationCountMap[key],
        }
      );
    }
  };

  private generateCombinationsForArray = (array: string[], min: number) => {
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

  /**
   * This method check if arbitrage condition is valid or not.
   * If arbitrage occur then create child process otherwise just log a detailed message
   * on logz.io
   * @param askPriceExchange exchange name of ask
   * @param bidPriceExchange exchange name of bid
   * @param askPrice
   * @param bidPrice
   * @param symbol
   * @param checkCondition arbitrage condition
   * @param smallQuantity minimum quantity between ask and bid
   */
  private logArbitrageMessage = (
    askPriceExchange: string,
    bidPriceExchange: string,
    askPrice: number,
    bidPrice: number,
    symbol: string,
    checkCondition: Function,
    smallQuantity: any
  ) => {
    const { valid, data: percentage_diffr } = checkCondition(
      askPrice,
      bidPrice
    );

    // if arbitrage occur then create a child process and pass the data in child process to execute actions
    if (valid) {
      // creating a child process by passing the path of child process's file into fork method
      const forkedProcess = fork(`${__dirname}/callApi.js`);

      // arbitrage opporunity

      // logs for askPriceExchange
      LogzioLogger.info('arb-info', {
        buyData: {
          symbol,
          exchangeName: askPriceExchange,
          exchangeTradeKey: "ask",
          percentage_diffr,
          quantity: smallQuantity,
          tradeValue: askPrice * smallQuantity,
          unitPrice: askPrice,
          arbitrage: true,
          message: "Percentage differnce is greater than 1.0",
        },
        sellData: {
          symbol,
          exchangeName: bidPriceExchange,
          exchangeTradeKey: "bid",
          percentage_diffr,
          quantity: smallQuantity,
          tradeValue: bidPrice * smallQuantity,
          unitPrice: bidPrice,
          arbitrage: true,
          message: "Percentage differnce is greater than 1.0",
        },
      })

      LogzioLogger.info(
        JSON.stringify({
          tradePair: symbol,
          askPriceExchange,
          bidPriceExchange,
          message: "Percentage differnce is greater than 1.0",
          percentage_diffr,
          timestamp: Date.now(),
          quantity: smallQuantity.value,
          askPrice,
          bidPrice,
        }),
        {
          symbol,
          exchangeName: askPriceExchange,
          exchangeTradeKey: "ask",
          arbitrage: true,
          percentage_diffr,
        }
      );

      // logs for bidPriceExchange
      LogzioLogger.info(
        JSON.stringify({
          tradePair: symbol,
          askPriceExchange,
          bidPriceExchange,
          message: "Percentage differnce is greater than 1.0",
          percentage_diffr,
          timestamp: Date.now(),
          quantity: smallQuantity.value,
          askPrice,
          bidPrice,
        }),
        {
          symbol,
          exchangeName: bidPriceExchange,
          exchangeTradeKey: "bid",
          arbitrage: true,
          percentage_diffr,
        }
      );

      // passing data to child process to execute actions
      forkedProcess.send({
        data: {
          tradePair: symbol,
          askPriceExchange,
          bidPriceExchange,
          message: "Percentage differnce is greater than 1.0",
          percentage_diffr,
          timestamp: Date.now(),
          quantity: smallQuantity.value,
          askPrice,
          bidPrice,
        },
      });
    } else {
      LogzioLogger.info(
        JSON.stringify({
          message: "Pecentage differnce is less than 1.0",
          symbol,
          askPriceExchange,
          bidPriceExchange,
          percentage_diffr,
          timestamp: Date.now(),
          smallQuantity,
        })
      );
    }
  };
}

export default ArbStrategy;
