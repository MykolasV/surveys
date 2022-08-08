const SeedData = require("./seed-data");
const deepCopy = require("./deep-copy");
const nextId = require("./next-id").init();

module.exports = class SessionPersistence {
  constructor(session) {
    this._surveys = session.surveys || deepCopy(SeedData);
    session.surveys = this._surveys;
  }

  // Return a copy of the list of all surveys
  allSurveys() {
    return deepCopy(this._surveys);
  }

  // Returns a copy of a survey with the indicated ID. Returns `undefined`
  // if not found. Note that `id` must be numeric.
  loadSurvey(surveyId) {
    let survey = this._findSurvey(surveyId);
    return deepCopy(survey);
  }

  // Delete the specified survey from the list of surveys. Returns `true` on success,
  // `false` if the survey doesn't exist. The ID argument must be numeric.
  deleteSurvey(surveyId) {
    let surveyIndex = this._surveys.findIndex(survey => survey.id === surveyId);
    if (surveyIndex === -1) return false;

    this._surveys.splice(surveyIndex, 1);
    return true;
  }

  // Set a new title for the specified survey. Returns `true` on success,
  // `false` if the survey isn't found. The survey ID must be numeric.
  changeSurveyTitle(surveyId, newTitle) {
    let survey = this._findSurvey(surveyId);
    if (!survey) return false;

    survey.title = newTitle;
    return true;
  }

  // Returns a copy of the indicated question in the indicated survey. Returns
  // `undefined` if either the survey or the question is not found. Note that
  // both IDs must be numeric.
  loadQuestion(surveyId, questionId) {
    let question = this._findQuestion(surveyId, questionId);
    return deepCopy(question);
  }

  // Delete the specified question from the specified survey. Returns `true` on
  // success, `false` if the question or survey doesn't exist. The ID arguments
  // must both be numeric.
  deleteQuestion(surveyId, questionId) {
    let survey = this._findSurvey(surveyId);
    if (!survey) return false;

    let questionIndex = survey.questions.findIndex(question => question.id === questionId);
    if (questionIndex === -1) return false;

    survey.questions.splice(questionIndex, 1);
    return true;
  }

  // Create a new question with specified type and options, and add it to the indicated
  // survey. Returns `true` on success, `false` on failure.
  createQuestion(surveyId, question, type, options) {
    let survey = this._findSurvey(surveyId);
    if (!survey) return false;

    survey.questions.push({
      id: nextId(),
      text: question,
      type,
      options: options.map(option => {
        return { id: nextId(), value: option };
      }),
    });

    return true;
  }

  // Returns a reference to the survey with the indicated ID. Returns
  // `undefined` if not found. Note that `surveyId` must be numeric.
  _findSurvey(surveyId) {
    return this._surveys.find(survey => survey.id === surveyId);
  }

  // Returns a reference to the indicated question in the indicated survey.
  // Returns `undefined` if either the survey or the question is not found. Note
  // that both IDs must be numeric.
  _findQuestion(surveyId, questionId) {
    let survey = this._findSurvey(surveyId);
    if (!survey) return undefined;

    return survey.questions.find(question => question.id === questionId);
  }
};
