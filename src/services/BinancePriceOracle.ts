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
    this.binanceTradePairsList = ["btcusdt", "ethbtc"];
    // this.binanceTradePairsList = this.getBinanceTradePairsList();
  }

  getBinanceTradePairsList = async () => {
    let exchangeInfo = await axios.get(
      "https://api.binance.com/api/v3/exchangeInfo"
    );
    let symbols: any = [];
    exchangeInfo.data["symbols"].forEach((symbolObj: any) =>
      symbols.push(symbolObj.symbol.toLowerCase())
    );
    console.log({ symbols });
    this.binanceTradePairsList = symbols.splice(1, 5);

    // use this.binanceWsInstance to get trade pairs list
    // populate tradePairs array
    // this.binanceTradePairsList = ["btcusdt", "ethbtc"];
    return this.binanceTradePairsList;
  };

  subscribeOrderBookDataForAllTradePairs = () => {
    let id = 0;
    console.log(this.binanceTradePairsList);
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
