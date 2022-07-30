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
// app.post("/surveys", (req, res) => {
//   let title = req.body.surveyTitle.trim();

//   if (title.length === 0) {
//     req.flash("error", "A title was not provided.");
//     res.render("new-survey", {
//       flash: req.flash(),
//     });
//   } else if (title.length > 100) {
//     req.flash("error", "Survey title must be between 1 and 100 characters.");
//     res.render("new-survey", {
//       flash: req.flash(),
//       surveyTitle: title,
//     });
//   } else if (surveys.some(survey => survey.title === title)) {
//     req.flash("error", "Survey title must be unique.");
//     res.render("new-survey", {
//       flash: req.flash(),
//       surveyTitle: title,
//     });
//   } else {
//     surveys.push(new Survey(title));
//     req.flash("success", "The survey has been created.");
//     res.redirect("/surveys");
//   }
// });

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
        flash: req.flash(),
        surveyTitle: req.body.surveyTitle,
      });
    } else {
      surveys.push(new Survey(req.body.surveyTitle));
      req.flash("success", "The survey has been created.");
      res.redirect("/surveys");
    }
  }
)

// Listener
app.listen(port, host, () => {
  console.log(`Todos is listening on port ${port} of ${host}!`);
});
