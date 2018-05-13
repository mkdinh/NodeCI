const puppeteer = require("puppeteer");
const sessionFactory = require("../factories/sessionFactory");
const userFactory = require("../factories/userFactory");

class CustomPage {
  static async build() {
    const browser = await puppeteer.launch({
      headless: true,
      // keep us from tinker around with other settings
      args: ["--no-sandbox"],
    });

    const page = await browser.newPage();
    const customPage = new CustomPage(page);

    // return new proxy for managing page function without modifying
    // puppeteer's page instance
    return new Proxy(customPage, {
      get: function(target, property) {
        return target[property] || browser[property] || page[property];
      },
    });
  }
  // new instance of customPage save puppeteer page instance reference
  constructor(page) {
    this.page = page;
  }

  // handle authentication
  async login() {
    const user = await userFactory();
    const { session, sig } = sessionFactory(user);
    // set session cookie
    await this.page.setCookie({
      name: "session",
      value: session,
    });
    // set session content
    await this.page.setCookie({
      name: "session.sig",
      value: sig,
    });
    // allow app to render
    await this.page.goto("http://localhost:3000/blogs");
    await this.page.waitFor('a[href="/auth/logout"]');
  }

  async logout() {
    await this.goto("http://localhost:3000/logout");
  }

  async getContentsOf(selector) {
    return this.page.$eval(selector, el => el.innerHTML);
  }

  get(url) {
    // return to string
    // eval as string on browser
    // pass arguments of callbacks as subsequent arguments in evaluate
    return this.page.evaluate(_url => {
      return fetch(_url, {
        method: "GET",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
      }).then(res => res.json());
    }, url);
  }

  post(url, body) {
    return this.page.evaluate(
      (_url, _body) => {
        return fetch(_url, {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(_body),
        }).then(res => res.json());
      },
      url,
      body,
    );
  }

  execRequests(actions) {
    // return an array of promises
    return Promise.all(
      actions.map(({ method, path, data }) => {
        return this[method](path, data);
      }),
    );
  }
}

module.exports = CustomPage;
