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
    /* 
      we can use this api to get symbols and volume both
     https://api.crypto.com/v2/public/get-ticker
    */
    // let exchangeInfo = await axios.get("https://api.crypto.com/v1/symbols");

    let tradePairs: any = [];
    const commonTradePairMap = {};

    let tradePairsList = await axios.get(
      "https://api.crypto.com/v2/public/get-ticker"
    );

    tradePairsList.data &&
      tradePairsList.data.result &&
      tradePairsList.data.result.data.forEach((symbolObj: any) => {
        if (symbolObj.v > 5000000) {
          tradePairs.push(symbolObj.i);
          commonTradePairMap[symbolObj.i] = symbolObj.i
            .replace(/[^a-z0-9]/gi, "")
            .toUpperCase();
        }
      });

    // console.log({ tradePairs, commonTradePairMap });

    this.CryptocomTradePairsList = tradePairs.splice(1, 90);

    return { commonTradePairMap };
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
