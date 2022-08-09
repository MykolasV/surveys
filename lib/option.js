const nextId = require('./next-id');

class Option {
  constructor(value) {
    this.id = nextId();
    this.value = value;
  }

  static makeOption(rawOption) {
    return Object.assign(new Option(), rawOption);
  }
}

module.exports = Option;
