import { LogzioLogger } from "./logzioLogger";
import axios from "axios";

export const dummyTradeApiCall = async (data: any) => {
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
    } = data;

    const purchaseData = {
      askPriceExchange,
      percentage_diffr,
      purchageQuantity: quantity,
      tradePair,
      askPrice,
      tradeValue: askPrice * quantity,
    };

    LogzioLogger.info(JSON.stringify(purchaseData));

    const purchaseResponse = await axios.post(`${url}/purchase`, purchaseData);

    LogzioLogger.info(
      JSON.stringify({ purchaseResponseData: purchaseResponse.data })
    );

    if (purchaseResponse.data.message !== "Purchased successfully") {
      return;
    }

    const sellData = {
      bidPriceExchange,
      percentage_diffr,
      sellQuantity: quantity,
      tradePair,
      bidPrice,
      tradeValue: bidPrice * quantity,
    };

    LogzioLogger.info(JSON.stringify(sellData));

    const sellResponse = await axios.post(`${url}/sell`, sellData);

    LogzioLogger.info(JSON.stringify({ sellResponseData: sellResponse.data }));
  } catch (error) {
    LogzioLogger.error("Error occured during purchase or selling");
  }
};
