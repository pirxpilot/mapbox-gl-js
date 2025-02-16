const config = require('./config');

module.exports = function () {
  return new window.Worker(config.WORKER_URL);
};
