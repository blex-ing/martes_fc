import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir:'./tests/visual',
  timeout:30_000,
  retries:process.env.CI?1:0,
  reporter:process.env.CI?'html':'list',
  outputDir:'test-results/visual',
  use:{baseURL:'http://127.0.0.1:4173',trace:'retain-on-failure'},
  projects:[
    {name:'desktop-chromium',use:{...devices['Desktop Chrome'],viewport:{width:1440,height:900}}},
    {name:'tablet-chromium',use:{...devices['Desktop Chrome'],viewport:{width:768,height:1024},isMobile:true,hasTouch:true}},
    {name:'compact-chromium',use:{...devices['iPhone 13'],defaultBrowserType:'chromium',viewport:{width:320,height:720}}},
    {name:'mobile-chromium',use:{...devices['iPhone 13'],defaultBrowserType:'chromium'}},
    {name:'mobile-webkit',use:{...devices['iPhone 13']}},
    {name:'compact-webkit',use:{...devices['iPhone 13'],viewport:{width:320,height:720}}}
  ],
  webServer:{command:'npm run dev',url:'http://127.0.0.1:4173',reuseExistingServer:!process.env.CI,timeout:60_000}
});
