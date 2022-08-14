const express = require("express");
const morgan = require("morgan");
const flash = require("express-flash");
const session = require("express-session");
const store = require("connect-loki");
const { body, validationResult } = require("express-validator");
const PgPersistence = require("./lib/pg-persistence");
const catchError = require("./lib/catch-error");
const { Session } = require("express-session");

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
  res.locals.username = req.session.username;
  res.locals.signedIn = req.session.signedIn;
  res.locals.flash = req.session.flash;
  delete req.session.flash;
  next();
});

// Detect unauthorized access to routes.
const requiresAuthentication = (req, res, next) => {
  if (!res.locals.signedIn) {
    res.redirect(302, "/users/signin");
  } else {
    next();
  }
};

// Redirect start page
app.get("/", (req, res) => {
  res.redirect("/surveys");
});

// Render the list of surveys
app.get("/surveys",
  requiresAuthentication,
  catchError(async (req, res) => {
    let store = res.locals.store;
    let surveys = await store.allSurveys();
    let surveysInfo = surveys.map(survey => ({
      countAllQuestions: survey.questions.length,
      countAllParticipants: survey.participants.length,
    }));

    res.render("surveys", {
      surveys,
      surveysInfo,
    });
  })
);

// Render new survey form
app.get("/surveys/new",
  requiresAuthentication,
  (req, res) => {
  res.render("new-survey");
});

// Create a new survey
app.post("/surveys",
  requiresAuthentication,
  [
    body("surveyTitle")
    .trim()
    .isLength({ min: 1})
    .withMessage("The survey title is required.")
    .isLength({ max: 100 })
    .withMessage("Survey title must be between 1 and 100 characters.")
  ],
  catchError(async (req, res) => {
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
    } else if (await store.existsSurveyTitle(surveyTitle)) {
      req.flash("error", "The survey title must be unique.");
      rerenderNewSurvey();
    } else {
      let created = await store.createSurvey(surveyTitle);

      if (!created) {
        req.flash("error", "The survey title must be unique.");
        rerenderNewSurvey();
      } else {
        req.flash("success", "The survey has been created.");
        res.redirect("/surveys");
      }
    }
  })
);

// Render individual survey and its questions
app.get("/surveys/:surveyId",
  requiresAuthentication,
  catchError(async (req, res) => {
    let surveyId = req.params.surveyId;
    let survey = await res.locals.store.loadSurvey(+surveyId);
  
    if (survey === undefined) throw new Error("Not found.");

    res.render("survey", { survey });
  })
);

// Add a new question to a survey
app.post("/surveys/:surveyId/questions",
  requiresAuthentication,
  [
    body("questionText")
      .trim()
      .isLength({ min: 1})
      .withMessage("The question field is required."),
    body("options")
      .trim()
      .custom((optionString, { req }) => {
        if (["closed", "nominal"].includes(req.body.questionType)) {
          let options = optionString.split(/, +|,/).filter(str => str.trim().length > 0);
          return options.length > 0;
        } else {
          return true;
        }
      })
      .withMessage("Please provide options in the correct format."),
  ],
  catchError(async (req, res) => {
    let surveyId = req.params.surveyId;
    let survey = await res.locals.store.loadSurvey(+surveyId);

    let questionText = req.body.questionText;
    let questionType = req.body.questionType;
    let options = req.body.options.split(/, +|,/);

    if (!survey) {
      throw new Error("Not Found.");
    } else {
      let errors = validationResult(req);

      if (!errors.isEmpty()) {
        errors.array().forEach(message => req.flash("error", message.msg));

        res.render("survey", {
          flash: req.flash(),
          survey,
          questionText,
          selectedType: questionType,
          options: options.join(', '),
        });
      } else {
        let created = await res.locals.store.createQuestion(+surveyId, questionText, questionType, options);
        if (!created) throw new Error("Not Found.");

        req.flash("success", "The question was added.");
        res.redirect(`/surveys/${surveyId}`);
      }
    }
  })
);

// Render edit question form
app.get("/surveys/:surveyId/questions/:questionId",
  requiresAuthentication,
  catchError(async (req, res) => {
    let { surveyId, questionId } = req.params;
    let question = await res.locals.store.loadQuestion(+surveyId, +questionId);
    let options = await res.locals.store.loadOptions(+questionId);

    options = options.map(option => option.option_value).join(', ');

    if (!question) {
      throw new Error("Not Found.");
    } else {
      res.render("edit-question", {
        surveyId,
        questionId,
        question: question.question_text,
        questionText: question.question_text,
        selectedType: question.question_type,
        options,
      });
    }
  })
);

// Delete a question from a survey
app.post("/surveys/:surveyId/questions/:questionId/destroy",
  requiresAuthentication,
  catchError(async (req, res) => {
    let { surveyId, questionId } = req.params;
    let deleted = await res.locals.store.deleteQuestion(+surveyId, +questionId);
    if (!deleted) throw new Error("Not found.");

    req.flash("success", "The question was deleted.");
    res.redirect(`/surveys/${surveyId}`);
  })
);

