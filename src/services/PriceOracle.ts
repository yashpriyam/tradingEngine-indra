import * as WebSocket from "ws";

/** base class to get exchange data */
class PriceOracle {
  _handlers: Map<any, any>;
  isConnected: boolean;
  _ws: any;
  constructor() {
    this._handlers = new Map();
    this.isConnected = false;
  }

  /**
   * used to subscribe a web socket stream
   * @param subscriberObject object passed from the exchange price oracle class
   * @param wsInstance web socket instance for exchange
   * @returns void
   */
  subscribeStream(subscriberObject: Object, wsInstance: any) {
    if (this.isConnected) {
      wsInstance.send(JSON.stringify(subscriberObject));
    } else {
      setTimeout(() => {
        this.subscribeStream(subscriberObject, wsInstance);
      }, 1000);
    }
  }

  /**
   * it finds the value from the payload for a given path
   * @param payload object data in which we need to find a property
   * @param path path of the property in payload object data
   * @returns path value from the payload
   */
  getPathValue(payload: { [x: string]: any }, path: string) {
    const jsonpath = path.split(".");
    for (let i = 0; i < jsonpath.length; i++) {
      if (jsonpath[i] === "[]") {
        payload = payload[0];
        continue;
      }

      payload = payload[jsonpath[i]];

      if (!payload) break;
    }
    return payload;
  }

  /**
   * create a websocket connection, handle websocket responses and log them
   * @param wsUrl websocket connection url for a exchange
   * @returns websocket instance
   */
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
      console.log("receieved ping from server");
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

  /**
   * handle the web socket messages and call the setHandler callback based on the method
   * which is defined in the trigger class
   * _handlers is a map for storing a callback for a method
   * @param wsInstance web socket instance
   * @param dataFormat an object having paths for different values
   * @returns void
   */
  getMessageStream(wsInstance: any, dataFormat: any) {
    wsInstance.onmessage = (msg: { data: string }) => {
      try {
        const message = JSON.parse(msg.data);

        if (this.isMultiStream(message)) {
          this._handlers.get(message.stream).forEach((cb: (arg0: any) => any) =>
            cb({
              asks: this.getPathValue(message, dataFormat.asks),
              bids: this.getPathValue(message, dataFormat.bids),
              symbol: this.getPathValue(message, dataFormat.symbol),
              data: message,
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
                asks: this.getPathValue(message, dataFormat.asks),
                bids: this.getPathValue(message, dataFormat.bids),
                symbol: this.getPathValue(message, dataFormat.symbol),
                data: message,
              });
            });
        } else {
          // console.log({ message });
        }
      } catch (e) {
        console.error("Parse message failed", e);
      }
    };
  }

  /**
   * check, does message have multiple stream for a single message
   * @param message web socket messaage
   * @returns {boolean}
   */
  isMultiStream(message: { stream: any }): boolean {
    return message.stream && this._handlers.has(message.stream);
  }

  /**
   * Ping the web socker server every 5 seconds
   * @returns void
   */
  heartBeat() {
    setInterval(() => {
      if (this._ws.readyState === WebSocket.OPEN) {
        this._ws.ping();
        console.log("ping server");
      }
    }, 5000);
  }

  /**
   * store a callback for a given method,
   * used in Trigger class to handle every message
   * @param method a key to store a callback
   * @param callback a function to execute for a message
   * @returns void
   */
  setHandler(method: string, callback: (params: any) => void) {
    if (!this._handlers.has(method)) {
      this._handlers.set(method, []);
    }
    this._handlers.get(method).push(callback);    
  }
}

export default PriceOracle;
