function checkForArbitrage(askPrice: number, bidPrice: number): boolean {
  // console.log({askPrice, bidPrice});
  
  // if (askPrice >= bidPrice) return false;
  // else {
    let difference: number = bidPrice - askPrice;

    let percentage_diffr: number = (difference / askPrice) * 100;
    // percentage_diffr = parseFloat(percentage_diffr).toPrecision(5);

    // console.log({ percentage_diffr });

    return percentage_diffr >= 1;
  // }
}

export default checkForArbitrage;
