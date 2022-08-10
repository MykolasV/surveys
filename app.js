const express = require("express");
const morgan = require("morgan");
const flash = require("express-flash");
const session = require("express-session");
const store = require("connect-loki");
const { body, validationResult } = require("express-validator");
const PgPersistence = require("./lib/pg-persistence");

const app = express();
const host = "localhost";
const port = 3000;
const LokiStore = store(session);

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

// Create a new datastore 
app.use((req, res, next) => {
  res.locals.store = new PgPersistence(req.session);
  next();
});

// Extract session info
app.use((req, res, next) => {
  res.locals.flash = req.session.flash;
  delete req.session.flash;
  next();
});

// Redirect start page
app.get("/", (req, res) => {
  res.redirect("/surveys");
});

// Render the list of surveys
app.get("/surveys", (req, res) => {
  let store = res.locals.store;
  let surveys = store.allSurveys();

  let surveysInfo = surveys.map(survey => ({
    countAllQuestions: survey.questions.length,
    countAllParticipants: survey.participants.length,
  }));

  res.render("surveys", {
    surveys,
    surveysInfo,
  });
});

// Render new survey form
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
  ],
  (req, res, next) => {
    let store = res.locals.store;
    let surveyTitle = req.body.surveyTitle;

    const rerenderNewSurvey = () => {
      res.render("new-survey", {
        flash: req.flash(),
        surveyTitle,
      });
    };

    let errors = validationResult(req);

    if (!errors.isEmpty()) {
      errors.array().forEach(message => req.flash("error", message.msg));
      rerenderNewSurvey();
    } else if (store.existsSurveyTitle(surveyTitle)) {
      req.flash("error", "The survey title must be unique.");
      rerenderNewSurvey();
    } else if (!store.createSurvey(surveyTitle)) {
      next(new Error("Not Found."));
    } else {
      req.flash("success", "The survey has been created.");
      res.redirect("/surveys");
    }
  }
);

// Render individual survey and its questions
app.get("/surveys/:surveyId", (req, res, next) => {
  let surveyId = req.params.surveyId;
  let survey = res.locals.store.loadSurvey(+surveyId);

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
  let deleted = res.locals.store.deleteQuestion(+surveyId, +questionId);

  if (!deleted) {
    next(new Error("Not found."));
  } else {
    req.flash("success", "The question was deleted.");
    res.redirect(`/surveys/${surveyId}`);
  }
});

// Add a new question to a survey
app.post("/surveys/:surveyId/questions",
  [
    body("questionText")
      .trim()
      .isLength({ min: 1})
      .withMessage("The question field is required."),
    body("options")
      .trim()
      .custom((optionString, { req }) => {
        if (["closed", "nominal"].includes(req.body.type)) {
          let options = optionString.split(/, +|,/).filter(str => str.trim().length > 0);
          return options.length > 0;
        } else {
          return true;
        }
      })
      .withMessage("Please provide options in the correct format."),
  ],
  (req, res, next) => {
    let surveyId = req.params.surveyId;
    let survey = res.locals.store.loadSurvey(+surveyId);

    let questionText = req.body.questionText;
    let type = req.body.type;
    let options = req.body.options.split(/, +|,/);

    if (!survey) {
      next(new Error("Not Found."));
    } else {
      let errors = validationResult(req);

      if (!errors.isEmpty()) {
        errors.array().forEach(message => req.flash("error", message.msg));

        res.render("survey", {
          flash: req.flash(),
          survey,
          questions: survey.questions,
          questionText: req.body.questionText,
          selectedType: req.body.type,
          options: options.join(', '),
        });
      } else {
        let created = res.locals.store.createQuestion(+surveyId, questionText, type, options);

        if (!created) {
          next(new Error("Not Found."));
        } else {
          req.flash("success", "The question was added.");
          res.redirect(`/surveys/${surveyId}`);
        }
      }
    }
});

// Render edit survey form
app.get("/surveys/:surveyId/edit", (req, res, next) => {
  let surveyId = req.params.surveyId;
  let survey = res.locals.store.loadSurvey(+surveyId);

  if (!survey) {
    next(new Error("Not Found"));
  } else {
    res.render("edit-survey", { survey });
  }
});

