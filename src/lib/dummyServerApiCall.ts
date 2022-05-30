import { LogzioLogger } from "./logzioLogger";
import axios from "axios";

export const dummyTradeApiCall = async (data: any) => {
  //   console.log({ data });

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

    const purchaseResponse = await axios.post(`${url}/purchase`, purchaseData);

    console.log({ purchaseResponseData: purchaseResponse.data });

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

    const sellResponse = await axios.post(`${url}/sell`, sellData);

    console.log({ sellResponseData: sellResponse.data });
  } catch (error) {
    console.error({ error });
    LogzioLogger.error("Error occured during purchase or selling");
  }
};
