import * as WebSocket from "ws";

class PriceOracle {
  _handlers: Map<any, any>;
  isConnected: boolean;
  _ws: any;
  dataFormat: any;
  constructor() {
    this._handlers = new Map();
    this.isConnected = false;
  }

  subscribeStream(subscriberObject: Object, wsInstance: any) {
    // console.log({subscriberObject});
    if (this.isConnected) {
      wsInstance.send(JSON.stringify(subscriberObject));
      console.log("Listening to stream data for " + subscriberObject);
      // ++this._id;
    } else {
      setTimeout(() => {
        this.subscribeStream(subscriberObject, wsInstance);
      }, 1000);
    }
  }

  getPathValue(payload: { [x: string]: any }, path: string) {
    const jsonpath = path.split(".");
    for (let i = 0; i < jsonpath.length; i++) {
      payload = payload[jsonpath[i]];
    }
    return payload;
  }

  _createSocket(wsUrl: string) {
    this._ws = new WebSocket.default(`${wsUrl}`);

    this._ws.onopen = () => {
      console.log("ws connected");
      this.isConnected = true;
    };

    this._ws.on("pong", () => {
      console.log("receieved pong from server");
    });
    this._ws.on("ping", () => {
      console.log("==========receieved ping from server");
      this._ws.pong();
    });

    this._ws.onclose = () => {
      console.log("ws closed");
    };

    this._ws.onerror = (err: any) => {
      console.log("ws error", err);
    };

    this.heartBeat();

    return this._ws;
  }

  getMessageStream(wsInstance: any, dataFormat: any) {
    wsInstance.onmessage = (msg: { data: string }) => {
      try {
        const message = JSON.parse(msg.data);

        if (this.isMultiStream(message)) {
          this._handlers.get(message.stream).forEach((cb: (arg0: any) => any) =>
            cb({
              askPrice: this.getPathValue(message, dataFormat.askPrice),
              bidPrice: this.getPathValue(message, dataFormat.bidPrice),
              symbol: this.getPathValue(message, dataFormat.symbol),
            })
          );
        } else if (
          this.getPathValue(message, dataFormat.methodPath) &&
          this._handlers.has(this.getPathValue(message, dataFormat.methodPath))
        ) {
          this._handlers
            .get(this.getPathValue(message, dataFormat.methodPath))
            .forEach((cb: (arg0: any) => void) => {
              cb({
                askPrice: this.getPathValue(message, dataFormat.askPrice),
                bidPrice: this.getPathValue(message, dataFormat.bidPrice),
                symbol: this.getPathValue(message, dataFormat.symbol),
              });
            });
        } else {
          // console.log({ message });
        }
      } catch (e) {
        console.log("Parse message failed", e);
      }
    };
  }

  isMultiStream(message: { stream: any }) {
    return message.stream && this._handlers.has(message.stream);
  }

  heartBeat() {
    setInterval(() => {
      if (this._ws.readyState === WebSocket.OPEN) {
        this._ws.ping();
        console.log("ping server");
      }
    }, 5000);
  }

  setHandler(method: string, callback: (params: any) => void) {
    if (!this._handlers.has(method)) {
      this._handlers.set(method, []);
    }
    this._handlers.get(method).push(callback);
  }
}

export default PriceOracle;
