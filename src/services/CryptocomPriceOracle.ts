import axios from "axios";
import PriceOracle from "./PriceOracle";

export default class CryptocomPriceOracle extends PriceOracle {
  CryptocomWsInstance: {};
  wsUrl: string;
  tradePairsList: string[];
  exchangeName: "cryptocom";
  orderbookhandlerMethod: "book";

  constructor() {
    super();
    this.wsUrl = "wss://stream.crypto.com/v2/market";
    this.CryptocomWsInstance = this._createSocket(this.wsUrl);
    this.tradePairsList = [];
    this.exchangeName = "cryptocom";
    this.orderbookhandlerMethod = "book";
  }

  /**
   * get all the trade pairs for cryptocom exchange and store them in an array
   * @returns void
   */
  getTradePairsList = async () => {
    let tradePairs: any = [];

    let tradePairsList = await axios.get(
      "https://api.crypto.com/v2/public/get-ticker"
    );

    tradePairsList.data &&
      tradePairsList.data.result &&
      tradePairsList.data.result.data.forEach((symbolObj: any) => {
        if (symbolObj.v > Number(process.env.DAILY_TRADE_VOLUME_LIMIT)) {
          tradePairs.push(symbolObj.i);
        }
      });

    this.tradePairsList = [...tradePairs];
    return this.tradePairsList;
  };

  /**
   * subscribe to orderbook stream of cryptcom exchange
   * for every trade pair
   * @returns void
   */
  subscribeOrderBookDataForAllTradePairs = async () => {
    let id = 0;
    for (const tradePair of this.tradePairsList) {
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

  updateTradePairsList = (tradePairsArray: string[]) => {
    this.tradePairsList = [...tradePairsArray];
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
