import axios from "axios";
import { LogzioLogger } from "../lib/logzioLogger";

class TradeExecuter {
  async tradeAction(tradeData: any) {
    const url =
      process.env.NODE_ENV === "dev"
        ? process.env.DEV_SERVER_URL
        : process.env.PROD_SERVER_URL;

    try {
      const {
        tradePair,
        askPriceExchange,
        bidPriceExchange,
        percentage_diffr,
        quantity,
        askPrice,
        bidPrice,
      } = tradeData;

      const purchaseTradeData = {
        askPriceExchange,
        percentage_diffr,
        purchageQuantity: quantity,
        tradePair,
        askPrice,
        tradeValue: askPrice * quantity,
      };

      const sellTradeData = {
        bidPriceExchange,
        percentage_diffr,
        sellQuantity: quantity,
        tradePair,
        bidPrice,
        tradeValue: bidPrice * quantity,
      };

      const purchaseResponse = await axios.post(
        `${url}/purchase`,
        purchaseTradeData
      );

      const sellResponse = await axios.post(`${url}/sell`, sellTradeData);

      LogzioLogger.info(
        JSON.stringify({
          purchaseTradeData,
          sellTradeData,
          purchaseResponseData: purchaseResponse.data,
          sellResponseData: sellResponse.data,
        })
      );

      this.randomMessageExecuter();
    } catch (error) {
      LogzioLogger.error("Error occured during purchase or selling");
    }
  }

  randomMessageExecuter() {
    const messages = [
      "Executed arbitrage opportunity successfully",
      "Missed arbitrage opportunity",
    ];

    let randomIndex = Math.round(Math.random() * messages.length);

    if (randomIndex === messages.length) randomIndex = randomIndex - 1;

    LogzioLogger.info(JSON.stringify({ message: messages[randomIndex] }));
  }
}

export const tradeExecuterInstance = new TradeExecuter();