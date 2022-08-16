const { dbQuery } = require("./db-query");
const bcrypt = require("bcrypt");

module.exports = class PgPersistence {
  constructor(session) {
    this.username = session.username;
  }

  // Returns a Promise that resolves to a list of all the surveys together with
  // their questions and participants.
  async allSurveys() {
    const ALL_SURVEYS = "SELECT surveys.*, COUNT(survey_id) AS number_of_participants " +
                        "FROM surveys LEFT OUTER JOIN participants " +
                        "ON surveys.id = survey_id WHERE username = $1 " +
                        "GROUP BY surveys.id ORDER BY surveys.id ASC";
    const FIND_QUESTIONS = "SELECT * FROM questions WHERE username = $1";

    let resultSurveys = dbQuery(ALL_SURVEYS, this.username);
    let resultQuestions = dbQuery(FIND_QUESTIONS, this.username);
    let resultBoth = await Promise.all([resultSurveys, resultQuestions]);

    let surveys = resultBoth[0].rows;
    let questions = resultBoth[1].rows;
    if (!surveys || !questions) return undefined;

    surveys.forEach(survey => {
      survey.questions = questions.filter(question => {
        return survey.id === question.survey_id;
      });
    });

    return surveys;
  }

  // Returns a Promise that resolves to the survey with the indicated ID. The survey
  // contains its questions. The Promise resolves to `undefined` if the survey is
  // not found.
  async loadSurvey(surveyId) {
    const FIND_SURVEY = "SELECT * FROM surveys WHERE id = $1 AND username = $2";
    const FIND_QUESTIONS = "SELECT * FROM questions WHERE survey_id = $1 " +
                           "AND username = $2 ORDER BY id ASC";

    let resultSurvey = dbQuery(FIND_SURVEY, surveyId, this.username);
    let resultQuestions = dbQuery(FIND_QUESTIONS, surveyId, this.username);
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
    const CREATE_SURVEY = "INSERT INTO surveys (title, username) VALUES ($1, $2)";

    try {
      let result = await dbQuery(CREATE_SURVEY, title, this.username);
      return result.rowCount > 0;
    } catch (error) {
      if (this.isUniqueConstraintViolation(error)) return false;
      throw error;
    }
  }

  // Delete the specified survey from the list of surveys. Returns a Promise that
  // resolves to`true` on success, `false` otherwise.
  async deleteSurvey(surveyId) {
    const DELETE_SURVEY = "DELETE FROM surveys WHERE id = $1 and username = $2";
    let result = await dbQuery(DELETE_SURVEY, surveyId, this.username);

    return result.rowCount > 0;
  }

  // Returns a Promise that resolves to `true` if a survey with the specified title
  // exists in the list of surveys, `false` otherwise.
  async existsSurveyTitle(title) {
    const FIND_SURVEY = "SELECT null FROM surveys WHERE title = $1 AND username = $2";

    let result = await dbQuery(FIND_SURVEY, title, this.username);
    return result.rowCount > 0;
  }

  // Set a new title for the specified survey. Returns `true` on success,
  // `false` otherwise.
  async changeSurveyTitle(surveyId, newTitle) {
    const UPDATE_TITLE = "UPDATE surveys SET title = $1 WHERE id = $2 AND username = $3";
    let result = await dbQuery(UPDATE_TITLE, newTitle, surveyId, this.username);

    return result.rowCount > 0;
  }

  // Returns a Promise that resolves to an object representing the indicated question
  // in the indicated survey, `undefined` if either the survey or the question is
  // not found.
  async loadQuestion(surveyId, questionId) {
    const FIND_QUESTION = "SELECT * FROM questions WHERE id = $1 AND survey_id = $2 " +
                          "AND username = $3";

    let result = await dbQuery(FIND_QUESTION, questionId, surveyId, this.username);
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
    const DELETE_QUESTION = "DELETE FROM questions WHERE id = $1 AND survey_id = $2 " +
                            "AND username = $3";

    let result = await dbQuery(DELETE_QUESTION, questionId, surveyId, this.username);
    return result.rowCount > 0;
  }

  // Create a new question with specified type and options, and add it to the indicated
  // survey. Returns a Promise that resolves to `true` on success, `false` on failure.
  async createQuestion(surveyId, questionText, questionType, options) {
    const INSERT_QUESTION = "INSERT INTO questions (question_type, question_text, survey_id, username) " +
                            "VALUES ($1, $2, $3, $4) RETURNING *";
    const INSERT_OPTIONS = "INSERT INTO options (option_value, question_id) " +
                           "VALUES ($1, $2)";

    let questionResult = await dbQuery(INSERT_QUESTION, questionType, questionText, surveyId, this.username);
    if (questionResult.rowCount <= 0) return false;

    options = options.map(option => dbQuery(INSERT_OPTIONS, option, questionResult.rows[0].id));
    let optionsResults = await Promise.all(options);
    return optionsResults.every(query => query.rowCount > 0);
  }

  // Update the properties of the specified question from the specified survey.
  // Returns a Promise that resolves to `true` on success, `false` if the question or
  // survey doesn't exist.
  async updateQuestion(surveyId, questionId, questionText, questionType, options) {
    const FIND_QUESTION = "SELECT * FROM questions WHERE id = $1 AND survey_id = $2 " +
                          "AND username = $3";
    const FIND_OPTIONS = "SELECT * FROM options WHERE question_id = $1";
  
    let questionResult = dbQuery(FIND_QUESTION, questionId, surveyId, this.username);
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
                                 "WHERE id = $2 AND survey_id = $3 AND username = $4";

    let result = await dbQuery(UPDATE_QUESTION_TEXT, newText, questionId, surveyId, this.username);
    return result.rowCount > 0;
  }

  // Update the type of the specified question from the specified survey.
  // Returns a Promise that resolves to `true` on success, `false` otherwise.
  async updateQuestionType(surveyId, questionId, newType) {
    const UPDATE_QUESTION_TYPE = "UPDATE questions SET question_type = $1 " +
                                 "WHERE id = $2 AND survey_id = $3 AND username = $4";

    let result = await dbQuery(UPDATE_QUESTION_TYPE, newType, questionId, surveyId, this.username);
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

  // Publish the specified survey. Returns a Promise that resolves to `true`
  // on success, `false` otherwise.
  async publishSurvey(surveyId) {
    const PUBLISH_SURVEY = "UPDATE surveys SET published = true " +
                           "WHERE id = $1 AND username = $2";

    let result = await dbQuery(PUBLISH_SURVEY, surveyId, this.username);
    return result.rowCount > 0;
  }

  // Returns a Promise that resolves to `true` if `username` and `password`
  // combine to identify a legitimate application user, `false` if either the
  // `username` or `password` is invalid.
  async authenticate(username, password) {
    const FIND_HASHED_PASSWORD = "SELECT password FROM users" +
                                 "  WHERE username = $1";

    let result = await dbQuery(FIND_HASHED_PASSWORD, username);
    if (result.rowCount === 0) return false;

    return bcrypt.compare(password, result.rows[0].password);
  }

  // Returns `true` if `error` seems to indicate a `UNIQUE` constraint
  // violation, `false` otherwise.
  isUniqueConstraintViolation(error) {
    return /duplicate key value violates unique constraint/.test(String(error));
  }
};
