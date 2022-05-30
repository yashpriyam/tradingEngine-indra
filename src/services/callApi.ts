// import BinancePriceOracle from "./BinancePriceOracle";

import { allActions } from "../..";
import { dummyTradeApiCall } from "../lib/dummyServerApiCall";

/**
 * child process execution code
 */
process.on("message", async (message: any) => {
  // console.log({ message });
  // const binancePriceOracleInstance = new BinancePriceOracle();

  // let stringFunction = binancePriceOracleInstance.getTradePairsList.toString();

  // // let data = await binancePriceOracleInstance.getTradePairsList();

  // process.send?.({
  //   binancePriceOracleInstance: JSON.stringify(binancePriceOracleInstance),
  //   stringFunction,
  // });
  // console.log({ message });

  const { data } = message;

  // allActions.forEach((singleAction) => {
  //   singleAction.excuteAction(data);
  // });

  await dummyTradeApiCall(data);
  process.exit();
});
