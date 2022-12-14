const config = require("./lib/config");
const express = require("express");
const morgan = require("morgan");
const flash = require("express-flash");
const session = require("express-session");
const store = require("connect-loki");
const { body, validationResult } = require("express-validator");
const PgPersistence = require("./lib/pg-persistence");
const catchError = require("./lib/catch-error");
const { Session } = require("express-session");
const { request } = require("express");

const app = express();
const host = config.HOST;
const port = config.PORT;
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
  secret: config.SECRET,
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

// Keep track of survey submission state
app.use((req, res, next) => {
  req.session.submittedSurveys = req.session.submittedSurveys || {};
  res.locals.submittedSurveys = req.session.submittedSurveys;
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

    for (let i = 0; i < surveys.length; ++i) {
      let survey = surveys[i];
      survey.numberOfQuestions = survey.questions.length;
      survey.numberOfParticipants = survey.number_of_participants;
    }

    res.render("surveys", { surveys });
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

// Survey completion page
app.get("/surveys/end",
  catchError(async (req, res) => {
    res.render("end-survey");
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
    let options = [];
    if (["closed", "nominal"].includes(questionType)) {
      options = req.body.options.split(/, +|,/);
    }

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

    if (req.xhr) {
      res.status(204).end();
    } else {
      req.flash("success", "The question was deleted.");
      res.redirect(`/surveys/${surveyId}`);
    }
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
        let options = req.body.options.split(/, +|,/).map(option => option.trim()).filter(option => option.length > 0);

        let updated = await res.locals.store.updateQuestion(+surveyId, +questionId, questionText, questionType, options);
        if (!updated) throw new Error("Not Found");

        if (req.xhr) {
          res.status(204).end();
        } else {
          req.flash("success", "The question was updated.");
          res.redirect(`/surveys/${surveyId}`);
        }
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

    if (req.xhr) {
      req.flash("success", "Survey deleted.");
      res.status(200).send("/surveys");
    } else {
      req.flash("success", "Survey deleted.");
      res.redirect("/surveys");
    }
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
  res.render("signin");
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

// Handle Sign Up page.
app.get("/users/signup", (req, res) => {
  res.render("signup");
});

// Handle Sign Up form submission
app.post("/users/signup",
  [
    body("username")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Username is required.")
      .isLength({ min: 6, max: 50 })
      .withMessage("Username must be between 6 and 50 characters."),
    body("password")
      .isLength({ min: 1 })
      .withMessage("Password is required.")
      .isLength({ min: 6, max: 15 })
      .withMessage("Password must be between 6  and 15 characters.")
  ],
  catchError(async (req, res) => {
    let store = res.locals.store;
    let username = req.body.username.trim();
    let password = req.body.password;

    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      errors.array().forEach(message => req.flash("error", message.msg));
      res.render("signup", {
        flash: req.flash(),
        username,
      })
    } else if (await store.existsUsername(username)) {
      req.flash("error", "Username exists. Please pick a different username.");
      res.render("signup", {
        flash: req.flash(),
      });
    } else {
      let createdAccount = await store.saveUser(username, password);
      if (!createdAccount) throw new Error("Not Found.");

      req.flash("success", "Your account was created!");
      res.redirect("signin");
    }
  })
);

// Handle Sign Out
app.post("/users/signout", (req, res) => {
  delete req.session.username;
  delete req.session.signedIn;
  res.redirect("/users/signin");
});

// Publish survey
app.post("/surveys/:surveyId/publish",
  catchError(async (req, res) => {
    let surveyId = req.params.surveyId;
    let published = await res.locals.store.publishSurvey(+surveyId);

    if (!published) throw new Error("not Found.");

    req.flash("success", "The survey was published!");
    res.redirect("/surveys");
  })
);

// Unpublish survey
app.post("/surveys/:surveyId/unpublish",
  catchError(async (req, res) => {
    let surveyId = req.params.surveyId;
    let unpublished = await res.locals.store.unpublishSurvey(+surveyId);

    if (!unpublished) throw new Error("Not Found.");

    req.flash("success", "The survey was unpublished!");
    res.redirect("/surveys");
  })
);

// Start survey page
app.get("/surveys/published/:surveyId/start",
  catchError(async (req, res) => {
    let surveyId = req.params.surveyId;
    let publishedOn = await res.locals.store.surveyPublishDate(+surveyId);

    if (res.locals.submittedSurveys[surveyId] === String(publishedOn)) {
      res.redirect("/surveys/end");
    } else {
      res.render("start-survey", { surveyId });
    }
  })
);

// Display published survey for participant
app.get("/surveys/published/:surveyId",
  catchError(async (req, res) => {
    let surveyId = req.params.surveyId;
    let publishedOn = await res.locals.store.surveyPublishDate(+surveyId);
    
    if (res.locals.submittedSurveys[surveyId] === String(publishedOn)) {
      res.redirect("/surveys/end");
    } else {
      let survey = await res.locals.store.loadPublishedSurvey(+surveyId);
      if (!survey) throw new Error("Not Found");

      res.render("published-survey", { survey });
    }
  })
);

// Submit survey
app.post("/surveys/published/:surveyId",
  catchError(async (req, res) => {
    let surveyId = req.params.surveyId;
    let publishedOn = await res.locals.store.surveyPublishDate(+surveyId);

    if (res.locals.submittedSurveys[surveyId] === String(publishedOn)) {
      res.redirect("/surveys/end");
      return;
    }

    let survey = await res.locals.store.loadPublishedSurvey(+surveyId);
    if (!survey) throw new Error("Not Found.");

    let questionIds = Object.keys(req.body);

    if (questionIds.length !== survey.questions.length ||
        questionIds.some(questionId => req.body[questionId].length === 0)) {
      req.flash("error", "Please answer all of the questions.");
      res.render("published-survey", { 
        survey,
        flash: req.flash(),
      });
    } else {
      let participant = await res.locals.store.addParticipant(+surveyId);
      if (!participant) throw new Error("Not Found.");
  
      let participantId = participant.id;
  
      for (let i = 0; i < questionIds.length; ++i) {
        let questionId = questionIds[i];
        let answer = req.body[questionId];
  
        if (Array.isArray(answer)) answer = answer.join(', ');
  
        let added = await res.locals.store.addAnswer(+surveyId, +questionId, +participantId, answer);
        if (!added) throw new Error("Not Found.");
      }

      req.session.submittedSurveys[surveyId] = String(survey.published_on);
      res.redirect("/surveys/end");
    }
  })
);

// Show results for question
app.get("/surveys/:surveyId/questions/:questionId/results",
  requiresAuthentication,
  catchError(async (req, res) => {
    let { surveyId, questionId} = req.params;
    let results = await res.locals.store.questionResults(surveyId, questionId);

    if (!results) throw new Error("Not Found");

    res.render("question-results", {
      surveyId,
      results,
    })
  })
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
