module.exports = [];
const Survey = require("./survey");

let survey1 = new Survey("Some simple questions");
survey1.addQuestion("closed", "The earth is flat. True or False?", ["true", "false"]);
survey1.addQuestion("nominal", "What are your favorite flavours of ice cream?", ["chocolate", "vanilla", "strawberry", "pistachio"]);
survey1.addQuestion("open", "How old are you?");
survey1.addQuestion("closed", "What is the capitol of UK?", ["London", "Birmingham", "Liverpool"]);

let survey2 = new Survey("More questions");
survey2.addQuestion("closed", "Chocolate is delicious", ["true", "false", "neutral"]);
survey2.addQuestion("open", "What is your name?");

let survey3 = new Survey("Even more questions");

let surveys = [
  survey1,
  survey2,
  survey3,
];

module.exports = surveys;
