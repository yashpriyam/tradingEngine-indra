import Action from "./Action";
import ExchangeData from "./ExchangeData";

class Trigger {
  exchangeData: ExchangeData;
  actions: Action[];
  checkCondition: Function;

  constructor(
    exchangeData: ExchangeData,
    actions: Action[],
    checkCondition: Function
  ) {
    this.exchangeData = exchangeData;
    this.actions = actions;
    this.checkCondition = checkCondition;
  }

  async getOrderBookData() {
    let orderBookGenerator = this.exchangeData.getOrderBookData();

    for await (let orderBookPriceMap of orderBookGenerator) {
      console.log({ priceOrderMap: orderBookPriceMap });

      for (const askPriceExchangeKey in orderBookPriceMap) {
        let askPrice: number = orderBookPriceMap[askPriceExchangeKey].askPrice;

        for (const bidPriceExchangeKey in orderBookPriceMap) {
          if (askPriceExchangeKey === bidPriceExchangeKey) continue;

          let bidPrice: number =
            orderBookPriceMap[bidPriceExchangeKey].bidPrice;

          if (this.checkCondition(askPrice, bidPrice)) {
            this.actions.forEach((singleAction) => {
              singleAction.excuteAction({
                askPriceExchange: askPriceExchangeKey,
                bidPriceExchange: bidPriceExchangeKey,
                message: "Percentage differnce is greater than 1.0",
              });
            });
          } else {
            console.log("Pecentage differnce is not greater than 1.0");
          }
        }
      }
    }
  }
}

export default Trigger;
