const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const assert = require('assert');

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3000';

describe('Home and Users Navigation', function() {
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
  
  it('should load home page and display title', async function() {
    await driver.get(BASE_URL);
    const title = await driver.getTitle();
    assert.ok(title.includes('Welcome'), 'Title should contain Welcome');
    
    const heading = await driver.findElement(By.css('h1')).getText();
    assert.ok(heading.includes('Welcome'), 'Heading should contain Welcome');
  });
  
  it('should navigate to users page', async function() {
    await driver.get(BASE_URL);
    const usersLink = await driver.findElement(By.linkText('Users'));
    await usersLink.click();
    
    await driver.wait(until.urlContains('/users'), 5000);
    const currentUrl = await driver.getCurrentUrl();
    assert.ok(currentUrl.includes('/users'), 'Should navigate to users page');
  });
  
  it('should display users table with sample data', async function() {
    await driver.get(`${BASE_URL}/users`);
    
    const table = await driver.findElement(By.css('table'));
    assert.ok(table, 'Users table should exist');
    
    const rows = await driver.findElements(By.css('tbody tr'));
    assert.ok(rows.length >= 3, 'Should have at least 3 sample users');
  });
  
  it('should have navigation links on every page', async function() {
    await driver.get(BASE_URL);
    
    const homeLink = await driver.findElement(By.linkText('Home'));
    const usersLink = await driver.findElement(By.linkText('Users'));
    const addUserLink = await driver.findElement(By.linkText('Add User'));
    
    assert.ok(homeLink, 'Home link should exist');
    assert.ok(usersLink, 'Users link should exist');
    assert.ok(addUserLink, 'Add User link should exist');
  });
});
