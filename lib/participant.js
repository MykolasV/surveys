const nextId = require('./next-id').init();

class Participant {
  constructor() {
    this.id = nextId();
  }
}

module.exports = Participant;
