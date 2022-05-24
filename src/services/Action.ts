class Action {
  callback: Function;

  /**
   * it takes a callback function and store it
   * which can be called using excuteAction method
   * @param callback
   */
  constructor(callback: Function) {
    this.callback = callback;
  }

  /**
   * execute the callback function using this method
   * @param data data to pass to the callback function
   */
  excuteAction(data: any) {
    console.log("action executed");
    this.callback(data);
  }
}

export default Action;
