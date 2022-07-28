const nextId = require('./next-id').init();

class Answer {
  constructor(value) {
    this.id = nextId();
    this.value = value;
  }

  update(value) {
    this.value = value;
  }
}

module.exports = Answer;
