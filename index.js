const express = require("express");
const puppeteer = require("puppeteer");
const fs = require("fs");

const app = express();
const port = process.env.PORT || 3000;
const iPhone = puppeteer.KnownDevices["iPhone 8"];

let currentPageNo = 0;
let isRunning = false;
const numberOfPages = 2035;

const [NODE, INDEX, IS_HEADLESS = true] = process.argv;

app.get("/", async (req, res) => {
  return res.json({
    message: isRunning ? `Currently on page ${currentPageNo} of ${numberOfPages}` : "Not running"
  });
});

app.get("/start", async (req, res) => {
  try {
    const browser = await puppeteer.launch({
      headless: IS_HEADLESS,
      args: [
        "--no-sandbox",
        "--window-size=1024,728",
        "--disable-setuid-sandbox",
      ],
    });

    isRunning = true

    const page = await browser.newPage();

    // set viewport
    await page.setViewport({
      width: 300,
      height: 768,
      deviceScaleFactor: 1,
      isMobile: true,
    });

    // emulate iPhone 8
    await page.emulate(iPhone);

    await page.setDefaultNavigationTimeout(90000);

    await page.setJavaScriptEnabled(false);

    // it has 2035 pages if we start from the alphabet a
    for (let i = 0; i <= numberOfPages; i++) {
      currentPageNo = i;
      let linkToScrape = `https://obastan.com/azerbaycan-dilinin-orfoqrafiya-lugeti/a?l=az&p=${i}`;

      await page.goto(linkToScrape, { waitUntil: "networkidle2" });

      // wait for the content
      await page.waitForSelector(".wl");

      // get all the words in the page
      const words = await page.evaluate((selector) => {
        const anchors_node_list = document.querySelectorAll(selector);
        const anchors = [...anchors_node_list];
        return anchors.map((link) => link.innerText);
      }, "div.wli-w > h3");

      const word_string = words.join("\n") + "\n";

      fs.writeFile(
        "az.dictionary.txt",
        word_string,
        { flag: "a+" },
        (err) => {}
      );

      await page.waitForTimeout(10000);
    }

    await browser.close();
    console.log("Browser Closed");
    res.send("Scraping Done");
  } catch (err) {
    console.log(err);
    await browser.close();
    console.log("Browser Closed");
    res.send("Some error occurred");
  }
});

// (async () => {
//   try {
//     const browser = await puppeteer.launch({
//       headless: false,
//       args: [
//         "--no-sandbox",
//         "--window-size=1024,728",
//         "--disable-setuid-sandbox",
//       ],
//     });

//     const page = await browser.newPage();

//     // set viewport
//     await page.setViewport({
//       width: 300,
//       height: 768,
//       deviceScaleFactor: 1,
//       isMobile: true,
//     });

//     // emulate iPhone 8
//     await page.emulate(iPhone);

//     await page.setDefaultNavigationTimeout(90000);

//     await page.setJavaScriptEnabled(false);

//     // it has 2035 pages if we start from the alphabet a
//     const numberOfPages = 2035;
//     for (let i = 0; i <= numberOfPages; i++) {
//       let linkToScrape = `https://obastan.com/azerbaycan-dilinin-orfoqrafiya-lugeti/a?l=az&p=${i}`;

//       await page.goto(linkToScrape, { waitUntil: "networkidle2" });

//       // wait for the content
//       await page.waitForSelector(".wl");

//       // get all the words in the page
//       const words = await page.evaluate((selector) => {
//         const anchors_node_list = document.querySelectorAll(selector);
//         const anchors = [...anchors_node_list];
//         return anchors.map((link) => link.innerText);
//       }, "div.wli-w > h3");

//       const word_string = words.join("\n") + "\n";

//       fs.writeFile(
//         "az.dictionary.txt",
//         word_string,
//         { flag: "a+" },
//         (err) => {}
//       );

//       await page.waitForTimeout(10000);
//     }

//     await browser.close();
//     console.log("Browser Closed");
//   } catch (err) {
//     console.log(err);
//     await browser.close();
//     console.log("Browser Closed");
//   }
// })();

app.listen(port, () =>
  console.log(`Data scraper app listening on port ${port}!`)
);
