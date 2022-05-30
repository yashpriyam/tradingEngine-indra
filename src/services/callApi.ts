import { allActions } from "../..";
import { dummyTradeApiCall } from "../lib/dummyServerApiCall";

/**
 * child process execution code
 */
process.on("message", async (message: any) => {
  const { data } = message;

  allActions.forEach((singleAction) => {
    singleAction.excuteAction(data);
  });

  await dummyTradeApiCall(data);
  process.exit();
});
