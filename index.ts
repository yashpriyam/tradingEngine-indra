"use strict";
import Action from "./src/services/Action";
import checkForArbitrage from "./src/services/checkArbitrage";
import ExchangeData from "./src/services/ExchangeData";
import Trigger from "./src/services/Trigger";

(async () => {
  const exchangesName: string[] = [
    "binance",
    "bitfinex",
    "ftx",
    "bittrex",
    "kucoin",
  ];

  const LogAction = new Action(console.log);

  const orderBookData = new ExchangeData(exchangesName);

  // const orderBookPriceMap = await orderBookData.watchOrderBookData();
  // console.log({ orderBookPriceMap });

  const orderbookTrigger = new Trigger(
    checkForArbitrage,
    orderBookData,
    LogAction
  );

  await orderbookTrigger.getOrderBookData();
})();
