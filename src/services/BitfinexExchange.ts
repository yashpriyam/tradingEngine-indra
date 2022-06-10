import axios from "axios";
import { LogzioLogger } from "../lib/logzioLogger";
import BasePriceOracle from "./BasePriceOracle";

const sendOneTimeData = process.argv.slice(2)[0];

export default class BitfinexExchange extends BasePriceOracle implements PriceOracleExtended {
  tradePairsList: string[];
  exchangeName: "bitfinex";
  orderbookhandlerMethod: string;
  private wsUrl: string;
  private bitfinexWsInstance: {};

  constructor() {
    super();
    this.wsUrl = `wss://api-pub.bitfinex.com/ws/2`
    this.bitfinexWsInstance = this._createSocket(this.wsUrl);
    this.tradePairsList = ["tBTCUSD", "tETHUSD"];
    this.exchangeName = "bitfinex";
    this.orderbookhandlerMethod = "";
  }

  /**
   * get all the trade pairs for binance exchange and store them in an array
   * @returns void
   */
  getTradePairsList = async () => {
    let tradePairs: any = [];

    let allTradePairs : string[] = [];

    let tradePairsList = await axios.get(
      "https://api-pub.bitfinex.com/v2/conf/pub:list:pair:exchange"
    );

    tradePairsList.data && tradePairsList.data[0].forEach((singleTradePair:string)=>{
      allTradePairs.push("t" + singleTradePair.split(":").join(""));
    })


   let queryParamsForTicker = allTradePairs.join(",");

   // get ticker data for getting trading volumne
    const ticketData = await axios.get(`https://api-pub.bitfinex.com/v2/tickers/?symbols=${queryParamsForTicker}`)

    //  Filter using daily trading volumne
    ticketData.data && ticketData.data.forEach((tickerDataForSingleTradePair : any)=>{
      let dailyTradingVolume = tickerDataForSingleTradePair[tickerDataForSingleTradePair.length-3];

      if(dailyTradingVolume > Number(process.env.DAILY_TRADE_VOLUME_LIMIT)){
        tradePairs.push(tickerDataForSingleTradePair[0].substring(1));
      }
    })

    if (sendOneTimeData)
      LogzioLogger.info(JSON.stringify({ tradePairs }), {
        symbolCount: tradePairs.length,
        exchangeName: this.exchangeName,
      });

    return (this.tradePairsList = [...tradePairs]);
  };

  updateTradePairsList = (tradePairsArray: string[]) => {
    // this.tradePairsList = [...tradePairsArray];
  };

  /**
   * subscribe to orderbook stream of binance exchange
   * for every trade pair
   * @returns void
   */
  subscribeOrderBookDataForAllTradePairs = async () => {   
    this.subscribeStream({ event: 'conf', flags: 131072 }, this.bitfinexWsInstance);

    for (const tradePair of this.tradePairsList) {
      const subscriberObject = {
        event: 'subscribe', 
        channel: 'book', 
        symbol: tradePair 
      };
      this.subscribeStream(subscriberObject, this.bitfinexWsInstance);
    }
    this.getBitfinexMessageStream();
  };

  
  /**
   * call the base class method "getMessageStream" for
   * getting message for binance exchange and pass a data format to it.
   * @returns void
   */
  private getBitfinexMessageStream = () => {
    //https://gist.github.com/brentkirkland/b75f76c6bda90ce874e7f6eddeff5d26 (need to implement this)

    this.getMessageStream(this.bitfinexWsInstance, {
      // checksum: true
    });
  };

  
}
