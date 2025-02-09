module.exports = {
  callback,
  callbackWithSpread,
  callbackWithNoResult
};

function callback(fn, promise) {
  if (fn) {
    promise.then(result => fn(null, result), fn);
  }
  return promise;
}

function callbackWithSpread(fn, promise) {
  if (fn) {
    promise.then(result => fn(null, ...result), fn);
  }
  return promise;
}

function callbackWithNoResult(fn, promise) {
  if (fn) {
    promise.then(() => fn(null), fn);
  }
  return promise;
}
