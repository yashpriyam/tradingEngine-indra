import axios from "axios";
import { LogzioLogger } from "../lib/logzioLogger";
class DummyTradeExecutor implements TradeExecutor {
  private url: string
  constructor() {
    this.url = 'http://localhost:4009'
  }
  async placeOrder(tradeData: placeOrderTpye) {
    const {
      orderType,
      tradeActionType,
      exchangeName,
      percentage_diffr,
      tradeQuantity,
      tradePair,
      unitPrice,
      tradeValue,
    } = tradeData;

    try {
      const data = {
        tradeActionType,
        exchangeName,
        percentage_diffr,
        tradeQuantity,
        tradePair,
        unitPrice,
        tradeValue,
      }

      const tradeResponse = await axios.post(
        `${this.url}/${orderType}`,
        data
      );


      LogzioLogger.info(
        JSON.stringify({
          data,
          tradeResponse: tradeResponse.data
        })
      );
    } catch (error) {
      LogzioLogger.error("Error occured during purchase or selling");
    }
  }

  cancelOrder(){
    return true
  }
  checkOrderStatus(){
    return true
  }
  getWalletBalance(){
    return true
  }
}

export default DummyTradeExecutor;