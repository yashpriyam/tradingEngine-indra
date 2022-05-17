import logger from "../lib/logger";
import Action from "./Action";

class Trigger {
  priceOracles: any[];
  actions: Action[];
  checkCondition: Function;
  orderBookPriceMap: orderBookMap;
  symbolMap: Map<string, string>;

  constructor(
    priceOracles: any[],
    actions: Action[],
    checkCondition: Function
  ) {
    this.priceOracles = priceOracles;
    this.actions = actions;
    this.checkCondition = checkCondition;
    this.orderBookPriceMap = {};
    this.symbolMap = new Map();
  }

  createCommonSymbolMap() {}

  async listenStream() {
    for (let { priceOracleInstance, exchangeName, handlerMethod } of this
      .priceOracles) {
      const socketClient = priceOracleInstance;

      // await socketClient.getTradePairsList();

      // this.createCommonSymbolMap(socketClient.);

      socketClient.subscribeOrderBookDataForAllTradePairs();
      // socketClient.setHandler(handlerMethod, console.log);

      socketClient.setHandler(
        handlerMethod,
        (params: { asks: number[]; bids: number[]; symbol: string }) => {
          let { asks, bids, symbol } = params;

          // console.log({ params, exchangeName });

          // asks and bids may be empty or undefined
          if (
            typeof asks === "undefined" ||
            asks.length === 0 ||
            typeof bids === "undefined" ||
            bids.length === 0
          )
            return;

          let symbolKey: any = "";

          if (this.symbolMap.has(exchangeName + symbol)) {
            symbolKey = this.symbolMap.get(exchangeName + symbol);
          } else {
            symbolKey = symbol.split("_").join("").toUpperCase();
            if (exchangeName === "cryptocom")
              this.symbolMap.set(exchangeName + symbol, symbolKey);
            else if (exchangeName === "binance") {
              symbolKey = symbol.toUpperCase();
              this.symbolMap.set(exchangeName + symbol, symbolKey);
            } else if (exchangeName === "ftx") {
              symbolKey = symbol.split("/").join("").toUpperCase();
              this.symbolMap.set(exchangeName + symbol, symbolKey);
            }
          }

          // if (exchangeName === "cryptocom")
          //   symbolKey = symbol.split("_").join("").toUpperCase();
          // else if (exchangeName === "binance") symbolKey = symbol.toUpperCase();
          // else if (exchangeName === "ftx")
          //   symbolKey = symbol.split("/").join("").toUpperCase();

          const askPrice = asks[0][0]; // lowest of asks
          const askQuantity = asks[0][1];

          const bidPrice = bids[bids.length - 1][0]; // lowest of bids
          const bidQuantity = bids[0][1];

          const smallQuantity =
            askQuantity >= bidQuantity ? { askQuantity } : { bidQuantity };

          if (!this.orderBookPriceMap[symbolKey])
            this.orderBookPriceMap[symbolKey] = {};

          if (!this.orderBookPriceMap[symbolKey][exchangeName])
            this.orderBookPriceMap[symbolKey][exchangeName] = {};

          const previousAskPrice =
            this.orderBookPriceMap[symbolKey][exchangeName].askPrice;

          const previousBidPrice =
            this.orderBookPriceMap[symbolKey][exchangeName].bidPrice;

          if (askPrice !== previousAskPrice || previousBidPrice !== bidPrice) {
            this.orderBookPriceMap[symbolKey][exchangeName] = {
              askPrice,
              bidPrice,
            };

            // logger.log({ orderBookPriceMap: this.orderBookPriceMap });

            console.log({
              orderBookPriceMap: this.orderBookPriceMap,
            });

            this.orderbookDataArbitrage(
              this.orderBookPriceMap,
              smallQuantity
              // symbolKey,
              // exchangeName
            );
          }
        }
      );
    }
  }

  orderbookDataArbitrage(
    orderBookPriceMap: orderBookMap,
    smallQuantity: any
    // symbolKey: any,
    // exchangeName: string
  ) {
    console.log({ length: Object.keys(orderBookPriceMap).length });
    for (const symbol in orderBookPriceMap) {
      for (const askPriceExchangeKey in orderBookPriceMap[symbol]) {
        let askPrice: number =
          orderBookPriceMap[symbol][askPriceExchangeKey].askPrice;

        for (const bidPriceExchangeKey in orderBookPriceMap[symbol]) {
          if (askPriceExchangeKey === bidPriceExchangeKey) continue;

          let bidPrice: number =
            orderBookPriceMap[symbol][bidPriceExchangeKey].bidPrice;

          if (bidPrice * 100 >= askPrice) {
            if (this.checkCondition(askPrice, bidPrice).valid) {
              this.actions.forEach((singleAction) => {
                singleAction.excuteAction({
                  symbol,
                  askPriceExchange: askPriceExchangeKey,
                  bidPriceExchange: bidPriceExchangeKey,
                  message: "Percentage differnce is greater than 1.0",
                  percentage_diffr: this.checkCondition(askPrice, bidPrice)
                    .data,
                  timestamp: Date.now(),
                  smallQuantity,
                });
              });
            } else {
              logger.log({
                message: "Pecentage differnce is less than 1.0",
                symbol,
                askPriceExchange: askPriceExchangeKey,
                bidPriceExchange: bidPriceExchangeKey,
                percentage_diffr: this.checkCondition(askPrice, bidPrice).data,
                timestamp: Date.now(),
                smallQuantity,
              });
            }
          } else {
            // console.log({ askPrice, bidPrice });
          }
        }
      }
    }
  }

  // async getOrderBookData() {
  //   let orderBookGenerator = this.exchangeData.getOrderBookData();

  //   for await (let orderBookPriceMap of orderBookGenerator) {
  //     // console.log({ priceOrderMap: orderBookPriceMap });

  //     this.orderbookDataArbitrage(orderBookPriceMap);
  //   }
  // }
}

export default Trigger;

/* 
{
  "BTCUSD":{
    "binance":{
      askPrice: 100,
      bp : 100
    }, 
    "ftx":{
      ask
    }
  }
} */

/* 

{

  commonSymbol :{
    exchange : symbol,
    exchange : symbol,
    exchange : symbol,
  }, 
  commonSymbol :{
    exchange : symbol,
    exchange : symbol,
    exchange : symbol,
  }, 

}

*/
