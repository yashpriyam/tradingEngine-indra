import axios from "axios";
import PriceOracle from "./PriceOracle";

export default class CryptocomPriceOracle extends PriceOracle {
  CryptocomWsInstance: {};
  wsUrl: string;
  CryptocomTradePairsList: string[];

  constructor() {
    super();
    this.wsUrl = "wss://stream.crypto.com/v2/market";
    this.CryptocomWsInstance = this._createSocket(this.wsUrl);
    this.CryptocomTradePairsList = [];
    // this.CryptocomTradePairsList = ["BTC_USDT", "ETH_BTC"];
  }

  getTradePairsList = async () => {
    let exchangeInfo = await axios.get("https://api.crypto.com/v1/symbols");

    let symbols: any = [];
    exchangeInfo.data.data.forEach((symbolObj: any) =>
      symbols.push(symbolObj.symbol)
    );
    // console.log({ symbols });
    this.CryptocomTradePairsList = symbols.splice(1, 90);
  };

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

  getCryptocomMessageStream = () => {
    this.getMessageStream(this.CryptocomWsInstance, {
      asks: "result.data.[].asks",
      bids: "result.data.[].bids",
      symbol: "result.instrument_name",
      methodPath: "result.channel",
    });
  };
}
