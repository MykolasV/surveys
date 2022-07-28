const Survey = require('../lib/survey');
const Participant = require('../lib/participant');

describe("Survey", () => {
  test("survey title must be a string", () => {
    expect(() => new Survey(['questionare'])).toThrow();

    let survey = new Survey('Valid Title');
    expect(survey.title).toEqual('Valid Title');
  });
});

describe("Survey", () => {
  test("survey title must be a non-empty string", () => {
    expect(() => new Survey('  ')).toThrow();
  });
});

describe("Survey", () => {
  test("successfuly adding a participant returns true", () => {
    let survey = new Survey('example');
    let participant = new Participant();
    expect(survey.addParticipant(participant)).toEqual(true);
  });
});

describe("Survey", () => {
  test("survey title can be changed", () => {

    let survey = new Survey('First Title');
    survey.changeTitle('Second Title');
    expect(survey.title).toEqual('Second Title');
  });
});

describe("Survey", () => {
  test("adding participants that are not objects of Participant class is illegal", () => {
    let survey = new Survey('example');
    survey.addParticipant({ name: 'Mykolas'} );
    expect(survey.participants.length).toEqual(0);
  });
});

describe("Survey", () => {
  test("adding a participant that already exists is illegal", () => {
    let survey = new Survey('example');
    let participant = new Participant();
    survey.addParticipant(participant);
    survey.addParticipant(participant);
    expect(survey.participants.length).toEqual(1);
  });
});

describe("Survey", () => {
  test("successfuly adding a question returns true", () => {
    let survey = new Survey('example');

    expect(survey.addQuestion('closed', 'Which number do you prefer?', [1, 5, 7, 11])).toEqual(true);
    expect(survey.questions.length).toEqual(1);
  });
});

describe("Survey", () => {
  test("adding questions of invalid types is illegal", () => {
    let survey = new Survey('example');
    expect(() => {
      survey.addQuestion('rating scale', 'How would you rate chocolate ice cream?', ['1', '10'])
    }).toThrow();
  });
});

describe("Survey", () => {
  test("question text must be a string", () => {
    let survey = new Survey('example');
    expect(() => {
      survey.addQuestion('closed', ["Which number do you prefer?"], [1, 5, 7, 11])
    }).toThrow();
  });
});

describe("Survey", () => {
  test("question text must be a non-empty string", () => {
    let survey = new Survey('example');
    expect(() => {
      survey.addQuestion('closed', '  ', [1, 5, 7, 11])
    }).toThrow();
  });
});

describe("Survey", () => {
  test("question options must be provided as an array", () => {
    let survey = new Survey('example');
    expect(() => {
      survey.addQuestion('closed', "Which number do you prefer?", '1, 2, 3, 4')
    }).toThrow();

    survey.addQuestion('closed', "Which number do you prefer?", [1, 2, 3, 4]);
    expect(survey.questions.length).toEqual(1);
  });
});

describe("Survey", () => {
  test("an option can be added after a question is created", () => {
    let survey = new Survey('example');
    survey.addQuestion('closed', "Which number do you prefer?", [1, 2, 3, 4]);
    let question = survey.questions[0];
    question.addOption(5);

    expect(question.options.length).toEqual(5);
    expect(question.options[question.options.length - 1].value).toEqual(5);
  });
});


describe("Survey", () => {
  test("an option can be removed from a question", () => {
    let survey = new Survey('example');
    survey.addQuestion('closed', "Which number do you prefer?", [1, 2, 3, 4]);
    let question = survey.questions[0];
    question.removeOption(question.options[0].id);

    expect(question.options.length).toEqual(3);
    expect(question.options.map(option => option.value)).toEqual([2, 3, 4]);
  });
});

describe("Survey", () => {
  test("question can be updated", () => {
    let survey = new Survey('example');
    survey.addQuestion('closed', "Which number do you prefer?", [1, 2, 3, 4]);
    let question = survey.questions[0];

    expect([question.type, question.text, question.options.map(option => option.value)])
      .toEqual(['closed', "Which number do you prefer?", [1, 2, 3, 4]]);

    question.update("open", "Which number do you prefer?");
    expect([question.type, question.text, question.options]).toEqual(["open", "Which number do you prefer?", []]);
  });
});

