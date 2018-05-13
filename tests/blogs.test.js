const Page = require("./helpers/page");
let page;

beforeEach(async () => {
  page = await Page.build();
});

afterEach(async () => {
  // await page.close();
});

//--------------------------------------------------------
describe("When logged in", () => {
  beforeEach(async () => {
    await page.login();
    await page.click("a.btn-floating");
  });

  test("can see blog create form", async () => {
    // // click new blog button
    const label = await page.getContentsOf("form label");
    expect(label).toEqual("Blog Title");
  });

  //--------------------------------------------------------
  describe("And using valid inputs", async () => {
    beforeEach(async () => {
      await page.type("input[name='title']", "My Test Blog");
      await page.type("input[name='content'", "some content here");
      await page.click("form button");
    });

    test("Submitting takes user to review screen", async () => {
      const confirmMessage = await page.getContentsOf("form h5");
      expect(confirmMessage).toEqual("Please confirm your entries");
    });

    test("Submitting then saving adds blog to index page", async () => {
      await page.click("button.green");
      await page.waitFor(".card");

      const title = await page.getContentsOf(".card-title");
      const content = await page.getContentsOf("p");

      expect(title).toEqual("My Test Blog");
      expect(content).toEqual("some content here");
    });
  });

  //--------------------------------------------------------
  describe("And using invalid inputs", async () => {
    beforeEach(async () => {
      await page.click("form button");
    });

    test("the form shows an error message", async () => {
      const titleError = await page.getContentsOf(".title .red-text");
      const contentError = await page.getContentsOf(".content .red-text");

      expect(titleError).toEqual("You must provide a value");
      expect(contentError).toEqual("You must provide a value");
    });
  });
});

//--------------------------------------------------------
describe("When not logged in", () => {
  const actions = [
    {
      method: "get",
      path: "api/blogs",
    },
    {
      method: "post",
      path: "/api/blogs",
      data: {
        title: "T",
        body: "C",
      },
    },
  ];

  test("Blog related acions are prohibited", async () => {
    const results = await page.execRequests(actions);
    for (let result of results) {
      expect(result).toEqual({ error: "You must log in!" });
    }
  });
});
