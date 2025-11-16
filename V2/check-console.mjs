/**
 * Launch browser and check console output for errors
 * Using Puppeteer to capture runtime errors
 */

import puppeteer from 'puppeteer';

async function checkConsole() {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu-shader-disk-cache',
      '--disable-http-cache',
      '--disable-cache',
      '--disable-application-cache',
      '--disable-offline-load-stale-cache',
      '--disk-cache-size=0'
    ],
    // Use temporary profile to ensure no cache
    userDataDir: `/tmp/puppeteer-${Date.now()}`
  });
  const page = await browser.newPage();

  const consoleMessages = [];
  const errors = [];
  const warnings = [];

  // Capture all console messages
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();

    consoleMessages.push({ type, text });

    if (type === 'error') {
      errors.push(text);
    } else if (type === 'warning') {
      warnings.push(text);
    }
  });

  // Capture page errors
  page.on('pageerror', error => {
    errors.push(`PAGE ERROR: ${error.message}`);
  });

  try {
    // Disable cache
    await page.setCacheEnabled(false);

    console.log('🌐 Navigating to http://localhost:3000/...');
    const timestamp = Date.now();
    await page.goto(`http://localhost:3000/?t=${timestamp}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // Wait a bit for WebGL initialisation and shader compilation
    console.log('⏳ Waiting for WebGL initialisation...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Take screenshot
    await page.screenshot({ path: 'browser-test.png', fullPage: true });
    console.log('📸 Screenshot saved to browser-test.png');

    // Print results
    console.log('\n' + '='.repeat(60));
    console.log('CONSOLE OUTPUT SUMMARY');
    console.log('='.repeat(60));

    if (errors.length > 0) {
      console.log('\n❌ ERRORS FOUND:');
      errors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err}`);
      });
    } else {
      console.log('\n✅ NO ERRORS');
    }

    if (warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      warnings.forEach((warn, i) => {
        console.log(`  ${i + 1}. ${warn}`);
      });
    } else {
      console.log('\n✅ NO WARNINGS');
    }

    console.log('\n📋 ALL CONSOLE MESSAGES:');
    consoleMessages.forEach(({ type, text }) => {
      const icon = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
      console.log(`  ${icon} [${type}] ${text}`);
    });

    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('❌ Error during browser testing:', error.message);
  } finally {
    await browser.close();
  }
}

checkConsole();
