import axios from "axios";
import PriceOracle from "./PriceOracle";
// import fetch from "node-fetch";

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
    let exchangeInfo = axios.get("https://api.binance.com/api/v3/exchangeInfo");
    let symbols: any = [];
    exchangeInfo.then((res) => {
      res.data["symbols"].forEach((symbolObj: any) => {
        symbols.push(symbolObj.symbol);
      });
      console.log({ symbols });
    });

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
    this.getMessageStream(this.binanceWsInstance, {
      asks: "a",
      bids: "b",
      symbol: "s",
      methodPath: "e",
    });
  };
}
