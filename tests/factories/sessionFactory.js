const Keygrip = require("keygrip");
const Buffer = require("safe-buffer").Buffer;
const keys = require("../../config/keys");
// create new keygrip with application's cookiekey from cookieSession
const keyGrip = new Keygrip([keys.cookieKey]);

module.exports = user => {
  // buffer convert JSON format session object into buffer => base64
  // user._id is a javascript object
  const sessionObject = {
    passport: {
      user: user._id.toString(),
    },
  };
  // user convert to base64 cookies
  const session = Buffer.from(JSON.stringify(sessionObject)).toString("base64");
  // unique signature of cookie
  const sig = keyGrip.sign("session=" + session);

  return {
    session,
    sig,
  };
};
