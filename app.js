const express = require("express");
const morgan = require("morgan");
const flash = require("express-flash");
const session = require("express-session");
const store = require("connect-loki");
const LokiStore = store(session);
const { body, validationResult } = require("express-validator");

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

app.use(session({
  cookie: {
    httpOnly: true,
    maxAge: 31 * 24 * 60 * 60 * 1000, // 31 days in milliseconds
    path: "/",
    secure: false,
  },
  name: "surveys-session-id",
  resave: false,
  saveUninitialized: true,
  secret: "this is not very secure",
  // Remember: the secret value is sensitive data that needs protection from prying eyes.
  // Including it in the source code -- as we do here -- isn't safe.
  // However, since we only respond to requests from the localhost, we're safe for now.
  // Don't make this program more widely available without addressing this issue.

  // You should obtain the secret value from an external source that is only available to
  // your servers, such as a database or a local file.
  store: new LokiStore({}),
}));

app.use(flash());

// Extract session info
app.use((req, res, next) => {
  res.locals.flash = req.session.flash;
  delete req.session.flash;
  next();
});

// Find a survey with the indicated ID. Returns `undefined` if not found.
// Note that `id` must be numeric.
const loadSurvey = id => {
  return surveys.find(survey => survey.id === id);
}

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
app.post("/surveys",
  [
    body("surveyTitle")
    .trim()
    .isLength({ min: 1})
    .withMessage("The survey title is required.")
    .isLength({ max: 100 })
    .withMessage("Survey title must be between 1 and 100 characters.")
    .custom(title => {
      let duplicate = surveys.find(survey => survey.title === title);
      return duplicate === undefined;
    })
    .withMessage("Survey title must be unique."),
  ],
  (req, res) => {
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      errors.array().forEach(message => req.flash("error", message.msg));
      res.render("new-survey", {
        surveyTitle: req.body.surveyTitle,
        flash: req.flash(),
      });
    } else {
      surveys.push(new Survey(req.body.surveyTitle));
      req.flash("success", "The survey has been created.");
      res.redirect("/surveys");
    }
  }
)

// Render individual survey and its questions
app.get("/surveys/:surveyId", (req, res, next) => {
  let surveyId = req.params.surveyId;
  let survey = loadSurvey(+surveyId);

  if (survey === undefined) {
    next(new Error("Not found."));
  } else {
    res.render("survey", { 
      survey,
      questions: survey.questions,
    });
  }
});

// Delete a question from a survey
app.post("/surveys/:surveyId/questions/:questionId/destroy", (req, res, next) => {
  let { surveyId, questionId } = req.params;
  let survey = loadSurvey(+surveyId);

  if (survey && survey.removeQuestion(+questionId)) {
    req.flash("success", "The question was deleted.");
    res.redirect(`/surveys/${surveyId}`);
  } else {
    next(new Error("Not found."));
  }
});

// Add a new question to a survey
app.post("/surveys/:surveyId/questions",
  [
    body("question")
      .trim()
      .isLength({ min: 1})
      .withMessage("The question field is required."),
    body("options")
      .trim()
      .custom((optionString, { req }) => {
        if (["closed", "nominal"].includes(req.body.type)) {
          let options = optionString.split(/, +|,/);
          return options.length === 0;
        } else {
          return true;
        }
      })
      .withMessage("Please provide options in the correct format."),
  ],
  (req, res, next) => {
    let surveyId = req.params.surveyId;
    let survey = loadSurvey(+surveyId);

    let question = req.body.question;
    let type = req.body.type;
    let options = req.body.options.split(/, +|,/);

    if (!survey) {
      next(new Error("Not Found."));
    } else {
      let errors = validationResult(req);

      if (!errors.isEmpty()) {
        errors.array().forEach(message => req.flash("error", message.msg));

        res.render("survey", {
          survey,
          questions: survey.questions,
          flash: req.flash(),
        });
      } else {
        survey.addQuestion(type, question, options);
        req.flash("success", "The question was added.");
        res.redirect(`/surveys/${surveyId}`);
      }
    }
});

// Error handler
app.use((err, req, res, _next) => {
  console.log(err); // Writes more extensive information to the console log
  res.status(404).send(err.message);
});

// Listener
app.listen(port, host, () => {
  console.log(`Surveys is listening on port ${port} of ${host}!`);
});
