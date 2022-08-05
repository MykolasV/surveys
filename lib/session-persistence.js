const SeedData = require("./seed-data");
const deepCopy = require("./deep-copy");

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
    let survey = this._surveys.find(survey => survey.id === surveyId);
    return deepCopy(survey);
  }

  // Returns a copy of the indicated question in the indicated survey. Returns
  // `undefined` if either the survey or the question is not found. Note that
  // both IDs must be numeric.
  loadQuestion(surveyId, questionId) {
    let survey = this.loadSurvey(surveyId);
    if (!survey) return undefined;

    return survey.questions.find(question => question.id === questionId);
  }
};