describe("Survey", () => {
  test("removing a question succesfully returns true", () => {
    let survey = new Survey('example');
    survey.addQuestion('closed', 'Which number do you prefer?', [1, 5, 7, 11]);
    let question = survey.questions[survey.questions.length - 1];

    expect(survey.removeQuestion(question.id)).toEqual(true);
    expect(survey.questions.length).toEqual(0);
  });
});

describe("Survey", () => {
  test("attemptying to remove a question that doesn't exist returns undefined", () => {
    let survey = new Survey('example');
    survey.addQuestion('closed', 'Which number do you prefer?', [1, 5, 7, 11]);

    expect(survey.removeQuestion(100)).toBeUndefined();
    expect(survey.questions.length).toEqual(1);
  });
});

describe("Survey", () => {
  test("the input for id when removing a question must be an integer", () => {
    let survey = new Survey('example');
    survey.addQuestion('closed', 'Which number do you prefer?', [1, 5, 7, 11]);
    let question = survey.questions[survey.questions.length - 1];

    expect(survey.removeQuestion(String(question.id))).toBeUndefined();
    expect(survey.questions.length).toEqual(1);
  });
});

describe("Survey", () => {
  test("successfuly adding an answer returns true", () => {
    let survey = new Survey('example');
    let participant = new Participant();
    survey.addParticipant(participant);
    survey.addQuestion('closed', 'Which number do you prefer?', [1, 5, 7, 11]);
    let question = survey.questions[survey.questions.length - 1];
    let option = question.options[question.options.length - 1];

    expect(survey.addAnswer(participant.id, question.id, option.id)).toEqual(true);
  });
});

describe("Survey", () => {
  test("answer can be updated", () => {
    let survey = new Survey('example');
    let participant = new Participant();
    survey.addParticipant(participant);
    survey.addQuestion('closed', 'Which number do you prefer?', [1, 5, 7, 11]);
    let question = survey.questions[survey.questions.length - 1];
    let firstOptionId = question.options[0].id;
    let lastOptionId = question.options[question.options.length - 1].id;

    survey.addAnswer(participant.id, question.id, firstOptionId);

    expect(survey.answers[0].value).toEqual(firstOptionId);
    survey.answers[0].update(lastOptionId);
    expect(survey.answers[0].value).toEqual(lastOptionId);
  });
});

describe("Survey", () => {
  test("providing invalid inputs when attempting to add an answer returns undefined", () => {
    let survey = new Survey('example');
    let participant = new Participant();
    survey.addParticipant(participant);
    survey.addQuestion('closed', 'Which number do you prefer?', [1, 5, 7, 11]);
    let question = survey.questions[survey.questions.length - 1];
    let option = question.options[question.options.length - 1];

    expect(survey.addAnswer(String(participant.id), question.id, option.id)).toBeUndefined();
    expect(survey.addAnswer(participant.id, 100, option.id)).toBeUndefined();
    expect(survey.addAnswer(participant.id, question.id, [option.id])).toBeUndefined();
  });
});

describe("Survey", () => {
  test("get answer by id returns the correct answer", () => {
    let survey = new Survey('example');
    let participant = new Participant();
    survey.addParticipant(participant);
    survey.addQuestion('closed', 'Which number do you prefer?', [1, 5, 7, 11]);
    let question = survey.questions[survey.questions.length - 1];
    let option = question.options[question.options.length - 1];

    survey.addAnswer(participant.id, question.id, option.id);
    let answer = survey.answers[survey.answers.length - 1];
    expect(survey.getAnswer(answer.id)).toBe(answer);
  });
});

describe("Survey", () => {
  test("get question by id returns the correct question", () => {
    let survey = new Survey('example');
    survey.addQuestion('closed', 'Which number do you prefer?', [1, 5, 7, 11]);
    let question = survey.questions[survey.questions.length - 1];

    expect(survey.getQuestion(question.id)).toBe(question);
  });
});

