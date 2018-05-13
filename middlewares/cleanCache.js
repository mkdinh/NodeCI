const { clearHash } = require("../services/cache");

module.exports = async (req, res, next) => {
  // await route handler to complete before coming back
  await next();
  clearHash(req.user.id);
};
