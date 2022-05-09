class Action {
  callback: Function;

  constructor(callback: Function) {
    this.callback = callback;
  }

  excuteAction(data: any) {
    this.callback(data);
  }
}

export default Action;
