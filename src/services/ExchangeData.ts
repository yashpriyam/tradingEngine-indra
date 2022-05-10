import ccxtpro from "ccxt.pro";
import * as WebSocket from "ws";

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
  }

  // from ccxt pro
  async *orderBookFromCCXT() {
    for (const symbol of this.symbols) {
      if (!this.orderBookPriceMap[symbol]) this.orderBookPriceMap[symbol] = {};

      for (const exchangeName of this.ccxtExchanges) {
        const exchange = new ccxtpro[exchangeName]({ enableRateLimit: true });

        let orderbookData = {};
        try {
          orderbookData = await exchange.watchOrderBook(symbol);
        } catch (error) {
          console.error({ error });
          continue;
        }

        if (!this.orderBookPriceMap[symbol][exchangeName])
          this.orderBookPriceMap[symbol][exchangeName] = {};

        this.orderBookPriceMap[symbol][exchangeName]["askPrice"] =
          orderbookData["asks"][0][0];

        this.orderBookPriceMap[symbol][exchangeName]["bidPrice"] =
          orderbookData["bids"][orderbookData["bids"].length - 1][0];

        yield this.orderBookPriceMap;
      }
    }
  }

  // get order book data from websocket Urls
  async orderBookFromUrls() {
    for (let { url, exchangeName } of this.websocketUrls) {
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
                channels: [`book.${symbol.split("/").join("_")}.10`],
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
            let bidPrice: number = data.bids[0][0];

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
    }
  },

  "btc/usdt" :{
    "exchange" :{
      askPrice: number,
      bidPrice : n
    }
  },
  
} */
