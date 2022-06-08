import axios from "axios";
import { LogzioLogger } from "../lib/logzioLogger";
import BasePriceOracle from "./BasePriceOracle";

const sendOneTimeData = process.argv.slice(2)[0];
export default class BinanceExchange extends BasePriceOracle implements PriceOracleExtended {
  tradePairsList: string[];
  exchangeName: "binance";
  orderbookhandlerMethod: string;
  private wsUrl: string;
  private lastUpdateIdMap: { [key: string]: number };
  private previousValueOfu: number;
  private binanceWsInstance: {};

  constructor() {
    super();
    this.wsUrl = "wss://stream.binance.com:9443/ws";
    this.binanceWsInstance = this._createSocket(this.wsUrl);
    this.tradePairsList = [];
    this.exchangeName = "binance";
    this.orderbookhandlerMethod = "depthUpdate";
    this.lastUpdateIdMap = {};
    this.previousValueOfu = 0;
  }

  /**
   * get all the trade pairs for binance exchange and store them in an array
   * @returns void
   */
  getTradePairsList = async () => {
    let tradePairs: any = [];

    let tradePairsList = await axios.get(
      "https://api.binance.com/api/v3/ticker/24hr"
    );

    tradePairsList.data.forEach((symbolObj: any) => {
      if (symbolObj.volume > Number(process.env.DAILY_TRADE_VOLUME_LIMIT)) {
        tradePairs.push(symbolObj.symbol.toLowerCase());
      }
    });

    if (sendOneTimeData)
      LogzioLogger.info(JSON.stringify({ tradePairs }), {
        symbolCount: tradePairs.length,
        exchangeName: this.exchangeName,
      });

    return (this.tradePairsList = [...tradePairs]);
  };

  updateTradePairsList = (tradePairsArray: string[]) => {
    this.tradePairsList = [...tradePairsArray];
  };

  /**
   * subscribe to orderbook stream of binance exchange
   * for every trade pair
   * @returns void
   */
  subscribeOrderBookDataForAllTradePairs = async () => {
    let id = 0;
    for (const tradePair of this.tradePairsList) {
      const subscriberObject = {
        method: "SUBSCRIBE",
        params: [`${tradePair}@depthUpdate`],
        id: ++id,
      };
      this.subscribeStream(subscriberObject, this.binanceWsInstance);
      try {
        await this.createLastUpdateIdMap(tradePair);
      } catch (error) {
        LogzioLogger.error(error);
      }
    }
    this.getBinanceMessageStream();
  };

  checkOrderBookData = (orderbookData: any): boolean => {
    const { s: symbol, a: asks, b: bids, u, U } = orderbookData;

    const lastUpdateIdForSymbol = this.lastUpdateIdMap[symbol];

    if (u <= lastUpdateIdForSymbol || U > lastUpdateIdForSymbol + 1) {
      return false;
    }

    /*
      The data in each event is the absolute quantity for a price level.
      If the quantity is 0, remove the price level.
    */
    if (!asks[0][1] || !bids[0][1]) {
      return false;
    }

    // each new event's U should be equal to the previous event's u+1.
    if (U !== this.previousValueOfu + 1) return false;

    this.previousValueOfu = u;

    return true;
  };

  /**
   * call the base class method "getMessageStream" for
   * getting message for binance exchange and pass a data format to it.
   * @returns void
   */
  private getBinanceMessageStream = () => {
    this.getMessageStream(this.binanceWsInstance, {
      asks: "a",
      bids: "b",
      symbol: "s",
      methodPath: "e",
    });
  };

  private createLastUpdateIdMap = async (tradePair: string) => {
    tradePair = tradePair.toUpperCase();

    const depthSnapshot = await axios.get(
      `https://api.binance.com/api/v3/depth?symbol=${tradePair}&limit=1000`
    );

    this.lastUpdateIdMap[tradePair] =
      depthSnapshot.data && depthSnapshot.data.lastUpdateId;
  };
}
