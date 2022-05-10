"use strict";
import Action from "./src/services/Action";
import checkForArbitrage from "./src/services/checkArbitrage";
import ExchangeData from "./src/services/ExchangeData";
import Trigger from "./src/services/Trigger";

const exchangesName: string[] = [
  "binance",
  "bitfinex",
  "ftx",
  "bittrex",
  "kucoin",
];

let cryptoComUrl: string = "wss://uat-stream.3ona.co/v2/market";

const LogAction = new Action(console.log);

const orderBookData = new ExchangeData(exchangesName, [
  { exchangeName: "cryptocom", url: cryptoComUrl },
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
