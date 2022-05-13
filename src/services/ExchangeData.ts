// import ccxtpro from "ccxt.pro";
import * as WebSocket from "ws";
import { fork } from "child_process";

import cluster from "cluster";
import os from "os";
import { orderBookPriceMap } from "../..";
const totalCPUs = os.cpus().length;

class ExchangeData {
  // ccxtExchanges: string[];
  websocketUrls: any[];
  // orderBookPriceMap: orderBookPriceMap;
  _ws: any;
  symbols: string[];

  constructor(baseUrls: any[]) {
    // this.ccxtExchanges = exchanges;
    this.websocketUrls = baseUrls;
    // orderBookPriceMap = {};
    this.orderBookFromUrls();
    this.symbols = ["BTC/USDT", "ETH/USDT", "ETH/BTC"];
  }

  // get order book data from websocket Urls
  async orderBookFromUrls() {
    for (let { url, exchangeName, dataFormat } of this.websocketUrls) {
      this._ws = new WebSocket.default(url);

      this._ws.onopen = () => {
        console.log("connected");
        // for (const symbol of this.symbols) {
        this._ws.send(
          JSON.stringify({
            id: 1,
            method: "subscribe",
            params: {
              channels: [`book.BTC_USDT.20`],
            },
          })
        );
        // }
      };

      this._ws.onmessage = (msg: { data: string }) => {
        const message = JSON.parse(msg.data);
        console.log({ message });

        /* if (message.result) {
          const data = message.result.data[0];

          let symbol = message.result && message.result.instrument_name;
          symbol = symbol.split("_").join("/");

          if (!orderBookPriceMap[symbol]) orderBookPriceMap[symbol] = {};

          if (
            data &&
            data.asks &&
            data.bids &&
            data.asks.length > 0 &&
            data.bids.length > 0
          ) {
            let askPrice: number = data.asks[0][0];
            let bidPrice: number = data.bids[data.bids.length - 1][0];

            // console.log({ ask: data.asks });
            // console.log({ bids: data.bids });

            // let formattedData = {
            //   symbol: this.getPathValue(message, dataFormat.symbol),
            //   orderbookData: this.getPathValue(
            //     message,
            //     dataFormat.orderbookData
            //   ),
            // };

            // console.log(formattedData.orderbookData);

            if (!orderBookPriceMap[symbol][exchangeName])
              orderBookPriceMap[symbol][exchangeName] = {};

            orderBookPriceMap[symbol][exchangeName]["askPrice"] = askPrice;

            orderBookPriceMap[symbol][exchangeName]["bidPrice"] = bidPrice;
          }
        } */
      };
    }
  }

  // from ccxt pro
  async *orderBookFromCCXT(exchangeName: string) {
    // for (const exchangeName of this.ccxtExchanges) {

    console.log({ exchangeName });

    try {
      const forkedProcess = fork(`${__dirname}/callApi.js`);
      // const exchange = new ccxtpro[exchangeName]({ enableRateLimit: true });
      forkedProcess.send({
        exchangeName,
        // orderBookPriceMap: orderBookPriceMap
      });
      // let thisArg = this
      // console.log({message: thisArg.orderBookPriceMap})
      forkedProcess.on("message", function* cb(message: string) {
        console.log({ message });
        yield orderBookPriceMap;
      });
      // const childProcess = fork("./src/services/callApi.js");

      // console.log(exchange.watchOrderBook);

      // forkedProcess.on("message", (message: any) => console.log(message));

      // let symbols = Object.keys(await exchange.loadMarkets());

      // for (const symbol of symbols) {
      //   if (!orderBookPriceMap[symbol])
      //     orderBookPriceMap[symbol] = {};

      //   let orderbookData = {};

      //   try {
      //     console.log({ symbol });

      //     orderbookData = await exchange.watchOrderBook(symbol);

      //     if (!orderBookPriceMap[symbol][exchangeName])
      //       orderBookPriceMap[symbol][exchangeName] = {};

      //     if (
      //       !orderbookData ||
      //       orderbookData["asks"].length == 0 ||
      //       orderbookData["bids"].length == 0
      //     )
      //       continue;

      //     orderBookPriceMap[symbol][exchangeName]["askPrice"] =
      //       orderbookData["asks"][0][0];

      //     orderBookPriceMap[symbol][exchangeName]["bidPrice"] =
      //       orderbookData["bids"][orderbookData["bids"].length - 1][0];

      // yield orderBookPriceMap;
      //   } catch (error) {
      //     console.error({ error });
      //     continue;
      //   }
      // }
    } catch (error) {
      console.error({ error });
      // continue
    }
    // }
  }

  async *getOrderBookData() {
    // for (const exchangeName of this.ccxtExchanges) {
    //   // while (true) {
    //     yield* this.orderBookFromCCXT(exchangeName);
    //   // }
    // }
  }
}

export default ExchangeData;

/*



{
  "Eth/usdt" :{
    "exchange" :{
      askPrice: number,
      bidPrice : n
    },
    "exchange" :{
      askPrice: number,
      bidPrice : n
    }
    "exchange" :{
      askPrice: number,
      bidPrice : n
    }
    "exchange" :{
      askPrice: number,
      bidPrice : n
    }
    "exchange" :{
      askPrice: number,
      bidPrice : n
    }
    "exchange" :{
      askPrice: number,
      bidPrice : n
    }
  },

  "btc/usdt" :{
    "exchange" :{
      askPrice: number,
      bidPrice : n
    }
  },

} */
