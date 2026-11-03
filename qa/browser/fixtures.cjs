const {test:base,expect}=require('@playwright/test');
const test=base.extend({runtimeGuard:[async({page},use,testInfo)=>{
  const errors=[],http=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.url().startsWith('http://127.0.0.1:4173/')&&r.status()>=400)http.push({url:r.url(),status:r.status()});});
  await use();
  await testInfo.attach('runtime-health',{body:Buffer.from(JSON.stringify({uncaughtErrors:errors,failedLocalResponses:http},null,2)),contentType:'application/json'});
  expect(errors,'No uncaught application errors').toEqual([]);
  expect(http,'No missing local assets').toEqual([]);
},{auto:true}]});
module.exports={test,expect};
