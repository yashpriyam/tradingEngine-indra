import { allActions } from "../..";
import { tradeExecuterInstance } from "./TradeExecuter";

/**
 * child process execution code
 */
process.on("message", async (message: any) => {
  const { data } = message;

  allActions.forEach((singleAction) => {
    singleAction.excuteAction(data);
  });

  await tradeExecuterInstance.tradeAction(data);

  process.exit();
});
