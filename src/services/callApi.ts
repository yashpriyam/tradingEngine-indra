// import BinancePriceOracle from "./BinancePriceOracle";

import { allActions } from "../..";

/**
 * child process execution code
 */
process.on("message", (message: any) => {
  // const binancePriceOracleInstance = new BinancePriceOracle();

  // let stringFunction = binancePriceOracleInstance.getTradePairsList.toString();

  // // let data = await binancePriceOracleInstance.getTradePairsList();

  // process.send?.({
  //   binancePriceOracleInstance: JSON.stringify(binancePriceOracleInstance),
  //   stringFunction,
  // });
  // console.log({ message });

  const { data, method } = message;

  new Function("return " + method)()();

  allActions.forEach((singleAction) => {
    singleAction.excuteAction(data);
  });

  process.exit();
});

/* 
  const executionAction = new Function("return " + method)();

  executionAction();

*/
