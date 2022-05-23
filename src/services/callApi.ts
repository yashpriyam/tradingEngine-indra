import BinancePriceOracle from "./BinancePriceOracle";

/**
 * child process execution code
 */
process.on("message", (message: any) => {
  // console.log({ message });

  const binancePriceOracleInstance = new BinancePriceOracle();
  // console.log({ binancePriceOracleInstance });

  let stringFunction = binancePriceOracleInstance.getTradePairsList.toString();

  // let data = await binancePriceOracleInstance.getTradePairsList();
  // console.log({ data });

  process.send?.({
    binancePriceOracleInstance: JSON.stringify(binancePriceOracleInstance),
    stringFunction,
  });

  process.exit();
});
