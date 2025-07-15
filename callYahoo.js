const axios = require('axios');

const ticker = 'CPALL'; // Change this to your desired symbol
const period1 = 850262400;
const period2 = Math.floor(new Date().setHours(10, 0, 0, 0) / 1000);

// Headers to mimic browser
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

// URLs
const fs_url = `https://query1.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/${ticker}.BK?lang=en-US&region=US&symbol=${ticker}.BK&padTimeSeries=true&type=quarterlyWorkingCapital,quarterlyTotalAssets,quarterlyRetainedEarnings,quarterlyShareIssued,quarterlyTotalLiabilitiesNetMinorityInterest,quarterlyTotalDebt,trailingTotalRevenue,trailingEBIT&merge=false&period1=${period1}&period2=${period2}&corsDomain=finance.yahoo.com`;

const price_url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}.BK?formatted=true&lang=en-US&region=US&includeAdjustedClose=true&interval=1d&period1=${period1}&period2=${period2}&events=capitalGain|div|split&useYfid=true&corsDomain=finance.yahoo.com`;

// Async function to call Yahoo
async function fetchYahooData() {
  try {
    console.log(`📡 Calling Yahoo Finance for ${ticker}.BK`);

    const fs_res = await axios.get(fs_url, config);
    const price_res = await axios.get(price_url, config);

    console.log('✅ Fundamentals data received:');
    console.dir(fs_res.data, { depth: null });

    console.log('\n✅ Price data received:');
    console.dir(price_res.data, { depth: null });

  } catch (error) {
    if (error.response?.status === 429) {
      console.error('❌ 429 Too Many Requests - Rate limited by Yahoo');
    } else {
      console.error('❌ Error calling Yahoo:', error.message);
    }
  }
}

fetchYahooData();
