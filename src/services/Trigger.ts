import Action from "./Action";
import BinancePriceOracle from "./BinancePriceOracle";

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

  listenStream() {
    for (let { priceOracleInstance, exchangeName, handlerMethod } of this
      .priceOracles) {
      const socketClient = priceOracleInstance;
      socketClient.subscribeOrderBookDataForAllTradePairs();
      // socketClient.setHandler(handlerMethod, console.log);

      socketClient.setHandler(
        "orderbook",
        (params: { askPrice: number; bidPrice: number; symbol: string }) => {
          // console.log(params);
          // orderBookPriceMap
        }
      );
    }
  }

  // async getOrderBookData() {
  //   let orderBookGenerator = this.exchangeData.getOrderBookData();

  //   for await (let orderBookPriceMap of orderBookGenerator) {
  //     // console.log({ priceOrderMap: orderBookPriceMap });

  //     this.orderbookDataArbitrage(orderBookPriceMap);
  //   }
  // }

  // orderbookDataArbitrage(orderBookPriceMap: orderBookPriceMap) {
  //   for (const symbol in orderBookPriceMap) {
  //     for (const askPriceExchangeKey in orderBookPriceMap[symbol]) {
  //       let askPrice: number =
  //         orderBookPriceMap[symbol][askPriceExchangeKey].askPrice;

  //       for (const bidPriceExchangeKey in orderBookPriceMap[symbol]) {
  //         if (askPriceExchangeKey === bidPriceExchangeKey) continue;
  //         let bidPrice: number =
  //           orderBookPriceMap[symbol][bidPriceExchangeKey].bidPrice;

  //         if (bidPrice >= askPrice) {
  //           if (this.checkCondition(askPrice, bidPrice)) {
  //             this.actions.forEach((singleAction) => {
  //               singleAction.excuteAction({
  //                 symbol,
  //                 askPriceExchange: askPriceExchangeKey,
  //                 bidPriceExchange: bidPriceExchangeKey,
  //                 message: "Percentage differnce is greater than 1.0",
  //               });
  //             });
  //           } else {
  //             // console.log("Pecentage differnce is not greater than 1.0");
  //           }
  //         } else {
  //           // console.log({ askPrice, bidPrice });
  //         }
  //       }
  //     }
  //   }
  // }
}

export default Trigger;
