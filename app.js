const express = require("express");
const morgan = require("morgan");

const Survey = require("./lib/survey");

const app = express();
const host = "localhost";
const port = 3000;

// Static data for initial testing
let surveys = require("./lib/seed-data");

app.set("views", "./views");
app.set("view engine", "pug");

app.use(morgan("common"));
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));

// Redirect start page
app.get("/", (req, res) => {
  res.redirect("/surveys");
});

// Render the list of surveys
app.get("/surveys", (req, res) => {
  res.render("surveys", { surveys });
});

// Render new survey page
app.get("/surveys/new", (req, res) => {
  res.render("new-survey");
});

// Create a new survey
app.post("/surveys", (req, res) => {
  let title = req.body.surveyTitle.trim();
  if (title.length === 0) {
    res.render("new-survey", {
      errorMessage: "A tittle was not provided.",
    });
  } else if (title.length > 100) {
    res.render("new-survey", {
      errorMessage: "Survey title must be between 1 and 100 characters.",
      surveyTitle: title,
    });
  } else if (surveys.some(survey => survey.title === title)) {
    res.render("new-survey", {
      errorMessage: "Survey title must be unique.",
      surveyTitle: title,
    });
  } else {
    surveys.push(new Survey(title));
    res.redirect("/surveys");
  }
});

// Listener
app.listen(port, host, () => {
  console.log(`Todos is listening on port ${port} of ${host}!`);
});
