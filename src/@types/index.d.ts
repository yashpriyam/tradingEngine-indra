type orderBookMap = {
  [key: string]: {
    [key: string]: {
      [key: string]: number;
    };
  };
};


interface Action {
  execute(arg: any): void
}
interface PriceOracle {
  setHandler(method: string, callback: (params: any) => void): void
  getMessageStream(wsInstance: any, dataFormat: any): void
  _createSocket(wsUrl: string): any
  subscribeStream(subscriberObject: Object, wsInstance: any): void
}

interface PriceOracleInstances extends PriceOracle {
  orderbookhandlerMethod: string;
  exchangeName: string;
  tradePairsList: string[];
  updateTradePairsList(tradePairsArray: string[]): void
  getTradePairsList(): Promise<any>
  subscribeOrderBookDataForAllTradePairs(): void
}
interface TradeExecutor {
  placeOrder(): Boolean
  cancelOrder(): true
  checkOrderStatus(): true
  getWalletBalance(exchange: string): true
}
interface Strategy {
  start(): void
  check(): void
}