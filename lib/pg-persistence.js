const { dbQuery } = require("./db-query");

module.exports = class PgPersistence {
  constructor(session) {
    // this._surveys = session.surveys || deepCopy(SeedData);
    // session.surveys = this._surveys;
  }

  // Return a Promise that resolves to a list of all the surveys together with
  // their questions and participants.
  async allSurveys() {
    const ALL_SURVEYS = "SELECT * FROM surveys";
    const FIND_QUESTIONS = "SELECT * FROM questions WHERE survey_id = $1";
    const FIND_PARTICIPANTS = "SELECT * FROM participants WHERE survey_id = $1";

    let result = await dbQuery(ALL_SURVEYS);
    let surveys = result.rows;

    for (let index = 0; index < surveys.length; ++index) {
      let survey = surveys[index];
      let questions = await dbQuery(FIND_QUESTIONS, survey.id);
      let participants = await dbQuery(FIND_PARTICIPANTS, survey.id);
      survey.questions = questions.rows;
      survey.participants = participants.rows;
    }

    return surveys;
  }

  // Returns a Promise that resolves to the survey with the indicated ID. The survey
  // contains its questions. The Promise resolves to `undefined` if the survey is
  // not found.
  async loadSurvey(surveyId) {
    const FIND_SURVEY = "SELECT * FROM surveys WHERE id = $1";
    const FIND_QUESTIONS = "SELECT * FROM questions WHERE survey_id = $1";

    let resultSurvey = dbQuery(FIND_SURVEY, surveyId);
    let resultQuestions = dbQuery(FIND_QUESTIONS, surveyId);
    let resultBoth = await Promise.all([resultSurvey, resultQuestions]);

    let survey = resultBoth[0].rows[0];
    if (!survey) return undefined;

    survey.questions = resultBoth[1].rows;
    return survey;
  }

  // Create a new survey with the specified title and add it to the list of
  // surveys. Returns `true` on success, `false` on failure. (At this time,
  // there are no known failure conditions.)
  createSurvey(title) {
    // this._surveys.push({
    //   id: nextId(),
    //   title,
    //   questions: [],
    //   participants: [],
    //   answers: [],
    //   results: [],
    // });

    // return true;
  }

  // Delete the specified survey from the list of surveys. Returns `true` on success,
  // `false` if the survey doesn't exist. The ID argument must be numeric.
  deleteSurvey(surveyId) {
    // let surveyIndex = this._surveys.findIndex(survey => survey.id === surveyId);
    // if (surveyIndex === -1) return false;

    // this._surveys.splice(surveyIndex, 1);
    // return true;
  }

  // Returns `true` if a survey with the specified title exists in the list
  // of surveys, `false` otherwise.
  existsSurveyTitle(title) {
    // return this._surveys.some(survey => survey.title === title);
  }

  // Set a new title for the specified survey. Returns `true` on success,
  // `false` if the survey isn't found. The survey ID must be numeric.
  changeSurveyTitle(surveyId, newTitle) {
    // let survey = this._findSurvey(surveyId);
    // if (!survey) return false;

    // survey.title = newTitle;
    // return true;
  }

  // Returns a copy of the indicated question in the indicated survey. Returns
  // `undefined` if either the survey or the question is not found. Note that
  // both IDs must be numeric.
  loadQuestion(surveyId, questionId) {
    // let question = this._findQuestion(surveyId, questionId);
    // return deepCopy(question);
  }

  // Delete the specified question from the specified survey. Returns `true` on
  // success, `false` if the question or survey doesn't exist. The ID arguments
  // must both be numeric.
  deleteQuestion(surveyId, questionId) {
    // let survey = this._findSurvey(surveyId);
    // if (!survey) return false;

    // let questionIndex = survey.questions.findIndex(question => question.id === questionId);
    // if (questionIndex === -1) return false;

    // survey.questions.splice(questionIndex, 1);
    // return true;
  }

  // Create a new question with specified type and options, and add it to the indicated
  // survey. Returns `true` on success, `false` on failure.
  createQuestion(surveyId, questionText, type, options) {
    // let survey = this._findSurvey(surveyId);
    // if (!survey) return false;

    // survey.questions.push({
    //   id: nextId(),
    //   text: questionText,
    //   type,
    //   options: options.map(option => {
    //     return { id: nextId(), value: option };
    //   }),
    // });

    // return true;
  }

  // Update the properties of the specified question from the specified survey. Returns
  // `true` on success, `false` if the question or survey doesn't exist.
  updateQuestion(surveyId, questionId, questionText, type, options) {
    // let question = this._findQuestion(surveyId, questionId);
    // if (!question) return false;

    // question.text = questionText;
    // question.type = type;
    // question.options = options.map(option => ({ id: nextId(), value: option }));
    // return true;
  }

  // Returns a reference to the survey with the indicated ID. Returns
  // `undefined` if not found. Note that `surveyId` must be numeric.
  _findSurvey(surveyId) {
    // return this._surveys.find(survey => survey.id === surveyId);
  }

  // Returns a reference to the indicated question in the indicated survey.
  // Returns `undefined` if either the survey or the question is not found. Note
  // that both IDs must be numeric.
  _findQuestion(surveyId, questionId) {
    // let survey = this._findSurvey(surveyId);
    // if (!survey) return undefined;

    // return survey.questions.find(question => question.id === questionId);
  }
};
