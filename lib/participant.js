const nextId = require('./next-id');

class Participant {
  constructor() {
    this.id = nextId();
  }

  static makeParticipant(rawParticipant) {
    return Object.assign(new Participant(), rawParticipant);
  }
}

module.exports = Participant;
