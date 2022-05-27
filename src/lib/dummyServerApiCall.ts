import { LogzioLogger } from "./logzioLogger";
import axios from "axios";

export const dummyTradeApiCall = async (data: any) => {
  //   console.log({ data });
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

    const purchaseResponse = await axios.post(
      `${process.env.DUMMY_SERVER_URL}/purchase`,
      purchaseData
    );

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

    const sellResponse = await axios.post(
      `${process.env.DUMMY_SERVER_URL}/sell`,
      sellData
    );

    console.log({ sellResponseData: sellResponse.data });
  } catch (error) {
    console.error({ error });
    LogzioLogger.error("Error occured during purchase or selling");
  }
};
