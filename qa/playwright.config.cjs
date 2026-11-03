const {defineConfig}=require('@playwright/test');
const path=require('node:path');
module.exports=defineConfig({
  testDir:path.join(__dirname,'browser'),
  outputDir:path.join(__dirname,'results/browser-artifacts'),
  timeout:45000,expect:{timeout:12000},
  fullyParallel:true,workers:2,retries:0,forbidOnly:Boolean(process.env.CI),
  reporter:[['line'],['html',{outputFolder:path.join(__dirname,'results/browser-html'),open:'never'}],['json',{outputFile:path.join(__dirname,'results/browser.json')}],['junit',{outputFile:path.join(__dirname,'results/browser-junit.xml')}]],
  use:{baseURL:'http://127.0.0.1:4173/zenit-alanya-site/',viewport:{width:1280,height:800},locale:'ru-RU',timezoneId:'Europe/Istanbul',colorScheme:'light',trace:'retain-on-failure',screenshot:'only-on-failure',video:'off'},
  projects:[{name:'chromium',use:{browserName:'chromium',launchOptions:{args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}}},{name:'firefox',testIgnore:['**/accessibility.spec.cjs','**/football.spec.cjs'],use:{browserName:'firefox'}},{name:'webkit',testIgnore:['**/accessibility.spec.cjs','**/football.spec.cjs'],use:{browserName:'webkit'}}],
  webServer:{command:'node qa/serve.cjs',cwd:path.resolve(__dirname,'..'),url:'http://127.0.0.1:4173/zenit-alanya-site/',reuseExistingServer:!process.env.CI,timeout:15000}
});
