const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
const assert=require('node:assert/strict');

(async()=>{
  const browser=await chromium.launch({...launchOptions,headless:true});
  try{
    const page=await browser.newPage();
    await page.goto(previewURL,{waitUntil:'domcontentloaded'});
    const result=await page.evaluate(async()=>{
      const time=await import('/src/foundations/time.js');
      const now=new Date(2026,9,30,14,30,0,0).getTime();
      const at=milliseconds=>new Date(now-milliseconds);
      return {
        future:time.formatTimestamp(new Date(now+5000),{now}),
        zero:time.formatTimestamp(new Date(now),{now}),
        seconds9:time.formatTimestamp(at(9999),{now}),
        seconds10:time.formatTimestamp(at(10000),{now}),
        seconds59:time.formatTimestamp(at(59000),{now}),
        minute1:time.formatTimestamp(at(60000),{now}),
        minutes59:time.formatTimestamp(at(59*60000),{now}),
        hour1:time.formatTimestamp(at(60*60000),{now}),
        hours23:time.formatTimestamp(at(23*60*60000),{now}),
        day1:time.formatTimestamp(at(24*60*60000),{now}),
        days6:time.formatTimestamp(at(6*24*60*60000+23*60*60000),{now}),
        days7:time.formatTimestamp(at(7*24*60*60000),{now}),
        days10:time.formatTimestamp(at(10*24*60*60000),{now}),
        ageMinutes:time.formatAgeMinutes(0,{now}),
        absolute:time.formatAbsoluteTime(new Date(2026,0,2,9,5))
      };
    });
    assert.deepEqual(result,{
      future:'Just now',
      zero:'Just now',
      seconds9:'Just now',
      seconds10:'10 seconds ago',
      seconds59:'59 seconds ago',
      minute1:'1 minute ago',
      minutes59:'59 minutes ago',
      hour1:'1 hour ago',
      hours23:'23 hours ago',
      day1:'1 day ago',
      days6:'6 days ago',
      days7:'2026/10/23 14:30',
      days10:'2026/10/20 14:30',
      ageMinutes:'Just now',
      absolute:'2026/01/02 09:05'
    });
    console.log(JSON.stringify({ok:true,relativeWindow:'7 days',result},null,2));
  }finally{
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exit(1)});
