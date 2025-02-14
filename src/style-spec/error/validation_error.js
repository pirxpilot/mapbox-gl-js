'use strict';

module.exports = class ValidationError {
  constructor(key, value, message, identifier) {
    this.message = (key ? `${key}: ` : '') + message;
    if (identifier) this.identifier = identifier;

    if (value?.__line__) {
      this.line = value.__line__;
    }
  }
};
