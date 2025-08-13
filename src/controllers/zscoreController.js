const axios = require('axios');

function findClosest(arr, target) {
    return arr.reduce((prevIdx, curr, idx, array) => {
      return Math.abs(array[prevIdx] - target) < Math.abs(curr - target) ? prevIdx : idx;
    }, 0);
  }
  
  function numberWithCommas(x) {
    return x?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

exports.getZscore = async (req, res) => {
    const ticker = req.params.ticker;
        
    if (!ticker) {
        return res.status(400).json({ error: 'Missing ticker in path' });
    }

    const config = {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://finance.yahoo.com/',
            'Origin': 'https://finance.yahoo.com',
            'Connection': 'keep-alive',
        },
    };

    const period1 = 850262400;
    const period2 = Math.floor(new Date().setHours(10, 0, 0, 0) / 1000);
    // const fs_url = "fff"
    const fs_url = `https://query1.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/${ticker}.BK?lang=en-US&region=US&symbol=${ticker}.BK&padTimeSeries=true&type=quarterlyWorkingCapital,quarterlyTotalAssets,quarterlyRetainedEarnings,quarterlyShareIssued,quarterlyTotalLiabilitiesNetMinorityInterest,quarterlyTotalDebt,trailingTotalRevenue,trailingEBIT&merge=false&period1=${period1}&period2=${period2}&corsDomain=finance.yahoo.com`;
    const price_url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}.BK?formatted=true&lang=en-US&region=US&includeAdjustedClose=true&interval=1d&period1=${period1}&period2=${period2}&events=capitalGain|div|split&useYfid=true&corsDomain=finance.yahoo.com`;

    let message = '';

    try {
        const fs_res = await axios.get(fs_url, config);
        const price_res = await axios.get(price_url, config);
        // console.log(1)

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
    
    } catch (error) {
        console.error(`❌ Error processing ${ticker}:`, error.message);
    }

    res.send(`<pre>${message}</pre>`);
};