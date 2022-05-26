import logger from "../lib/logger";
import Action from "../services/Action";
import { dummyTradeApiCall } from '../lib/dummyServerApiCall'

const LogAction = new Action(console.log);
const LogzLoggerAction = new Action(logger.log);
const DummyServerApiCallAction = new Action(dummyTradeApiCall)

export {
    LogAction,
    LogzLoggerAction,
    DummyServerApiCallAction
}