// Delete survey
app.post("/surveys/:surveyId/destroy", (req, res, next) => {
  let surveyId = req.params.surveyId;
  let deleted = res.locals.store.deleteSurvey(+surveyId);

  if (!deleted) {
    next(new Error("Not Found."));
  } else {
    req.flash("success", "Survey deleted.");
    res.redirect("/surveys");
  }
});

// Update survey title
app.post("/surveys/:surveyId/edit",
  [
    body("surveyTitle")
      .trim()
      .isLength({ min: 1 })
      .withMessage("The survey title is required.")
      .isLength({ max: 100 })
      .withMessage("Survey title must be between 1 and 100 characters.")
  ],
  (req, res, next) => {
    let store = res.locals.store;
    let surveyId = req.params.surveyId;
    let surveyTitle = req.body.surveyTitle;

    const rerenderEditSurvey = () => {
      let survey = store.loadSurvey(+surveyId);

      if (!survey) {
        next(new Error("Not Found."));
      } else {
        res.render("edit-survey", {
          flash: req.flash(),
          surveyTitle,
          survey,
        });
      }
    };

    let errors = validationResult(req);

    if (!errors.isEmpty()) {
      errors.array().forEach(message => req.flash("error", message.msg));
      rerenderEditSurvey();
    } else if (store.existsSurveyTitle(surveyTitle)) {
      req.flash("error", "The survey title must be unique.");
      rerenderEditSurvey();
    } else if (!store.changeSurveyTitle(+surveyId, surveyTitle)) {
      next(new Error("Not Found."));
    } else {
      req.flash("success", "Survey title updated.");
      res.redirect(`/surveys/${surveyId}`);
    }
  }
);

// Render edit question form
app.get("/surveys/:surveyId/questions/:questionId", (req, res, next) => {
  let { surveyId, questionId } = req.params;
  let question = res.locals.store.loadQuestion(+surveyId, +questionId);

  if (!question) {
    next(new Error("Not Found."));
  } else {
    res.render("edit-question", {
      surveyId,
      question,
      questionText: question.text,
      selectedType: question.type,
      options: question.options.map(option => option.value).join(', '),
    });
  }
});

// Update question
app.post("/surveys/:surveyId/questions/:questionId",
  [
    body("questionText")
      .trim()
      .isLength({ min: 1})
      .withMessage("The question field is required."),
    body("options")
      .trim()
      .custom((optionString, { req }) => {
        if (["closed", "nominal"].includes(req.body.type)) {
          let options = optionString.split(/, +|,/).filter(str => str.trim().length > 0);
          return options.length > 0;
        } else {
          return true;
        }
      })
      .withMessage("Please provide options in the correct format."),
  ],
  (req, res, next) => {
    let { surveyId, questionId } = req.params;
    let question = res.locals.store.loadQuestion(+surveyId, +questionId);

    if (!question) {
      next(new Error("Not Found."));
    } else {
      let errors = validationResult(req);

      if (!errors.isEmpty()) {
        errors.array().forEach(message => req.flash("error", message.msg));

        res.render("edit-question", {
          flash: req.flash(),
          surveyId,
          question,
          questionText: req.body.questionText || question.text,
          selectedType: req.body.type || question.type,
          options: req.body.options || question.options.map(option => option.value).join(', '),
        });
      } else {
        let questionText = req.body.questionText;
        let type = req.body.type;
        let options = req.body.options.split(/, +|,/).map(option => option.trim());

        if (!res.locals.store.updateQuestion(+surveyId, +questionId, questionText, type, options)) {
          next(new Error("Not Found"));
        } else {
          req.flash("success", "The question was updated.");
          res.redirect(`/surveys/${surveyId}`);
        }
      }
    }
  }
);

// Error handler
app.use((err, req, res, _next) => {
  console.log(err); // Writes more extensive information to the console log
  res.status(404).send(err.message);
});

// Listener
app.listen(port, host, () => {
  console.log(`Surveys is listening on port ${port} of ${host}!`);
});
