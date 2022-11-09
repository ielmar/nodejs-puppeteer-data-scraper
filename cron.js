const puppeteer = require("puppeteer");
const fs = require('fs')
const iPhone = puppeteer.KnownDevices[ 'iPhone 8' ];


(async () => {
  try {

    const browser = await puppeteer.launch({
      headless: false,
      args: [
          "--no-sandbox",
          '--window-size=1024,728',
          "--disable-setuid-sandbox"
      ],
    });

    const page = await browser.newPage();

    // set viewport
    await page.setViewport({
        width: 300,
        height: 768,
        deviceScaleFactor: 1,
        isMobile: true
    });

    // emulate iPhone 8
    await page.emulate(iPhone);

    await page.setDefaultNavigationTimeout( 90000 );

    await page.setJavaScriptEnabled(false);

    // it has 2035 pages if we start from the alphabet a
    const numberOfPages = 2035
    for (let i = 0; i <= numberOfPages; i++) {

      let obastanLink = `https://obastan.com/azerbaycan-dilinin-orfoqrafiya-lugeti/a?l=az&p=${i}`

      await page.goto(obastanLink, {waitUntil: 'networkidle2'});

      // wait for the content
      await page.waitForSelector('.wl');

      // get all the words in the page
      const words = await page.evaluate((selector) => {
        const anchors_node_list = document.querySelectorAll(selector);
        const anchors = [...anchors_node_list];
        return anchors.map(link => link.innerText);
      }, 'div.wli-w > h3')

      const word_string = words.join("\n")+"\n"

      fs.writeFile('az.dictionary.txt', word_string, { flag: 'a+' }, err => {})

      await page.waitForTimeout(5000)
    }

    await browser.close();
    console.log("Browser Closed");
  } catch (err) {

    // Catch and display errors
    console.log(err);
    await browser.close();
    console.log("Browser Closed");
  }
})();