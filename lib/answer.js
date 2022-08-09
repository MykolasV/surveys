const nextId = require('./next-id');

class Answer {
  constructor(value) {
    this.id = nextId();
    this.value = value;
  }

  update(value) {
    this.value = value;
  }

  static makeAnswer(rawAnswer) {
    return Object.assign(new Answer(), rawAnswer);
  }
}

module.exports = Answer;
