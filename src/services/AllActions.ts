import Action from "../services/Action";
import { dummyTradeApiCall } from "../lib/dummyServerApiCall";
import { LogzioLogger } from "../lib/logzioLogger";

const LogAction = new Action(console.log);
const LogzLoggerAction = new Action(LogzioLogger.info);
const DummyServerApiCallAction = new Action(dummyTradeApiCall);

export { LogAction, LogzLoggerAction, DummyServerApiCallAction };
