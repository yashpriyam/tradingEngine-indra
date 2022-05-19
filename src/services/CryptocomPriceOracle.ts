import axios from "axios";
import PriceOracle from "./PriceOracle";

export default class CryptocomPriceOracle extends PriceOracle {
  CryptocomWsInstance: {};
  wsUrl: string;
  CryptocomTradePairsList: string[];
  exchangeName: "cryptocom";
  orderbookhandlerMethod: "book";

  constructor() {
    super();
    this.wsUrl = "wss://stream.crypto.com/v2/market";
    this.CryptocomWsInstance = this._createSocket(this.wsUrl);
    // this.CryptocomTradePairsList = [];
    this.CryptocomTradePairsList = ["BTC_USDT", "ETH_BTC"];
    this.exchangeName = "cryptocom";
    this.orderbookhandlerMethod = "book";
  }

  /**
   * get all the trade pairs for cryptocom exchange and store them in an array
   * @returns void
   */
  getTradePairsList = async () => {
    let exchangeInfo = await axios.get("https://api.crypto.com/v1/symbols");

    let tradePairs: any = [];
    exchangeInfo.data.data.forEach((symbolObj: any) =>
      tradePairs.push(symbolObj.symbol)
    );
    this.CryptocomTradePairsList = tradePairs.splice(1, 90);
    return this.CryptocomTradePairsList;
  };

  /**
   * subscribe to orderbook stream of cryptcom exchange
   * for every trade pair
   * @returns void
   */
  subscribeOrderBookDataForAllTradePairs = () => {
    let id = 0;
    for (const tradePair of this.CryptocomTradePairsList) {
      const subscriberObject = {
        id: ++id,
        method: "subscribe",
        params: {
          channels: [`book.${tradePair}.20`],
        },
      };
      this.subscribeStream(subscriberObject, this.CryptocomWsInstance);
    }
    this.getCryptocomMessageStream();
  };

  /**
   * call the base class method "getMessageStream" for
   * getting message for cryptocom exchange and pass a data format to it.
   * @returns void
   */
  getCryptocomMessageStream = () => {
    this.getMessageStream(this.CryptocomWsInstance, {
      asks: "result.data.[].asks",
      bids: "result.data.[].bids",
      symbol: "result.instrument_name",
      methodPath: "result.channel",
    });
  };
}
