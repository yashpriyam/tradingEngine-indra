import axios from "axios";
import PriceOracle from "./PriceOracle";

export default class FtxPriceOracle extends PriceOracle {
  FtxWsInstance: {};
  wsUrl: string;
  FtxTradePairsList: string[];
  exchangeName: "ftx";

  constructor() {
    super();
    this.wsUrl = "wss://ftx.com/ws/";
    this.FtxWsInstance = this._createSocket(this.wsUrl);
    // this.FtxTradePairsList = [];
    this.FtxTradePairsList = ["BTC/USDT", "ETH/BTC"];
    this.exchangeName = "ftx";
  }

  /**
   * get all the trade pairs for ftx exchange and store them in an array
   * @returns void
   */
  getTradePairsList = async () => {
    let exchangeInfo = await axios.get("https://ftx.com/api/markets");
    let tradePairs: any = [];

    exchangeInfo.data.result.forEach((symbolObj: any) => {
      tradePairs.push(symbolObj.name);
    });

    this.FtxTradePairsList = tradePairs.splice(0, 100);
  };

  /**
   * subscribe to orderbook stream of ftx exchange
   * for every trade pair
   * @returns void
   */
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

  /**
   * call the base class method "getMessageStream" for
   * getting message for ftx exchange and pass a data format to it.
   * @returns void
   */
  getFtxMessageStream = () => {
    this.getMessageStream(this.FtxWsInstance, {
      asks: "data.asks",
      bids: "data.bids",
      symbol: "market",
      methodPath: "channel",
    });
  };
}
