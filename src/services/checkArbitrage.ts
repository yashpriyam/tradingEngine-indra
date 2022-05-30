/**
 * we check the percentage difference between the bid price and ask Price
 * if percentage difference is greater than 1 then we return valid as true else false
 * @param askPrice ask Price for an exchange
 * @param bidPrice Bid Price for different
 * @returns {Object} it returns a object having the data and a valid boolean
 */
function checkForArbitrage(
  askPrice: number,
  bidPrice: number
): { [key: string]: any } {
  let difference: number = bidPrice - askPrice;

  let percentage_diffr: number = (difference / askPrice) * 100;
  percentage_diffr = parseFloat(percentage_diffr.toPrecision(8));

  return {
    valid: percentage_diffr >= Number(process.env.ARBITRAGE_THRESHOLD_PERCENTAGE),
    data: percentage_diffr,
  };
}

export default checkForArbitrage;
