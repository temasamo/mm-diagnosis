const { searchYahoo } = require('./lib/malls/yahoo.ts');

async function test() {
  try {
    console.log('Testing Yahoo search...');
    const results = await searchYahoo('枕', 5);
    console.log('Yahoo results:', results.length);
    if (results.length > 0) {
      console.log('First result:', results[0]);
    }
  } catch (error) {
    console.error('Yahoo search error:', error);
  }
}

test();
