import ccxtpro from "ccxt.pro";
import * as WebSocket from "ws";

class ExchangeData {
  ccxtExchanges: string[];
  websocketUrls: string[];
  orderBookPriceMap: orderBookPriceMap;
  _ws: any;

  constructor(exchanges: string[], baseUrls: string[]) {
    this.ccxtExchanges = exchanges;
    this.websocketUrls = baseUrls;
    this.orderBookPriceMap = {};
    this.orderBookFromUrls();
  }

  // from ccxt pro
  async *orderBookFromCCXT() {
    for (const exchangeName of this.ccxtExchanges) {
      const exchange = new ccxtpro[exchangeName]({ enableRateLimit: true });

      const orderbookData = await exchange.watchOrderBook(["ETH/USDT"]);

      this.orderBookPriceMap[exchangeName] = {};

      this.orderBookPriceMap[exchangeName]["askPrice"] =
        orderbookData["asks"][0][0];

      this.orderBookPriceMap[exchangeName]["bidPrice"] =
        orderbookData["bids"][0][0];

      yield this.orderBookPriceMap;
    }
  }

  // get order book data from websocket Urls
  async orderBookFromUrls() {
    for (let url of this.websocketUrls) {
      this._ws = new WebSocket.default(url);

      this._ws.onopen = () => {
        console.log("connected");
        this._ws.send(
          JSON.stringify({
            id: 11,
            method: "subscribe",
            params: {
              channels: ["book.ETH_USDT.10"],
            },
          })
        );
      };

      this._ws.onmessage = (msg: { data: string }) => {
        const message = JSON.parse(msg.data);
        let data = message.result && message.result.data[0];

        if (
          data &&
          data.asks &&
          data.bids &&
          data.asks.length > 0 &&
          data.bids.length > 0
        ) {
          let askPrice: number = data.asks[0][0];
          let bidPrice: number = data.bids[0][0];

          this.orderBookPriceMap["cryptoCom"] = {};

          this.orderBookPriceMap["cryptoCom"]["askPrice"] = askPrice;

          this.orderBookPriceMap["cryptoCom"]["bidPrice"] = bidPrice;
        }
      };
    }
  }

  async *getOrderBookData() {
    while (true) {
      // yield this.orderBookPriceMap;
      yield* this.orderBookFromCCXT();
    }
  }
}

export default ExchangeData;
