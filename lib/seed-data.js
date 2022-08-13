// module.exports = [];
// const Survey = require("./survey");

// let survey1 = new Survey("Some simple questions");
// survey1.addQuestion("closed", "The earth is flat. True or False?", ["true", "false"]);
// survey1.addQuestion("nominal", "What are your favorite flavours of ice cream?", ["chocolate", "vanilla", "strawberry", "pistachio"]);
// survey1.addQuestion("open", "How old are you?");
// survey1.addQuestion("closed", "What is the capitol of UK?", ["London", "Birmingham", "Liverpool"]);

// let survey2 = new Survey("More questions");
// survey2.addQuestion("closed", "Chocolate is delicious", ["true", "false", "neutral"]);
// survey2.addQuestion("open", "What is your name?");

// let survey3 = new Survey("Even more questions");

// let surveys = [
//   survey1,
//   survey2,
//   survey3,
// ];

// module.exports = surveys;

const nextId = require("./next-id");

module.exports = [
  {
    id: nextId(),
    title: "Some simple questions",
    questions: [
      {
        id: nextId(),
        quesiton_type: "closed",
        question_text: "The earth is flat. True or False?",
        options: [
          {
            id: nextId(),
            option_value: "true",
          },
          {
            id: nextId(),
            option_value: "false",
          }
        ],
      },
      {
        id: nextId(),
        question_type: "nominal",
        question_text: "What are your favorite flavours of ice cream?",
        options: [
          {
            id: nextId(),
            option_value: "chocolate",
          },
          {
            id: nextId(),
            option_value: "vanilla",
          },
          {
            id: nextId(),
            option_value: "strawberry",
          },
          {
            id: nextId(),
            option_value: "pistachio",
          },
        ],
      },
      {
        id: nextId(),
        question_type: "open",
        question_text: "How old are you?",
        options: [],
      },
      {
        id: nextId(),
        question_type: "closed",
        question_text: "What is the capitol of the UK?",
        options: [
          {
            id: nextId(),
            option_value: "London",
          },
          {
            id: nextId(),
            option_value: "Birmingham",
          },
          {
            id: nextId(),
            option_value: "Liverpool",
          },
        ],
      },
    ],
    participants: [],
    answers: [],
    results: [],
  },
  {
    id: nextId(),
    title: "More Questions",
    questions: [
      {
        id: nextId(),
        question_type: "closed",
        question_text: "Chocolate is delicious.",
        options: [
          {
            id: nextId(),
            option_value: "true",
          },
          {
            id: nextId(),
            option_value: "false",
          },
          {
            id: nextId(),
            option_value: "neutral",
          },
        ],
      },
      {
        id: nextId(),
        question_type: "open",
        question_text: "What is your name?",
        options: [],
      },
    ],
    participants: [],
    answers: [],
    results: [],
  },
  {
    id: nextId(),
    title: "Even More Questions",
    questions: [],
    participants: [],
    answers: [],
    results: [],
  },
];
