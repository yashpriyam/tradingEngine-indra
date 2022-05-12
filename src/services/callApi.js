process.on("message", async (message) => {
  console.log({ watchOrder: message.watchOrderBook });

  // const parsedMsg = JSON.parse(message.exchangeOrderBook);
  // console.log({ parsedMsg });

  const watchOrderBookFn = new Function(...message.watchOrderBook);

  // console.log({ parsedMsg: parsedMsg.has.watchOrderBook });
  console.log({ watchOrderBookFn });
  const data = await watchOrderBookFn("BTC/USDT");

  // sending the message back to the main process
  process.send?.({ data });

  // need to kill the current child process after the we send the response back
  process.exit();
});
