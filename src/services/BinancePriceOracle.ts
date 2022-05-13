import PriceOracle from "./PriceOracle";

export default class BinancePriceOracle extends PriceOracle {
  binanceWsInstance: {};
  wsUrl: string;
  binanceTradePairsList: string[];

  constructor() {
    super();
    this.wsUrl = "wss://stream.binance.com:9443/ws";
    this.binanceWsInstance = this._createSocket(this.wsUrl);
    this.binanceTradePairsList = this.getBinanceTradePairsList();
  }

  getBinanceTradePairsList = () => {
    // use this.binanceWsInstance to get trade pairs list
    // populate tradePairs array
    this.binanceTradePairsList = ["btcusdt", "ethbtc"];
    return this.binanceTradePairsList;
  };

  subscribeOrderBookDataForAllTradePairs = () => {
    let id = 0;
    for (const tradePair of this.binanceTradePairsList) {
      const subscriberObject = {
        method: "SUBSCRIBE",
        params: [`${tradePair}@depth`],
        id: ++id,
      };
      this.subscribeStream(subscriberObject, this.binanceWsInstance);
    }
    this.getBinanceMessageStream();
  };

  getBinanceMessageStream = () => {
    // define how to get the required Data
    this.getMessageStream(this.binanceWsInstance, {
      askPrice: "a",
      bidPrice: "b",
      symbol: "s",
      methodPath: "e",
    });
  };
}
