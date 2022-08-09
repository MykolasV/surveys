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
        type: "closed",
        text: "The earth is flat. True or False?",
        options: [
          {
            id: nextId(),
            value: "true",
          },
          {
            id: nextId(),
            value: "false",
          }
        ],
      },
      {
        id: nextId(),
        type: "nominal",
        text: "What are your favorite flavours of ice cream?",
        options: [
          {
            id: nextId(),
            value: "chocolate",
          },
          {
            id: nextId(),
            value: "vanilla",
          },
          {
            id: nextId(),
            value: "strawberry",
          },
          {
            id: nextId(),
            value: "pistachio",
          },
        ],
      },
      {
        id: nextId(),
        type: "open",
        text: "How old are you?",
        options: [],
      },
      {
        id: nextId(),
        type: "closed",
        text: "What is the capitol of the UK?",
        options: [
          {
            id: nextId(),
            value: "London",
          },
          {
            id: nextId(),
            value: "Birmingham",
          },
          {
            id: nextId(),
            value: "Liverpool",
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
        type: "closed",
        text: "Chocolate is delicious.",
        options: [
          {
            id: nextId(),
            value: "true",
          },
          {
            id: nextId(),
            value: "false",
          },
          {
            id: nextId(),
            value: "neutral",
          },
        ],
      },
      {
        id: nextId(),
        type: "open",
        text: "What is your name?",
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
