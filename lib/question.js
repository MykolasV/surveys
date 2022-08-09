const nextId = require('./next-id');
const Option = require('./option');

class Question {
  static validTypes = ['open', 'closed', 'nominal'];

  constructor(type, text, options = []) {
    if (this.isInvalidQuestion(type, text, options)) throw new Error("Invalid question.");

    this.id = nextId();
    this.type = type;
    this.text = text.trim();
    this.options = options.map(value => new Option(value));
  }

  isInvalidQuestion(type, text, options) {
    return !Question.validTypes.includes(type) || typeof text !== 'string' ||
           text.trim().length < 1 || !Array.isArray(options);
  }

  addOption(value) {
    let option = new Option(value);

    if (option) {
      this.options.push(option);
      return true;
    }
  }

  removeOption(id) {
    let option = this.options.find(option => option.id === id);

    if (option) {
      let index = this.options.indexOf(option);
      this.options.splice(index, 1);
      return true;
    }
  }

  hasOption(id) {
    return this.options.some(option => option.id === id);
  }

  update(type, text, options = []) {
    if (!this.isInvalidQuestion(type, text, options)) {
      this.type = type;
      this.text = text;
      this.options = options.map(value => new Option(value));
      return true;
    }
  }

  static makeQuestion(rawQuestion) {
    let question = Object.assign(new Question(rawQuestion.type, rawQuestion.text), {
      id: rawQuestion.id,
    });

    rawQuestion.options.forEach(option => question.options.push(Option.makeOption(option)));
    return question;
  }
}

module.exports = Question;
