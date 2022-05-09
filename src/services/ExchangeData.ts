import ccxtpro from "ccxt.pro";

class ExchangeData {
  exchanges: string[];
  orderBookPriceMap: orderBookPriceMap;

  constructor(exchanges: string[]) {
    this.exchanges = exchanges;
    this.orderBookPriceMap = {};
  }

  async watchOrderBookData() {
    for (const exchangeName of this.exchanges) {
      const exchange = new ccxtpro[exchangeName]({ enableRateLimit: true });

      const orderbookData = await exchange.watchOrderBook("ETH/USDT");

      this.orderBookPriceMap[exchangeName] = {};
      this.orderBookPriceMap[exchangeName]["askPrice"] =
        orderbookData["asks"][0][0];

      this.orderBookPriceMap[exchangeName]["bidPrice"] =
        orderbookData["bids"][0][0];
    }
    return this.orderBookPriceMap;
  }
}

export default ExchangeData;