describe("Survey", () => {
  test("option totals return an object with correct totals", () => {
    let survey = new Survey('example');

    let participant = new Participant();
    survey.addParticipant(participant);
    survey.addQuestion('closed', 'Which number do you prefer?', [1, 5, 7, 11]);

    let question = survey.questions[survey.questions.length - 1];
    let optionIds = question.options.map(option => option.id);
    let totals = {};
    optionIds.forEach(id => totals[id] = 0);

    survey.addAnswer(participant.id, question.id, optionIds[0]);
    totals[optionIds[0]] += 1;

    expect(survey.optionTotals(question.id)).toEqual(totals);
  });
});

describe("Survey", () => {
  test("option totals return undefined when the input is invalid", () => {
    let survey = new Survey('example');

    let participant = new Participant();
    survey.addParticipant(participant);
    survey.addQuestion('closed', 'Which number do you prefer?', [1, 5, 7, 11]);

    let question = survey.questions[survey.questions.length - 1];
    let optionIds = question.options.map(option => option.id);
    let totals = {};
    optionIds.forEach(id => totals[id] = 0);

    survey.addAnswer(participant.id, question.id, optionIds[0]);
    totals[optionIds[0]] += 1;

    expect(survey.optionTotals(String(question.id))).toBeUndefined();
    expect(survey.optionTotals(10000000)).toBeUndefined();
    expect(survey.optionTotals([question.id])).toBeUndefined();
  });
});

describe("Survey", () => {
  test("option totals return an array with answers when the question type is open", () => {
    let survey = new Survey('example');

    let participant1 = new Participant();
    let participant2 = new Participant();
    survey.addParticipant(participant1);
    survey.addParticipant(participant2);
    survey.addQuestion('open', 'Which number do you prefer?');

    let question = survey.questions[survey.questions.length - 1];

    survey.addAnswer(participant1.id, question.id, 'I like red');
    survey.addAnswer(participant2.id, question.id, 'I like blue');

    let totals = ['I like red', 'I like blue'];

    expect(survey.optionTotals(question.id)).toEqual(totals);
  });
});

describe("Survey", () => {
  test("percentages by options return an object with correct answer percentage representations", () => {
    let survey = new Survey('example');

    let participant1 = new Participant();
    let participant2 = new Participant();
    survey.addParticipant(participant1);
    survey.addParticipant(participant2)
    survey.addQuestion('closed', 'Which number do you prefer?', [1, 5, 7, 11]);

    let question = survey.questions[survey.questions.length - 1];
    let optionIds = question.options.map(option => option.id);
    let percentages = {};
    optionIds.forEach(id => percentages[id] = '0');

    survey.addAnswer(participant1.id, question.id, optionIds[0]);
    survey.addAnswer(participant2.id, question.id, optionIds[1]);
    percentages[optionIds[0]] = '50';
    percentages[optionIds[1]] = '50';

    expect(survey.percentagesByOptions(question.id)).toEqual(percentages);
  });
});

describe("Survey", () => {
  test("percentages by options return an empty object when the question type is open", () => {
    let survey = new Survey('example');

    let participant1 = new Participant();
    let participant2 = new Participant();
    survey.addParticipant(participant1);
    survey.addParticipant(participant2)
    survey.addQuestion('open', 'Which number do you prefer?');

    let question = survey.questions[survey.questions.length - 1];

    survey.addAnswer(participant1.id, question.id, 'I like red');
    survey.addAnswer(participant2.id, question.id, 'I like blue');

    expect(survey.percentagesByOptions(question.id)).toEqual({});
  });
});

describe("Survey", () => {
  test("percentages by options returns undefined when provided invalid input", () => {
    let survey = new Survey('example');

    let participant1 = new Participant();
    let participant2 = new Participant();
    survey.addParticipant(participant1);
    survey.addParticipant(participant2)
    survey.addQuestion('open', 'Which number do you prefer?');

    let question = survey.questions[survey.questions.length - 1];

    survey.addAnswer(participant1.id, question.id, 'I like red');
    survey.addAnswer(participant2.id, question.id, 'I like blue');

    expect(survey.percentagesByOptions(String(question.id))).toBeUndefined();
  });
});
