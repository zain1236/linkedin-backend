const express = require("express");
const dotenv = require("dotenv");
const { ConnectDB } = require("./db");
const IndexRoute = require("./Routes");
const passport = require("passport");
const errorMiddleware = require("./Middleware/error");
const cors = require("cors");
const catchAsyncError = require("./Middleware/catchAsyncError");
const { Configuration, OpenAIApi } = require("openai");
let puppeteer = require("puppeteer");
let cheerio = require("cheerio");
const { autoScroll } = require("./Utils/autoScroll");
const { time } = require("console");
const fs = require("fs").promises;
 

const app = express();
dotenv.config();
ConnectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());

passport.initialize();

require("./Config/passport");

const PORT = process.env.PORT;

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

app.post("/linkedIn", (req, res) => {
  const LINKEDIN_LOGIN_URL =
    "https://www.linkedin.com/login?fromSignIn=true&trk=guest_homepage-basic_nav-header-signin";
  var email = req.body.email;
  var password = req.body.password;
  var keyword = req.body.keyword;
  var dateFilter = req.body.time;

  puppeteer
    .launch({ headless: false })
    .then(async (browser) => {

      const sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs));

      let page = await browser.newPage();
      page.setViewport({ width: 1366, height: 768 });

      try {
        const cookiesString = await fs.readFile(
          `./cookies${email.slice(0, 5)}.json`
        );
        var cookies = JSON.parse(cookiesString);
      } catch (error) {
        console.log("no cookie found");
      }

      if (cookies) {
        console.log("cookies found");
        await page.setCookie(...cookies);
      } else {
        



        await page.goto(LINKEDIN_LOGIN_URL, { waitUntil: "domcontentloaded" });

        await page.click("#username");
        await page.keyboard.type(email);
        await page.click("#password");
        await page.keyboard.type(password);
        await page.click(
          "#organic-div > form > div.login__form_action_container > button"
        );

        await sleep(5000);

        cookies = await page.cookies();
        await fs.writeFile(
          `./cookies${email}.json`,
          JSON.stringify(cookies, null, 2)
        );
        console.log("cookies saved");
      }

      // https://www.linkedin.com/search/results/content/?datePosted=%22past-month%22&keywords=mern
      // https://www.linkedin.com/search/results/content/?datePosted=%22past-24h%22&keywords=mern&origin=FACETED_SEARCH&sid=9eU
      // https://www.linkedin.com/search/results/content/?datePosted=%22past-week%22&keywords=mern

      url =
        `https://www.linkedin.com/search/results/content/?datePosted=%22past-${dateFilter}%22&keywords=` +
        keyword;
      await page.goto(url, { waitUntil: "domcontentloaded" });
      await autoScroll(page);
      const content = await page.content();

      // console.log("content",content);
      const $ = cheerio.load(content);

      allposts = [];
      $("div.feed-shared-update-v2").each((index, element) => {
        const name = $(element).find(".feed-shared-actor__name > span").text();
        const avt = $(element)
          .find(".feed-shared-actor__avatar-image")
          .attr("src");
        const post = $(element)
          .find(".feed-shared-text > span > span > span")
          .text();
        const d = $(element)
          .find(".feed-shared-actor__sub-description > span > span:last-child")
          .text();
        const likes = $(element)
          .find(".social-details-social-counts__reactions-count")
          .text();

        t_p = {
          Author: name,
          Avatar: avt,
          Post: post,
          Date: d,
          Likes: likes,
        };
        allposts.push(t_p);
      });

      res.send({ status: 200, data: allposts });
    })
    .catch((err) => {
      console.log(" CAUGHT WITH AN ERROR ", err);
    });
});

app.post(
  "/rephrasing",
  catchAsyncError(async (req, res) => {
    const { tone, numberOfResults, length, phrase } = req.body;

    // "1. Generic\n"
    // "2. Casual\n"
    // "3. Humorous\n"
    // "4. Professional\n"
    // "5. Convincing\n"
    // "6. Inspirational\n"
    // "7. Critical\n"
    // "8. Informative\n"

    _min = numberOfResults - 1;
    _max = numberOfResults + 1;

    if (length.toLowerCase() === "normal") {
      {
        if (tone.toLowerCase() === "generic")
          prompt = `Rephrase the given text in ${_min} to ${_max} different styles, voices and formats: `;
        else
          prompt = `Rephrase the given text in ${_min} to ${_max} different styles, voices, formats and in ${tone} tone: `;
      }
    } else {
      word_count = length === "short" ? "15" : "300";
      if (tone.toLowerCase() === "generic")
        prompt = `Rephrase the given text in ${_min} to ${_max} different styles, voices and formats while keeping the length of each output below ${word_count} words: `;
      else
        prompt = `Rephrase the given text in ${_min} to ${_max} different styles, voices, formats and in ${tone} tone while keeping the length of each output below ${word_count} words: `;
    }
    prompt += phrase;

    const response = await openai.createCompletion({
      model: "text-davinci-002",
      prompt: prompt,
      temperature: 0.3,
      max_tokens: 60,
      top_p: 1.0,
      frequency_penalty: 0.8,
      presence_penalty: 0.0,
    });

    const choices = response.data.choices;
    let text = "";
    if (choices) {
      text = choices[0].text;
    }

    res.send({ data: text });
  })
);

app.use("/api/v1", IndexRoute);
app.get("/", (req, res) => {
  res.send("Server is UP and Running!!");
});

app.use(errorMiddleware);

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
