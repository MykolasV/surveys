const { dbQuery } = require("./db-query");

module.exports = class PgPersistence {
  // Returns a Promise that resolves to a list of all the surveys together with
  // their questions and participants.
  async allSurveys() {
    const ALL_SURVEYS = "SELECT * FROM surveys ORDER BY id ASC";
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
    const FIND_QUESTIONS = "SELECT * FROM questions WHERE survey_id = $1 ORDER BY id ASC";

    let resultSurvey = dbQuery(FIND_SURVEY, surveyId);
    let resultQuestions = dbQuery(FIND_QUESTIONS, surveyId);
    let resultBoth = await Promise.all([resultSurvey, resultQuestions]);

    let survey = resultBoth[0].rows[0];
    if (!survey) return undefined;

    survey.questions = resultBoth[1].rows;
    return survey;
  }

  // Create a new survey with the specified title and add it to the list of
  // surveys. Returns a Promise that resolves to `true` on success,
  // `false` if the survey exists.
  async createSurvey(title) {
    const CREATE_SURVEY = "INSERT INTO surveys (title) VALUES ($1)";

    try {
      let result = await dbQuery(CREATE_SURVEY, title);
      return result.rowCount > 0;
    } catch (error) {
      if (this.isUniqueConstraintViolation(error)) return false;
      throw error;
    }
  }

  // Delete the specified survey from the list of surveys. Returns a Promise that
  // resolves to`true` on success, `false` otherwise.
  async deleteSurvey(surveyId) {
    const DELETE_SURVEY = "DELETE FROM surveys WHERE id = $1";
    let result = await dbQuery(DELETE_SURVEY, surveyId);

    return result.rowCount > 0;
  }

  // Returns a Promise that resolves to `true` if a survey with the specified title
  // exists in the list of surveys, `false` otherwise.
  async existsSurveyTitle(title) {
    const FIND_SURVEY = "SELECT null FROM surveys WHERE title = $1";

    let result = await dbQuery(FIND_SURVEY, title);
    return result.rowCount > 0;
  }

  // Set a new title for the specified survey. Returns `true` on success,
  // `false` otherwise.
  async changeSurveyTitle(surveyId, newTitle) {
    const UPDATE_TITLE = "UPDATE surveys SET title = $1 WHERE id = $2";
    let result = await dbQuery(UPDATE_TITLE, newTitle, surveyId);

    return result.rowCount > 0;
  }

  // Returns a Promise that resolves to an object representing the indicated question
  // in the indicated survey, `undefined` if either the survey or the question is
  // not found.
  async loadQuestion(surveyId, questionId) {
    const FIND_QUESTION = "SELECT * FROM questions WHERE id = $1 AND survey_id = $2";

    let result = await dbQuery(FIND_QUESTION, questionId, surveyId);
    return result.rows[0];
  }

  // Returns a Promise that resolves to an array of objects representing the options
  // of the indicated quesiton.
  async loadOptions(questionId) {
    const FIND_OPTIONS = "SELECT * FROM options WHERE question_id = $1";

    let result = await dbQuery(FIND_OPTIONS, questionId);
    return result.rows;
  }

  // Delete the specified question from the specified survey. Returns a Promise that
  // resolves to `true` on success, `false` otherwise.
  async deleteQuestion(surveyId, questionId) {
    const DELETE_QUESTION = "DELETE FROM questions WHERE id = $1 AND survey_id = $2";

    let result = await dbQuery(DELETE_QUESTION, questionId, surveyId);
    return result.rowCount > 0;
  }

  // Create a new question with specified type and options, and add it to the indicated
  // survey. Returns a Promise that resolves to `true` on success, `false` on failure.
  async createQuestion(surveyId, questionText, questionType, options) {
    const INSERT_QUESTION = "INSERT INTO questions (question_type, question_text, survey_id) " +
                            "VALUES ($1, $2, $3) RETURNING *";
    const INSERT_OPTIONS = "INSERT INTO options (option_value, question_id) " +
                           "VALUES ($1, $2)";

    let questionResult = await dbQuery(INSERT_QUESTION, questionType, questionText, surveyId);
    if (questionResult.rowCount <= 0) return false;

    options = options.map(option => dbQuery(INSERT_OPTIONS, option, questionResult.rows[0].id));
    let optionsResults = await Promise.all(options);
    return optionsResults.every(query => query.rowCount > 0);
  }

  // Update the properties of the specified question from the specified survey.
  // Returns a Promise that resolves to `true` on success, `false` if the question or
  // survey doesn't exist.
  async updateQuestion(surveyId, questionId, questionText, questionType, options) {
    const FIND_QUESTION = "SELECT * FROM questions WHERE id = $1 AND survey_id = $2";
    const FIND_OPTIONS = "SELECT * FROM options WHERE question_id = $1";
  
    let questionResult = dbQuery(FIND_QUESTION, questionId, surveyId);
    let optionsResult = dbQuery(FIND_OPTIONS, questionId);
    let resultBoth = await Promise.all([questionResult, optionsResult]);

    let question = resultBoth[0].rows[0];
    let questionOptions = resultBoth[1].rows.map(option => option.option_value);

    if (!question) return false;

    if (question.question_text !== questionText) {
      await this.updateQuestionText(surveyId, questionId, questionText);
    }

    if (question.quesitonType !== questionType) {
      await this.updateQuestionType(surveyId, questionId, questionType);
    }

    if (options.length !== questionOptions.length ||
        (options.some((option, idx) => option !== questionOptions[idx]))) {
      await this.updateQuestionOptions(questionId, options);
    }

    return true;
  }

  // Update the text of the specified question from the specified survey.
  // Returns a Promise that resolves to `true` on success, `false` otherwise.
  async updateQuestionText(surveyId, questionId, newText) {
    const UPDATE_QUESTION_TEXT = "UPDATE questions SET question_text = $1 " +
                                 "WHERE id = $2 AND survey_id = $3";

    let result = await dbQuery(UPDATE_QUESTION_TEXT, newText, questionId, surveyId);
    return result.rowCount > 0;
  }

  // Update the type of the specified question from the specified survey.
  // Returns a Promise that resolves to `true` on success, `false` otherwise.
  async updateQuestionType(surveyId, questionId, newType) {
    const UPDATE_QUESTION_TYPE = "UPDATE questions SET question_type = $1 " +
                                 "WHERE id = $2 AND survey_id = $3";

    let result = await dbQuery(UPDATE_QUESTION_TYPE, newType, questionId, surveyId);
    return result.rowCount > 0;
  }

  // Update the options of the specified question. Returns a Promise that
  // resolves to `true` on success, `false` otherwise.
  async updateQuestionOptions(questionId, newOptions) {
    const DELETE_OPTIONS = "DELETE FROM options WHERE question_id = $1";
    await dbQuery(DELETE_OPTIONS, questionId);

    const INSERT_OPTION = "INSERT INTO options (option_value, question_id) VALUES ($1, $2)";
    newOptions = newOptions.map(option => dbQuery(INSERT_OPTION, option, questionId));
    let result = await Promise.all(newOptions);

    return result.every(query => query.rowCount > 0);
  }

  // Returns a Promise that resolves to `true` if `username` and `password`
  // combine to identify a legitimate application user, `false` if either the
  // `username` or `password` is invalid.
  async authenticate(username, password) {
    const AUTHENTICATE = "SELECT null FROM users" +
                         "  WHERE username = $1" +
                         "    AND password = $2";

    let result = await dbQuery(AUTHENTICATE, username, password);
    return result.rowCount > 0;
  }

  // Returns `true` if `error` seems to indicate a `UNIQUE` constraint
  // violation, `false` otherwise.
  isUniqueConstraintViolation(error) {
    return /duplicate key value violates unique constraint/.test(String(error));
  }
};
