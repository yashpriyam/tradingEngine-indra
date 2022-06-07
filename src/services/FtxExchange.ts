import axios from "axios";
import { LogzioLogger } from "../lib/logzioLogger";
import BasePriceOracle from "./BasePriceOracle";

const sendOneTimeData = process.argv.slice(2)[0];

export default class FtxExchange extends BasePriceOracle implements PriceOracleInstances {
  tradePairsList: string[];
  exchangeName: string;
  orderbookhandlerMethod: "orderbook";
  private wsUrl: string;
  private ftxWsInstance: {};

  constructor() {
    super();
    this.wsUrl = "wss://ftx.com/ws/";
    this.ftxWsInstance = this._createSocket(this.wsUrl);
    this.tradePairsList = [];
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

    exchangeInfo.data.result.forEach((symbolObj: any) => {
      if (
        symbolObj.volumeUsd24h > Number(process.env.DAILY_TRADE_VOLUME_LIMIT)
      ) {
        tradePairs.push(symbolObj.name);
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
   * subscribe to orderbook stream of ftx exchange
   * for every trade pair
   * @returns void
   */
  subscribeOrderBookDataForAllTradePairs = async () => {
    for (const tradePair of this.tradePairsList) {
      const subscriberObject = {
        op: "subscribe",
        market: tradePair,
        channel: "orderbook",
      };
      this.subscribeStream(subscriberObject, this.ftxWsInstance);
    }
    this.getFtxMessageStream();
  };

  /**
   * call the base class method "getMessageStream" for
   * getting message for ftx exchange and pass a data format to it.
   * @returns void
   */
  private getFtxMessageStream = () => {
    this.getMessageStream(this.ftxWsInstance, {
      asks: "data.asks",
      bids: "data.bids",
      symbol: "market",
      methodPath: "channel",
    });
  };
}
