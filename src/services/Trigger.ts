import Action from "./Action";
import ExchangeData from "./ExchangeData";

class Trigger {
  exchangeData: ExchangeData;
  orderBookPriceMap: orderBookPriceMap;
  action: Action;
  checkForArbitrage: Function;

  constructor(
    checkForArbitrage: Function,
    exchangeData: ExchangeData,
    action: Action
  ) {
    this.exchangeData = exchangeData;
    this.orderBookPriceMap = {};
    this.action = action;
    this.checkForArbitrage = checkForArbitrage;
  }

  async getOrderBookData() {
    try {
      this.orderBookPriceMap = await this.exchangeData.watchOrderBookData();
    } catch (error) {
      console.error({ error });
    }

    console.log({ priceOrderMap: this.orderBookPriceMap });

    for (const askPriceExchangeKey in this.orderBookPriceMap) {
      let askPrice: number =
        this.orderBookPriceMap[askPriceExchangeKey].askPrice;

      for (const bidPriceExchangeKey in this.orderBookPriceMap) {
        let bidPrice: number =
          this.orderBookPriceMap[bidPriceExchangeKey].bidPrice;

        if (this.checkForArbitrage(askPrice, bidPrice)) {
          this.action.excuteAction({
            askPriceExchange: askPriceExchangeKey,
            bidPriceExchange: bidPriceExchangeKey,
            message: "Percentage differnce is greater than 1.0",
          });
        } else {
          console.log("Pecentage differnce is not greater than 1.0");
        }
      }
    }
  }
}

export default Trigger;
