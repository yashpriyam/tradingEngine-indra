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
  _handlers: Map<any, any>;
  isConnected: boolean;
  _ws: any;
  setHandler(method: string, callback: (params: any) => void): void
  heartBeat(): void;
  isMultiStream(message: { stream: any }): boolean
  getMessageStream(wsInstance: any, dataFormat: any): void
  _createSocket(wsUrl: string): any
  getPathValue(payload: { [x: string]: any }, path: string): { [x: string]: any }
  subscribeStream(subscriberObject: Object, wsInstance: any): void

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