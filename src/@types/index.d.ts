type orderBookMap = {
  [key: string]: {
    [key: string]: {
      [key: string]: number;
    };
  };
};

type placeOrderTpye = {
  orderType: 'Market'
  tradeActionType: 'buy' | 'sell'
  exchangeName: string
  percentage_diffr: number
  tradeQuantity: any
  tradePair: string
  unitPrice: number
  tradeValue: number
}


interface Action {
  execute(arg: any): any
}
interface PriceOracle {
  setHandler(method: string, callback: (params: any) => void): void
  getMessageStream(wsInstance: any, dataFormat: any, exchangeInstance?: any): void
  _createSocket(wsUrl: string): any
  subscribeStream(subscriberObject: Object, wsInstance: any): void
}

interface PriceOracleExtended extends PriceOracle {
  orderbookhandlerMethod: string;
  exchangeName: string;
  tradePairsList: string[];
  updateTradePairsList(tradePairsArray: string[]): void
  getTradePairsList(): Promise<any>
  subscribeOrderBookDataForAllTradePairs(): void
}
interface TradeExecutor {
  placeOrder(tradeData: any): Promise<any>
  cancelOrder(): Boolean
  checkOrderStatus(): Boolean
  getWalletBalance(exchange: string): Boolean
}
interface Strategy {
  start(
    checkCondition: Function
  ): Promise<void>
}