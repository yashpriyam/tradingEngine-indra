import _ from 'lodash';
import CRC from 'crc-32'

const BOOK: any = {};
BOOK.bids = {}
BOOK.asks = {}
BOOK.psnap = {}
BOOK.mcnt = 0


export function checksum(msg: any){
  if(msg.length !== 3) return;

  if (msg.event) return

  if (msg[1] === 'hb') return

  // if msg contains checksum, perform checksum
  // if (msg[1] === 'cs') {
  //   const checksum = msg[2]
  //   const csdata = []
  //   const bidsKeys = BOOK.psnap['bids']
  //   const asksKeys = BOOK.psnap['asks']

  //   // collect all bids and asks into an array
  //   for (let i = 0; i < 25; i++) {
  //     if (bidsKeys[i]) {
  //       const price = bidsKeys[i]
  //       const pp = BOOK.bids[price]
  //       csdata.push(pp.price, pp.amount)
  //     }
  //     if (asksKeys[i]) {
  //       const price = asksKeys[i]
  //       const pp = BOOK.asks[price]
  //       csdata.push(pp.price, -pp.amount)
  //     }
  //   }

  //   // create string of array to compare with checksum
  //   const csStr = csdata.join(':')
  //   const csCalc = CRC.str(csStr)
  //   if (csCalc !== checksum) {
  //     console.error('CHECKSUM FAILED')
  //     process.exit(-1)
  //   } else {
  //     console.log('Checksum: ' + checksum + ' success!')
  //   }
  //   return
  // }

  // handle book. create book or update/delete price points
  if (BOOK.mcnt === 0) {
    _.each(msg[1], function (pp) {
      pp = { price: pp[0], cnt: pp[1], amount: pp[2] }
      const side = pp.amount >= 0 ? 'bids' : 'asks'
      pp.amount = Math.abs(pp.amount)
      BOOK[side][pp.price] = pp
    })
  } else {
    msg = msg[1]
    const pp = { price: msg[0], cnt: msg[1], amount: msg[2] }

    // if count is zero, then delete price point
    if (!pp.cnt) {
      let found = true

      if (pp.amount > 0) {
        if (BOOK['bids'][pp.price]) {
          delete BOOK['bids'][pp.price]
        } else {
          found = false
        }
      } else if (pp.amount < 0) {
        if (BOOK['asks'][pp.price]) {
          delete BOOK['asks'][pp.price]
        } else {
          found = false
        }
      }

      if (!found) {
        console.error('Book delete failed. Price point not found')
      }
    } else {
      // else update price point
      const side = pp.amount >= 0 ? 'bids' : 'asks'
      pp.amount = Math.abs(pp.amount)
      BOOK[side][pp.price] = pp
    }

    // save price snapshots. Checksum relies on psnaps!
    _.each(['bids', 'asks'], function (side) {
      const sbook = BOOK[side]
      const bprices = Object.keys(sbook)
      const prices = bprices.sort(function (a, b) {
        if (side === 'bids') {
          return +a >= +b ? -1 : 1
        } else {
          return +a <= +b ? -1 : 1
        }
      })
      BOOK.psnap[side] = prices
    })
  }
  BOOK.mcnt++
  console.log({BOOK})
}

