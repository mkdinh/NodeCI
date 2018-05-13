const Page = require("./helpers/page");

let page;

beforeEach(async () => {
  // asynchronous launching new browser
  page = await Page.build();
  await page.goto("http://localhost:3000");
});

afterEach(async () => {
  await page.close();
});

test("The header has the correct text", async () => {
  // get content of anchor tag
  const text = await page.getContentsOf("a.brand-logo");

  expect(text).toEqual("Blogster");
});

test("clicking login starts oauth flow", async () => {
  // click on login button
  await page.click(".right a");
  // get page url
  let url = await page.url();
  // match against google 0auth flow
  expect(url).toMatch(/accounts\.google\.com/);
});

test("when signed in, show logout button", async () => {
  await page.login();
  // test will fail here
  const text = await page.getContentsOf('a[href="/auth/logout"]');
  expect(text).toEqual("Logout");
});
