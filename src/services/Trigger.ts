import logger from "../lib/logger";
import Action from "./Action";

class Trigger {
  priceOracles: any[];
  actions: Action[];
  checkCondition: Function;
  orderBookPriceMap: orderBookMap;

  constructor(
    priceOracles: any[],
    actions: Action[],
    checkCondition: Function
  ) {
    this.priceOracles = priceOracles;
    this.actions = actions;
    this.checkCondition = checkCondition;
    this.orderBookPriceMap = {};
  }

  async listenStream() {
    for (let { priceOracleInstance, exchangeName, handlerMethod } of this
      .priceOracles) {
      const socketClient = priceOracleInstance;

      // await socketClient.getBinanceTradePairsList();

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

          if (exchangeName === "cryptocom")
            symbol = symbol.split("_").join("").toUpperCase();
          else if (exchangeName === "binance") symbol = symbol.toUpperCase();
          else if (exchangeName === "ftx")
            symbol = symbol.split("/").join("").toUpperCase();

          const askPrice = asks[0][0]; // lowest of asks
          const askQuantity = asks[0][1];

          const bidPrice = bids[bids.length - 1][0]; // lowest of bids
          const bidQuantity = bids[0][1];

          const smallQuantity =
            askQuantity >= bidQuantity ? { askQuantity } : { bidQuantity };

          if (!this.orderBookPriceMap[symbol])
            this.orderBookPriceMap[symbol] = {};

          if (!this.orderBookPriceMap[symbol][exchangeName])
            this.orderBookPriceMap[symbol][exchangeName] = {};

          const previousAskPrice =
            this.orderBookPriceMap[symbol][exchangeName].askPrice;

          const previousBidPrice =
            this.orderBookPriceMap[symbol][exchangeName].bidPrice;

          if (askPrice !== previousAskPrice || previousBidPrice !== bidPrice) {
            this.orderBookPriceMap[symbol][exchangeName] = {
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
              // symbol,
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
    // symbol: string,
    // exchangeName: string
  ) {
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
