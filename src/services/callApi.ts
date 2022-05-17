// import ccxtpro from "ccxt.pro";
// var logger = require('logzio-nodejs').createLogger({
//   token: 'wTMYrprFKilxYbGKaCGvUrOFOGYORNyy',
//   protocol: 'https',
//   host: 'listener.logz.io',
//   port: '8071',
//   type: 'elasticsearch'
// });
// logger.log(orderBookPriceMap);
// import { orderBookPriceMap } from "../..";

import BinancePriceOracle from "./BinancePriceOracle";

process.on("message", (message: any) => {
  console.log({ message });

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

// process.on("message", async (message: { exchangeName: string }) => {
//   // console.log({ message });
//   const { exchangeName } = message;
//   const exchange = new ccxtpro[exchangeName]({ enableRateLimit: true });

//   // const parsedMsg = JSON.parse(message.exchangeOrderBook);
//   // console.log({ parsedMsg });

//   let symbols = Object.keys(await exchange.loadMarkets());
//   for (const symbol of symbols) {
//     console.log({ symbol });

//     await infinteWhileLoop(symbol);
//     console.log("after", { symbol });
//   }

//   async function infinteWhileLoop(symbol: string) {
//     if (!orderBookPriceMap[symbol]) orderBookPriceMap[symbol] = {};

//     let orderbookData = {};

//     try {
//       // console.log({ symbol });

//       // while (true) {
//       orderbookData = await exchange.watchOrderBook(symbol);
//       // console.log({orderbookData});

//       if (!orderBookPriceMap[symbol][exchangeName])
//         orderBookPriceMap[symbol][exchangeName] = {};

//       if (
//         !orderbookData ||
//         orderbookData["asks"].length === 0 ||
//         orderbookData["bids"].length === 0
//       )
//         // continue;

//         orderBookPriceMap[symbol][exchangeName]["askPrice"] =
//           orderbookData["asks"][0][0];

//       orderBookPriceMap[symbol][exchangeName]["bidPrice"] =
//         orderbookData["bids"][orderbookData["bids"].length - 1][0];
//       console.log({ orderBookPriceMap });
//       // logger.log(orderBookPriceMap);

//       // sendingProcess(orderBookPriceMap)
//       process.send?.({ orderBookPriceMap });
//       // }
//       // yield orderBookPriceMap;
//     } catch (error) {
//       console.error({ error });
//       // continue;
//     }
//   }

//   // process.send("some string from outside");

//   // function sendingProcess (data: orderBookPriceMap){
//   //   return process.send({ data });
//   // }
//   // const watchOrderBookFn = new Function(...message.watchOrderBook);

//   // console.log({ parsedMsg: parsedMsg.has.watchOrderBook });
//   // console.log({ watchOrderBookFn });
//   // const data = await watchOrderBookFn("BTC/USDT");

//   // sending the message back to the main process

//   // need to kill the current child process after the we send the response back
// });
