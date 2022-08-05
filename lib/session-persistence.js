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
};
