import axios from "axios";
import PriceOracle from "./PriceOracle";

export default class FtxPriceOracle extends PriceOracle {
  FtxWsInstance: {};
  wsUrl: string;
  tradePairsList: string[];
  exchangeName: "ftx";
  orderbookhandlerMethod: "orderbook";

  constructor() {
    super();
    this.wsUrl = "wss://ftx.com/ws/";
    this.FtxWsInstance = this._createSocket(this.wsUrl);
    this.tradePairsList = ["BTC/USDT", "ETH/BTC"];
    this.exchangeName = "ftx";
    this.orderbookhandlerMethod = "orderbook";
  }

  /**
   * get all the trade pairs for ftx exchange and store them in an array
   * @returns void
   */
  getTradePairsList = async () => {
    let exchangeInfo = await axios.get("https://ftx.com/api/markets");
    let tradePairs: any = [];
    const commonTradePairMap = {};

    exchangeInfo.data.result.forEach((symbolObj: any) => {
      if (symbolObj.volumeUsd24h > Number(process.env.DAILY_TRADE_VOLUME_LIMIT)) {
        tradePairs.push(symbolObj.name);
      }
    });

    this.tradePairsList = [...tradePairs]
    return this.tradePairsList;
  };

  updateTradePairsList = (tradePairsArray: string[]) => {
    this.tradePairsList = [...tradePairsArray]
  }

  /**
   * subscribe to orderbook stream of ftx exchange
   * for every trade pair
   * @returns void
   */
  subscribeOrderBookDataForAllTradePairs = () => {
    for (const tradePair of this.tradePairsList) {
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
