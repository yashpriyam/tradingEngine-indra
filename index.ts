"use strict";
import cluster from "cluster";
import os from "os";
import Action from "./src/services/Action";
import checkForArbitrage from "./src/services/checkArbitrage";
import ExchangeData from "./src/services/ExchangeData";
import Trigger from "./src/services/Trigger";

const totalCPUs = os.cpus().length;

const exchangesName: string[] = [
  "binance",
  "bitfinex",
  "ftx",
  "bittrex",
  "kucoin",
];

// if (cluster.isPrimary) {
//   console.log(`Number of CPUs is ${totalCPUs}`);
//   console.log(`Master ${process.pid} is running`);

//   for (let i = 0; i < totalCPUs; i++) {
//     cluster.fork();
//   }
// } else {
//   console.log(`Worker ${process.pid} started`);
// }

let cryptoComUrl: string = "wss://stream.crypto.com/v2/market";

const LogAction = new Action(console.log);

const orderBookData = new ExchangeData(exchangesName, [
  {
    exchangeName: "cryptocom",
    url: cryptoComUrl,
    dataFormat: {
      symbol: "result.instrument_name",
      orderbookData: "result.data",
    },
  },
]);

const orderbookTrigger = new Trigger(
  orderBookData,
  [LogAction],
  checkForArbitrage
);

orderbookTrigger.getOrderBookData();

/* 

Trigger class always have three arguments  
([] of data source/price oracle instances, array of actions, conditions)


  const orderbookTrigger = new Trigger(
    [orderBookData],
    [LogAction, apiCallAction],
    conditionFunction
  );

*/
