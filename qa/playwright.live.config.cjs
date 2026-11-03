const {defineConfig}=require('@playwright/test');
const path=require('node:path');
module.exports=defineConfig({
  testDir:path.join(__dirname,'live'),outputDir:path.join(__dirname,'results/live-browser-artifacts'),
  timeout:45000,expect:{timeout:15000},workers:2,retries:0,forbidOnly:true,
  reporter:[['line'],['html',{outputFolder:path.join(__dirname,'results/live-browser-html'),open:'never'}],['json',{outputFile:path.join(__dirname,'results/live-browser.json')}]],
  use:{baseURL:'https://safal207.github.io/zenit-alanya-site/',browserName:'chromium',viewport:{width:1280,height:800},locale:'ru-RU',colorScheme:'light',trace:'retain-on-failure',screenshot:'only-on-failure'}
});