// Update question
app.post("/surveys/:surveyId/questions/:questionId",
  requiresAuthentication,
  [
    body("questionText")
      .trim()
      .isLength({ min: 1})
      .withMessage("The question field is required."),
    body("options")
      .trim()
      .custom((optionString, { req }) => {
        if (["closed", "nominal"].includes(req.body.questionType)) {
          let options = optionString.split(/, +|,/).filter(str => str.trim().length > 0);
          return options.length > 0;
        } else {
          return true;
        }
      })
      .withMessage("Please provide options in the correct format."),
  ],
  catchError(async (req, res) => {
    let { surveyId, questionId } = req.params;
    let question = await res.locals.store.loadQuestion(+surveyId, +questionId);
    let options = await res.locals.store.loadOptions(+questionId);

    options = options.map(option => option.option_value).join(', ');

    if (!question) {
      throw new Error("Not Found.");
    } else {
      let errors = validationResult(req);

      if (!errors.isEmpty()) {
        errors.array().forEach(message => req.flash("error", message.msg));

        res.render("edit-question", {
          flash: req.flash(),
          surveyId,
          questionId,
          question: question.question_text,
          questionText: req.body.questionText || question.question_text,
          selectedType: req.body.questionType || question.question_type,
          options: req.body.options || options,
        });
      } else {
        let questionText = req.body.questionText;
        let questionType = req.body.questionType;
        let options = req.body.options.split(/, +|,/).map(option => option.trim());

        let updated = await res.locals.store.updateQuestion(+surveyId, +questionId, questionText, questionType, options);
        if (!updated) throw new Error("Not Found");

        req.flash("success", "The question was updated.");
        res.redirect(`/surveys/${surveyId}`);
      }
    }
  })
);

// Render edit survey form
app.get("/surveys/:surveyId/edit",
  requiresAuthentication,
  catchError(async (req, res) => {
    let surveyId = req.params.surveyId;
    let survey = await res.locals.store.loadSurvey(+surveyId);

    if (!survey) throw new Error("Not Found");

    res.render("edit-survey", { survey });
  })
);

// Delete survey
app.post("/surveys/:surveyId/destroy",
  requiresAuthentication,
  catchError(async (req, res) => {
    let surveyId = req.params.surveyId;
    let deleted = await res.locals.store.deleteSurvey(+surveyId);

    if (!deleted) throw new Error("Not Found.");

    req.flash("success", "Survey deleted.");
    res.redirect("/surveys");
  })
);

// Update survey title
app.post("/surveys/:surveyId/edit",
  requiresAuthentication,
  [
    body("surveyTitle")
      .trim()
      .isLength({ min: 1 })
      .withMessage("The survey title is required.")
      .isLength({ max: 100 })
      .withMessage("Survey title must be between 1 and 100 characters.")
  ],
  catchError(async (req, res) => {
    let store = res.locals.store;
    let surveyId = req.params.surveyId;
    let surveyTitle = req.body.surveyTitle;

    const rerenderEditSurvey = async () => {
      let survey = await store.loadSurvey(+surveyId);

      if (!survey) throw new Error("Not Found.");

      res.render("edit-survey", {
        flash: req.flash(),
        surveyTitle,
        survey,
      });
    };

    try {
      let errors = validationResult(req);

      if (!errors.isEmpty()) {
        errors.array().forEach(message => req.flash("error", message.msg));
        await rerenderEditSurvey();
      } else if (await store.existsSurveyTitle(surveyTitle)) {
        req.flash("error", "The survey title must be unique.");
        await rerenderEditSurvey();
      } else if (!(await store.changeSurveyTitle(+surveyId, surveyTitle))) {
        throw new Error("Not Found.");
      } else {
        req.flash("success", "Survey title updated.");
        res.redirect(`/surveys/${surveyId}`);
      }
    } catch (error) {
      if (store.isUniqueConstraintViolation(error)) {
        req.flash("error", "The survey must be unique.");
        await rerenderEditSurvey();
      }
    }
  })
);

// Render the Sign In page.
app.get("/users/signin", (req, res) => {
  req.flash("info", "Please sign in.");
  res.render("signin", {
    flash: req.flash(),
  });
});

// Handle Sign In form submission
app.post("/users/signin",
  catchError(async (req, res) => {
    let username = req.body.username.trim();
    let password = req.body.password;

    let authenticated = await res.locals.store.authenticate(username, password);
    if (!authenticated) {
      req.flash("error", "Invalid credentials.");
      res.render("signin", {
        flash: req.flash(),
        username: req.body.username,
      });
    } else {
      let session = req.session;
      session.username = username;
      session.signedIn = true;
      req.flash("info", "Welcome!");
      res.redirect("/surveys");
    }
  })
);

// Handle Sign Out
app.post("/users/signout", (req, res) => {
  delete req.session.username;
  delete req.session.signedIn;
  res.redirect("/users/signin");
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
