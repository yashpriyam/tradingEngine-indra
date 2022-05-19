import axios from "axios";
import { zb } from "ccxt.pro";
import PriceOracle from "./PriceOracle";
// import fetch from "node-fetch";

export default class BinancePriceOracle extends PriceOracle {
  binanceWsInstance: {};
  wsUrl: string;
  binanceTradePairsList: string[];
  exchangeName: "binance";
  orderbookhandlerMethod: "depthUpdate";

  constructor() {
    super();
    this.wsUrl = "wss://stream.binance.com:9443/ws";
    this.binanceWsInstance = this._createSocket(this.wsUrl);
    // this.binanceTradePairsList = [];
    this.binanceTradePairsList = ["btcusdt", "ethbtc"];
    this.exchangeName = "binance";
    this.orderbookhandlerMethod = "depthUpdate";
  }

  /**
   * get all the trade pairs for binance exchange and store them in an array
   * @returns void
   */
  getTradePairsList = async () => {
    /* 
      we can use this api to get symbols and volume both
      https://api.binance.com/api/v3/ticker/24hr 
    */
    let exchangeInfo = await axios.get(
      "https://api.binance.com/api/v3/exchangeInfo"
    );
    let tradePairs: any = [];
    const commonTradePairMap = {};

    const startTime = Math.round(new Date().getTime() - 86400000);
    const endTime = Math.round(new Date().getTime());

    exchangeInfo.data["symbols"].forEach((symbolObj: any) => {
      axios
        .get(
          `https://api.binance.com/api/v3/klines?symbol=${symbolObj.symbol}&interval=1d&startTime=${startTime}&endTime=${endTime}`
        )
        .then((getTradeVolume) => {
          const tradeVolume =
            getTradeVolume.data[0] && getTradeVolume.data[0][5];

          // console.log({ symbol: symbolObj.symbol, tradeVolumne });

          if (tradeVolume > 50000) {
            tradePairs.push(symbolObj.symbol.toLowerCase()); // to subscribe to trade pair's ws stream

            commonTradePairMap[symbolObj.symbol.toLowerCase()] =
              symbolObj.symbol.replace(/[^a-z0-9]/gi, "").toUpperCase();
          }
        })
        .catch((error) => console.error({ error }));
    });

    // const tradePairListOfExchangeInCommonFormat = {} // {ETHBTC: eth_btc, BTCUSD: btc_usd}
    // tradePairs.forEach((tradePair: string, idx: number) => {
    //   // [A-Z, a-z, 0-9]
    //   // const commonFormatOfTradePair = tradePair.allTheFilters
    //   tradePairListOfExchangeInCommonFormat[commonFormatOfTradePair] = tradePair
    // })

    this.binanceTradePairsList = tradePairs.splice(1, 5);
    return {
      commonTradePairMap,
    };
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
