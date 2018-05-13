const mongoose = require("mongoose");
const redis = require("redis");
const util = require("util");
const keys = require("../config/keys");

let client;

if (["ci"].contains(process.env.NODE_ENV)) {
  client = redis.createClient(keys.redisPort, keys.redisURI, {
    no_ready_check: true,
  });

  client.auth(keys.redisPassword, function(err) {
    if (err) throw err;
  });
} else {
  client = redis.createClient(keys.redisURI);
}

client.hget = util.promisify(client.hget);
const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = function(options = {}) {
  this._cache = true;
  // make sure that it is a string
  this._hashKey = JSON.stringify(options.key || "");
  return this;
};

mongoose.Query.prototype.exec = async function() {
  // return cache if not
  if (!this._cache) return exec.apply(this, arguments);

  const key = Object.assign({}, this.getQuery(), {
    collection: this.mongooseCollection.name,
  });
  // stringify key
  const keyStr = JSON.stringify(key);
  try {
    const cacheValue = await client.hget(this._hashKey, keyStr);
    // se if we hae a value for key in redis
    if (cacheValue) {
      console.log("read from cache");
      // create new documentation
      let doc = JSON.parse(cacheValue);

      return Array.isArray(doc)
        ? doc.map(d => new this.model(d))
        : new this.model(doc);
    }
  } catch (err) {
    if (err) throw err;
    return exec.apply(this, arguments);
  }

  // run origin exec function from mongoose
  // be conscious of what is being returned
  // return a model instance
  const result = await exec.apply(this, arguments);
  // only getting the json object, no prototypal properties
  const resultJson = JSON.stringify(result);
  // set expiration for cache
  client.hset(this._hashKey, keyStr, resultJson);

  return result;
};

module.exports = {
  clearHash(hashKey) {
    client.del(JSON.stringify(hashKey));
  },
};
