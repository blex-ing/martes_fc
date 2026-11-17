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
    {name:'mobile-chromium',use:{...devices['iPhone 13'],defaultBrowserType:'chromium'}}
  ],
  webServer:{command:'npm run dev',url:'http://127.0.0.1:4173',reuseExistingServer:!process.env.CI,timeout:60_000}
});
