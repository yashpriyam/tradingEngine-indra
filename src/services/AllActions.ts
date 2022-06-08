import { LogzioLogger } from "../lib/logzioLogger";
import DummyTradeExecutor from './TradeExecuter'


class ConsoleLogAction implements Action {
    execute(arg: any) {
        console.log(arg)
    }
}
class LoggerAction implements Action {
    execute(arg: any) {
        LogzioLogger.info(arg)
    }
}
class DummyArbAction implements Action {
    execute(arg: any) {
        const DummyTradeExecutorInstance = new DummyTradeExecutor()

        try {
            const {
                tradePair,
                askPriceExchange,
                bidPriceExchange,
                percentage_diffr,
                quantity,
                askPrice,
                bidPrice,
            } = arg;

            const purchaseData = {
                exchangeName: askPriceExchange,
                percentage_diffr,
                tradeQuantity: quantity,
                tradePair,
                unitPrice: askPrice,
                tradeValue: askPrice * quantity,
            };

            LogzioLogger.info(JSON.stringify(purchaseData));

            DummyTradeExecutorInstance.placeOrder({
                orderType: 'Market',
                tradeActionType: 'buy',
                ...purchaseData,
            })

            const sellData = {
                exchangeName: bidPriceExchange,
                percentage_diffr,
                tradeQuantity: quantity,
                tradePair,
                unitPrice: bidPrice,
                tradeValue: bidPrice * quantity
            };

            LogzioLogger.info(JSON.stringify(sellData));

            DummyTradeExecutorInstance.placeOrder({
                orderType: 'Market',
                tradeActionType: 'sell',
                ...sellData,
            })

            this.randomMessageExecuter()

        } catch (error) {
            LogzioLogger.error("Error occured during purchase or selling");
        };

    }


    private randomMessageExecuter() {
        const numIndex: number[] = [1,1,1,1,1,1,1,1,0,0]
        const messages: string[] = [
            "Arb execution failed",
            "Arb executed successfully",
        ];

        let randomIndex: number = Math.round(Math.random() * (numIndex.length - 1))

        LogzioLogger.info(JSON.stringify({ message: messages[randomIndex] }));
    }
};

export { ConsoleLogAction, LoggerAction, DummyArbAction };
