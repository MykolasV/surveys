CREATE TABLE users (
  username text PRIMARY KEY,
  password text NOT NULL
);

CREATE TABLE surveys (
  id serial PRIMARY KEY,
  title text NOT NULL UNIQUE,
  username text NOT NULL REFERENCES users (username) ON DELETE CASCADE,
  published boolean NOT NULL DEFAULT false,
  created_on timestamptz NOT NULL DEFAULT now(),
  published_on timestamptz
);

CREATE TABLE questions (
  id serial PRIMARY KEY,
  question_type text NOT NULL,
  question_text text NOT NULL,
  survey_id integer NOT NULL REFERENCES surveys (id) ON DELETE CASCADE,
  username text NOT NULL REFERENCES users (username) ON DELETE CASCADE,
  CONSTRAINT valid_question_type CHECK (question_type IN ('closed', 'nominal', 'open'))
);

CREATE TABLE options (
  id serial PRIMARY KEY,
  option_value text,
  question_id integer NOT NULL REFERENCES questions (id) ON DELETE CASCADE
);

CREATE TABLE participants (
  id serial PRIMARY KEY,
  survey_id integer NOT NULL REFERENCES surveys (id) ON DELETE CASCADE
);

-- The answer can be:
-- - option IDs for `closed` and `nominal` quesitons (i.e. '1, 2, 5')
-- - user answer for `open` questions (i.e. 'I like ice cream becuase it's delicious.')
CREATE TABLE answers (
  id serial PRIMARY KEY,
  answer text NOT NULL
);

CREATE TABLE results (
  id serial PRIMARY KEY,
  survey_id integer NOT NULL REFERENCES surveys (id) ON DELETE CASCADE,
  question_id integer NOT NULL REFERENCES questions (id) ON DELETE CASCADE,
  participant_id integer NOT NULL REFERENCES participants (id) ON DELETE CASCADE,
  answer_id integer NOT NULL REFERENCES answers (id) ON DELETE CASCADE
);
