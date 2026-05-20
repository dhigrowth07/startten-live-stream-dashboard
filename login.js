const puppeteer = require('puppeteer-core');
const path = require('path');
const os = require('os');
const fs = require('fs');

// ─── CONFIGURE THESE ───────────────────────────────────────────
const WEBSITE_URL = 'https://admin.startten.com/login';
const USERNAME = 'admin@startten.com';
const PASSWORD = 'Admin@123';

// Updated selectors based on actual HTML
const USERNAME_SEL = '#login_email';   
const PASSWORD_SEL = '#login_password'; 
const SUBMIT_SEL = 'button[type="submit"]'; 
// ───────────────────────────────────────────────────────────────

(async () => {
    console.log('[Puppeteer] Launching Chrome...');

    let executablePath = '';
    const platform = os.platform();

    if (platform === 'win32') {
        // Windows paths
        const chromePaths = [
            'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
            path.join(os.homedir(), 'AppData\\Local\\Google\\Chrome\\Application\\chrome.exe')
        ];
        executablePath = chromePaths.find(p => fs.existsSync(p));
    } else if (platform === 'linux') {
        // Ubuntu/Linux paths
        const linuxPaths = [
            '/usr/bin/google-chrome',
            '/usr/bin/chromium-browser',
            '/usr/bin/chromium'
        ];
        executablePath = linuxPaths.find(p => fs.existsSync(p));
    }

    if (!executablePath) {
        console.error(`Error: Chrome not found on ${platform}. Please install Chrome or set executablePath manually.`);
        process.exit(1);
    }

    let browser;
    try {
        browser = await puppeteer.launch({
            executablePath: executablePath,
            userDataDir: path.join(process.cwd(), 'chrome-profile'),
            headless: false,
            defaultViewport: null,
            ignoreDefaultArgs: ['--enable-automation'], // Hides "Chrome is being controlled..." bar
            args: [
                '--window-size=1280,720',
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--kiosk', // Full screen without address bar/tabs
                '--disable-infobars',
                '--disable-session-crashed-bubble', // Hides "Restore pages" popup
                '--no-first-run',
                '--no-default-browser-check'
            ]
        });


        browser.on('disconnected', () => {
            console.log('[Puppeteer] Browser was closed or disconnected.');
            process.exit(0);
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 720 });

        console.log('[Puppeteer] Navigating to login page...');
        await page.goto(WEBSITE_URL, { waitUntil: 'networkidle2', timeout: 60000 });

        // Check if we are already logged in
        const currentUrl = page.url();
        const isAlreadyLoggedIn = currentUrl.includes('/dashboard');

        if (isAlreadyLoggedIn) {
            console.log('[Puppeteer] Already logged in (detected by URL). Skipping credentials...');
        } else {
            console.log('[Puppeteer] Checking for login form...');
            try {
                // Wait a short time to see if the login field appears
                await page.waitForSelector(USERNAME_SEL, { timeout: 10000 });
                
                console.log('[Puppeteer] Filling credentials...');
                await page.click(USERNAME_SEL);
                await page.type(USERNAME_SEL, USERNAME, { delay: 80 });

                await page.waitForSelector(PASSWORD_SEL, { timeout: 10000 });
                await page.click(PASSWORD_SEL);
                await page.type(PASSWORD_SEL, PASSWORD, { delay: 80 });

                console.log('[Puppeteer] Submitting login form...');
                await Promise.all([
                    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }).catch(e => console.log('[Puppeteer] Navigation warning:', e.message)),
                    page.click(SUBMIT_SEL),
                ]);
            } catch (formError) {
                console.log('[Puppeteer] Login form not found. You might already be logged in or on a different page.');
            }
        }

        console.log('[Puppeteer] Current URL:', page.url());
        console.log('[Puppeteer] Browser staying open for capture...');


    } catch (error) {
        console.error('[Puppeteer] AN ERROR OCCURRED:', error.message);
        console.log('[Puppeteer] Attempting to keep the browser open for debugging...');
    }

    // Keep the process alive indefinitely
    await new Promise(() => { });
})();