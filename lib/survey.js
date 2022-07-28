const nextId = require('./next-id').init();

const Participant = require('./participant.js')
const Question = require('./question');
const Answer = require('./answer');

class Survey {
  constructor(title) {
    if (this._isInvalidTitle(title)) throw new Error("Invalid title.");
    this._nextId = nextId;

    this.id = this._nextId();
    this.title = title.trim();
    this.participants = [];
    this.questions = [];
    this.answers = [];
    this.results = []; // { participant id, quesiton id, answer id }
  }

  addParticipant(participant) {
    if (participant.constructor === Participant && !this.participants.includes(participant)) {
      this.participants.push(participant);
      return true;
    }
  }

  addQuestion(type, text, options) {
    let question = new Question(type, text, options);

    if (question) {
      this.questions.push(question);
      return true;
    }
  }

  removeQuestion(id) {
    let index = this.questions.findIndex(question => question.id === id);

    if (index !== -1) {
      this.questions.splice(index, 1);
      return true;
    }
  }

  addAnswer(participantId, questionId, answer) {
    let question = this.questions.find(question => question.id === questionId);
    let participant = this.participants.find(participant => participant.id === participantId);

    if (question && participant) {
      if ((question.type === 'closed' && question.hasOption(answer)) ||
          (question.type === 'nominal' && Array.isArray(answer)) &&
          (answer.every(value => question.hasOption(value))) ||
          (question.type === 'open' && typeof answer === 'string')) {
        let newAnswer = new Answer(answer);
        this.answers.push(newAnswer);
        this._addToResults(participantId, questionId, newAnswer.id);
        return true;
      }
    }
  }

  getAnswer(id) {
    return this.answers.find(answer => answer.id === id);
  }

  getQuestion(id) {
    return this.questions.find(question => question.id === id);
  }

  optionTotals(questionId) {
    let question = this.getQuestion(questionId);
    if (!question) return undefined;

    let results = this.results.filter(result => result.question_id === questionId);
    let answers = results.map(result => result.answer_id).map(this.getAnswer.bind(this));

    if (question.type === 'open') {
      return answers.map(answer => answer.value);
    }

    let options = question.options.map(option => option.id);
    let optionTally = {};

    options.forEach(option => {
      optionTally[option] = optionTally[option] || 0;

      for (let i = 0; i < answers.length; i++) {
        let answer = answers[i];

        if (question.type === 'closed') {
          if (answer.value === option) {
            optionTally[option] += 1;
            return;
          }
        } else if (question.type === 'nominal') {
          if (answer.value.includes(option)) {
            optionTally[option] += 1;
            return;
          }
        }
      }
    });

    return optionTally;
  }

  percentagesByOptions(questionId) {
    let question = this.getQuestion(questionId);

    if (!question) return undefined;

    if (question.type === 'open') return {};

    let optionTally = this.optionTotals(questionId);
    let numberOfParticipants = this.participants.length;

    let optionsAndPercentages = {};
    Object.keys(optionTally).forEach(option => {
      let percentage = (optionTally[option] * 100) / numberOfParticipants;
      optionsAndPercentages[option] = String(percentage).slice(0, 5);
    });

    return optionsAndPercentages;
  }

  changeTitle(title) {
    this.title = title;
  }

  _isInvalidTitle(title) {
    return typeof title !== 'string' || title.trim().length < 1;
  }

  _addToResults(participantId, questionId, answerId) {
    this.results.push({
      participant_id: participantId,
      question_id: questionId,
      answer_id: answerId,
    });
  }
}

module.exports = Survey;
