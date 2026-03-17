const axios = require('axios')

async function zScore(replyToken, ticker) {

  const config = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
    }
  }
  
  let message = "";

  try {
    console.log(`https://query1.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/${ticker}.BK?lang=en-US&region=US&symbol=${ticker}.BK&padTimeSeries=true&type=quarterlyWorkingCapital,quarterlyTotalAssets,quarterlyRetainedEarnings,quarterlyShareIssued,quarterlyTotalDebt,trailingTotalRevenue,trailingEBIT&merge=false&period1=850262400&period2=${new Date().setHours(10, 0, 0, 0) / 1000}&corsDomain=finance.yahoo.com`)
    const fs_res = await axios.get(`https://query1.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/${ticker}.BK?lang=en-US&region=US&symbol=${ticker}.BK&padTimeSeries=true&type=quarterlyWorkingCapital,quarterlyTotalAssets,quarterlyRetainedEarnings,quarterlyShareIssued,quarterlyTotalLiabilitiesNetMinorityInterest,quarterlyTotalDebt,trailingTotalRevenue,trailingEBIT&merge=false&period1=850262400&period2=${new Date().setHours(10, 0, 0, 0) / 1000}&corsDomain=finance.yahoo.com`, config)
    const price_res = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}.BK?formatted=true&crumb=3PtFND5i2mA&lang=en-US&region=US&includeAdjustedClose=true&interval=1d&period1=850262400&period2=${new Date().setHours(10, 0, 0, 0) / 1000}&events=capitalGain|div|split&useYfid=true&corsDomain=finance.yahoo.com`, config)
    
    const items = {}
    const ts = []
  
    fs_res.data.timeseries.result.map((item) => {
      const lastIndex = item[item.meta.type[0]].length - 1;
      items[item.meta.type[0]] = item[item.meta.type[0]][lastIndex].reportedValue.raw
  
      if (!ts.includes(item.timestamp[lastIndex])) {
        ts.push(item.timestamp[lastIndex])
      }
    })
  
    if (ts.length == 1) {
      const closestIndex = findClosest(price_res.data.chart.result[0].timestamp, ts[0]);
      items.price = price_res.data.chart.result[0].indicators.quote[0].close[closestIndex]
    } else {
      return 'error'
    }
  
    let A = items['quarterlyWorkingCapital'] / items['quarterlyTotalAssets']
    let B = items['quarterlyRetainedEarnings'] / items['quarterlyTotalAssets']
    let C = items['trailingEBIT'] / items['quarterlyTotalAssets']
    // let D = (items['price'] * items['quarterlyShareIssued']) / items['quarterlyTotalDebt']
    let D = (items['price'] * items['quarterlyShareIssued']) / items['quarterlyTotalLiabilitiesNetMinorityInterest']
    let E = items['trailingTotalRevenue'] / items['quarterlyTotalAssets']
    
    message = `${ticker} dated ${new Date(ts[0] * 1000)}\n`
    message += `Working Capital = ${numberWithCommas(items['quarterlyWorkingCapital'])}\n`
    message += `Retained Earnings = ${numberWithCommas(items['quarterlyRetainedEarnings'])}\n`
    message += `EBIT = ${numberWithCommas(items['trailingEBIT'])}\n`
    message += `Revenue = ${numberWithCommas(items['trailingTotalRevenue'])}\n`
    message += `T. Asset = ${numberWithCommas(items['quarterlyTotalAssets'])}\n`
    // message += `T. Debt = ${numberWithCommas(items['quarterlyTotalDebt'])}\n`
    message += `T. Debt = ${numberWithCommas(items['quarterlyTotalLiabilitiesNetMinorityInterest'])}\n`
    message += `Market Cap. = ${numberWithCommas(Math.round(items['price'] * items['quarterlyShareIssued']))}\n-----\n`
    message += `X1 = ${Math.round(A*10000)/10000} (WC/TA)\n`
    message += `X2 = ${Math.round(B*10000)/10000} (RE/TA)\n`
    message += `X3 = ${Math.round(C*10000)/10000} (EBIT/TA)\n`
    message += `X4 = ${Math.round(D*10000)/10000} (MCAP/TD)\n`
    message += `X5 = ${Math.round(E*10000)/10000} (S/TA)\n----\n`
    message += `ZScore = ${Math.round((1.2*A + 1.4*B + 3.3*C + 0.6*D + 1.0*E)*10000)/10000}`

  } catch {
    // message = 'Ticker not exist'
    resError(replyToken)
  }

  if (replyToken) {
    await axios.post('https://api.line.me/v2/bot/message/reply', {
      replyToken,
      messages: [
        { type: 'text', text: message }
      ]
    }, {
      headers: {
        authorization: `Bearer ${process.env['CHANNEL_ACCESS_TOKEN']}`
      }
    })
  }
}

const findClosest = (array, goal) => {
  if (array.length > 0) {
    let index = 0;
    let error = Math.abs(array[0] - goal);
    for (let i = 1; i < array.length; ++i) {
      const e = Math.abs(array[i] - goal);
      if (e < error) {
        index = i;
        error = e;
      }
    }
    return index;
  }
  return -1;
};

function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

async function resError(replyToken) {
  if (replyToken) {
    await axios.post('https://api.line.me/v2/bot/message/reply', {
      replyToken,
      messages: [
        { 
          type: 'text', 
          text: 'Ticker or zscore Ticker (check spacing) \
                  \nex: zscore cpall \
                  \nex: cpall \
                  \nor Ticker does not exist' 
        }
      ]
    }, {
      headers: {
        authorization: `Bearer ${process.env['CHANNEL_ACCESS_TOKEN']}`
      }
    })
  }
}

module.exports = { zScore, resError }