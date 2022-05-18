import axios from "axios";
import { zb } from "ccxt.pro";
import PriceOracle from "./PriceOracle";
// import fetch from "node-fetch";

export default class BinancePriceOracle extends PriceOracle {
  binanceWsInstance: {};
  wsUrl: string;
  binanceTradePairsList: string[];
  exchangeName: 'binance'

  constructor() {
    super();
    this.wsUrl = "wss://stream.binance.com:9443/ws";
    this.binanceWsInstance = this._createSocket(this.wsUrl);
    // this.binanceTradePairsList = [];
    this.binanceTradePairsList = ["btcusdt", "ethbtc"];
    this.exchangeName = 'binance'
  }

  /**
   * get all the trade pairs for binance exchange and store them in an array
   * @returns void
   */
  getTradePairsList = async () => {
    let exchangeInfo = await axios.get(
      "https://api.binance.com/api/v3/exchangeInfo"
    );
    let tradePairs: any = [];
    exchangeInfo.data["symbols"].forEach((symbolObj: any) =>
      tradePairs.push(symbolObj.symbol.toLowerCase())
    );

    // const tradePairListOfExchangeInCommonFormat = {} // {ETHBTC: eth_btc, BTCUSD: btc_usd}
    // tradePairs.forEach((tradePair: string, idx: number) => {
    //   // [A-Z, a-z, 0-9]
    //   // const commonFormatOfTradePair = tradePair.allTheFilters
    //   tradePairListOfExchangeInCommonFormat[commonFormatOfTradePair] = tradePair
    // })

    this.binanceTradePairsList = tradePairs.splice(1, 5);
    // return {
    //   binanceTradePairsList: this.binanceTradePairsList,
    //   tradePairListOfExchangeInCommonFormat,
    // }
  };

  /**
   * subscribe to orderbook stream of binance exchange
   * for every trade pair
   * @returns void
   */
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

  /**
   * call the base class method "getMessageStream" for
   * getting message for binance exchange and pass a data format to it.
   * @returns void
   */
  getBinanceMessageStream = () => {
    this.getMessageStream(this.binanceWsInstance, {
      asks: "a",
      bids: "b",
      symbol: "s",
      methodPath: "e",
    });
  };
}
