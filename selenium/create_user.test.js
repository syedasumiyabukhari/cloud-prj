const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const assert = require('assert');

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3000';

describe('Create User Flow', function() {
  let driver;
  
  before(async function() {
    const options = new chrome.Options();
    options.addArguments('--headless');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--disable-gpu');
    
    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
  });
  
  after(async function() {
    if (driver) {
      await driver.quit();
    }
  });
  
  it('should navigate to new user form', async function() {
    await driver.get(BASE_URL);
    const addUserLink = await driver.findElement(By.linkText('Add User'));
    await addUserLink.click();
    
    await driver.wait(until.urlContains('/users/new'), 5000);
    const currentUrl = await driver.getCurrentUrl();
    assert.ok(currentUrl.includes('/users/new'), 'Should navigate to new user form');
  });
  
  it('should display form with name and email fields', async function() {
    await driver.get(`${BASE_URL}/users/new`);
    
    const nameInput = await driver.findElement(By.id('name'));
    const emailInput = await driver.findElement(By.id('email'));
    const submitButton = await driver.findElement(By.css('button[type="submit"]'));
    
    assert.ok(nameInput, 'Name input should exist');
    assert.ok(emailInput, 'Email input should exist');
    assert.ok(submitButton, 'Submit button should exist');
  });
  
  it('should create a new user successfully', async function() {
    await driver.get(`${BASE_URL}/users/new`);
    
    const testName = `Test User ${Date.now()}`;
    const testEmail = `test${Date.now()}@example.com`;
    
    await driver.findElement(By.id('name')).sendKeys(testName);
    await driver.findElement(By.id('email')).sendKeys(testEmail);
    await driver.findElement(By.css('button[type="submit"]')).click();
    
    // Should redirect to users list
    await driver.wait(until.urlIs(`${BASE_URL}/users`), 5000);
    
    // Verify new user appears in table
    const pageSource = await driver.getPageSource();
    assert.ok(pageSource.includes(testName), 'New user name should appear in users list');
    assert.ok(pageSource.includes(testEmail), 'New user email should appear in users list');
  });
  
  it('should have cancel button that returns to users list', async function() {
    await driver.get(`${BASE_URL}/users/new`);
    
    const cancelLink = await driver.findElement(By.linkText('Cancel'));
    await cancelLink.click();
    
    await driver.wait(until.urlIs(`${BASE_URL}/users`), 5000);
    const currentUrl = await driver.getCurrentUrl();
    assert.ok(currentUrl.includes('/users'), 'Cancel should return to users list');
  });
});
