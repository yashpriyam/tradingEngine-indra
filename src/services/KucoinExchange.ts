import axios from "axios";
import { LogzioLogger } from "../lib/logzioLogger";
import BasePriceOracle from "./BasePriceOracle";

const sendOneTimeData = process.argv.slice(2)[0];

export default class KucoinExchange extends BasePriceOracle implements PriceOracleExtended {
  tradePairsList: string[];
  exchangeName: "kucoin";
  orderbookhandlerMethod: string;
  private wsUrl: string;
  private kucoinWsInstance: {};
  private token: string;

  constructor() {
    super();
    // POST - https://api.kucoin.com/api/v1/bullet-public
    this.token="2neAiuYvAU61ZDXANAGAsiL4-iAExhsBXZxftpOeh_55i3Ysy2q2LEsEWU64mdzUOPusi34M_wGoSf7iNyEWJ0sEUY6AvdC9MPXIBBWNTgAgUhyvregmydiYB9J6i9GjsxUuhPw3BlrzazF6ghq4L-7KYvvsbysmVoAMNUVi0GQ=.Is-WNTGo8LOM4y30oKYSPw=="
    this.wsUrl = `wss://ws-api.kucoin.com/endpoint?token=${this.token}&[connectId=randomconnectid]`;
    this.kucoinWsInstance = this._createSocket(this.wsUrl);
    this.tradePairsList = [];
    this.exchangeName = "kucoin";
    this.orderbookhandlerMethod = "level2";
  }

  /**
   * get all the trade pairs for binance exchange and store them in an array
   * @returns void
   */
  getTradePairsList = async () => {
    let tradePairs: any = [];

    let tradePairsList = await axios.get(
      "https://api.kucoin.com/api/v1/market/allTickers"
    );

    tradePairsList.data && tradePairsList.data.data.ticker.forEach((symbolObj: any) => {
      if (symbolObj.vol > Number(process.env.DAILY_TRADE_VOLUME_LIMIT)) {
        tradePairs.push(symbolObj.symbolName);
      }
    });
    
    // tradePairs = tradePairs.slice(0,100);
    // console.log({tradePairs});

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
    const tradePairListString = this.tradePairsList.join()
      const subscriberObject = {
        "id": 1234567,                          
        "type": "subscribe",
        "topic": `/market/level2:${tradePairListString}`,
        "response": true                              
      }
      this.subscribeStream(subscriberObject, this.kucoinWsInstance);
    this.getKucoinMessageStream();
  };

  
  /**
   * call the base class method "getMessageStream" for
   * getting message for binance exchange and pass a data format to it.
   * @returns void
   */
  private getKucoinMessageStream = () => {
    this.getMessageStream(this.kucoinWsInstance, {
      asks: "data.asks",
      bids: "data.bids",
      symbol: "topic",
      methodPath: "subject",
    });
  };

  
}
