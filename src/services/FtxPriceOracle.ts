import axios from "axios";
import PriceOracle from "./PriceOracle";

export default class FtxPriceOracle extends PriceOracle {
  FtxWsInstance: {};
  wsUrl: string;
  FtxTradePairsList: string[];

  constructor() {
    super();
    this.wsUrl = "wss://ftx.com/ws/";
    this.FtxWsInstance = this._createSocket(this.wsUrl);
    this.FtxTradePairsList = this.getFtxTradePairsList();
  }

  getFtxTradePairsList = () => {
    let exchangeInfo = axios.get("https://ftx.com/api/markets");
    let symbols: any = [];
    exchangeInfo.then((res) => {
      res.data["result"].forEach((symbolObj: any) => {
        symbols.push(symbolObj.name);
      });
      console.log({ symbols });
    });

    this.FtxTradePairsList = ["BTC/USDT", "ETH/BTC"];
    return this.FtxTradePairsList;
  };

  subscribeOrderBookDataForAllTradePairs = () => {
    for (const tradePair of this.FtxTradePairsList) {
      const subscriberObject = {
        op: "subscribe",
        market: tradePair,
        channel: "orderbook",
      };
      this.subscribeStream(subscriberObject, this.FtxWsInstance);
    }
    this.getFtxMessageStream();
  };

  getFtxMessageStream = () => {
    this.getMessageStream(this.FtxWsInstance, {
      asks: "data.asks",
      bids: "data.bids",
      symbol: "market",
      methodPath: "channel",
    });
  };
}
