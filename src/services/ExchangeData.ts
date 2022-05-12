import ccxtpro from "ccxt.pro";
import * as WebSocket from "ws";
import { fork } from "child_process";

import cluster from "cluster";
import os from "os";
const totalCPUs = os.cpus().length;

class ExchangeData {
  ccxtExchanges: string[];
  websocketUrls: any[];
  orderBookPriceMap: orderBookPriceMap;
  _ws: any;
  symbols: string[];

  constructor(exchanges: string[], baseUrls: any[]) {
    this.ccxtExchanges = exchanges;
    this.websocketUrls = baseUrls;
    this.orderBookPriceMap = {};
    this.orderBookFromUrls();
    this.symbols = ["BTC/USDT", "ETH/USDT", "ETH/BTC"];
    // this.createCluster();
  }

  createCluster() {
    if (cluster.isPrimary) {
      console.log(`Number of CPUs is ${totalCPUs}`);
      console.log(`Master ${process.pid} is running`);

      for (let i = 0; i < totalCPUs; i++) {
        cluster.fork();
      }
    } else {
      console.log(`Worker ${process.pid} started`);
    }
  }

  // from ccxt pro
  async *orderBookFromCCXT() {
    for (const exchangeName of this.ccxtExchanges) {
      const exchange = new ccxtpro[exchangeName]({ enableRateLimit: true });

      // console.log({ exchange });

      try {
        const childProcess = fork("./src/services/callApi.js");

        childProcess.send({
          watchOrderBook: exchange.watchOrderBook.toString(),
        });
        // console.log(exchange.watchOrderBook);

        childProcess.on("message", (message: any) => console.log(message));

        let symbols = Object.keys(await exchange.loadMarkets());

        for (const symbol of symbols) {
          if (!this.orderBookPriceMap[symbol])
            this.orderBookPriceMap[symbol] = {};

          let orderbookData = {};

          try {
            console.log({ symbol });

            orderbookData = await exchange.watchOrderBook(symbol);

            if (!this.orderBookPriceMap[symbol][exchangeName])
              this.orderBookPriceMap[symbol][exchangeName] = {};

            if (
              !orderbookData ||
              orderbookData["asks"].length == 0 ||
              orderbookData["bids"].length == 0
            )
              continue;

            this.orderBookPriceMap[symbol][exchangeName]["askPrice"] =
              orderbookData["asks"][0][0];

            this.orderBookPriceMap[symbol][exchangeName]["bidPrice"] =
              orderbookData["bids"][orderbookData["bids"].length - 1][0];

            yield this.orderBookPriceMap;
          } catch (error) {
            console.error({ error });
            continue;
          }
        }
      } catch (error) {
        console.error({ error });
        continue;
      }
    }
  }

  // get order book data from websocket Urls
  async orderBookFromUrls() {
    for (let { url, exchangeName, dataFormat } of this.websocketUrls) {
      this._ws = new WebSocket.default(url);

      this._ws.onopen = () => {
        console.log("connected");
        for (const symbol of this.symbols) {
          let id = 1;
          this._ws.send(
            JSON.stringify({
              id: id++,
              method: "subscribe",
              params: {
                channels: [`book.${symbol.split("/").join("_")}.20`],
              },
            })
          );
        }
      };

      this._ws.onmessage = (msg: { data: string }) => {
        const message = JSON.parse(msg.data);

        if (message.result) {
          const data = message.result.data[0];

          let symbol = message.result && message.result.instrument_name;
          symbol = symbol.split("_").join("/");

          if (!this.orderBookPriceMap[symbol])
            this.orderBookPriceMap[symbol] = {};

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

            if (!this.orderBookPriceMap[symbol][exchangeName])
              this.orderBookPriceMap[symbol][exchangeName] = {};

            this.orderBookPriceMap[symbol][exchangeName]["askPrice"] = askPrice;

            this.orderBookPriceMap[symbol][exchangeName]["bidPrice"] = bidPrice;
          }
        }
      };
    }
  }

  async *getOrderBookData() {
    while (true) {
      yield* this.orderBookFromCCXT();
    }
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
