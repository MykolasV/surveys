const nextId = require('./next-id').init();

class Option {
  constructor(value) {
    this.id = nextId();
    this.value = value;
  }
}

module.exports = Option;
