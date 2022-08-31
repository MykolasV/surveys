CREATE TABLE users (
  username text PRIMARY KEY CHECK (length(trim(username)) > 0),
  password text NOT NULL CHECK (length(trim(password)) > 0)
);

CREATE TABLE surveys (
  id serial PRIMARY KEY,
  title text NOT NULL CHECK (length(trim(title)) > 0),
  username text NOT NULL REFERENCES users (username) ON DELETE CASCADE,
  published boolean NOT NULL DEFAULT false,
  created_on timestamptz NOT NULL DEFAULT now(),
  published_on timestamptz,
  UNIQUE (username, title)
);

CREATE TABLE questions (
  id serial PRIMARY KEY,
  question_type text NOT NULL CHECK (question_type IN ('closed', 'nominal', 'open')),
  question_text text NOT NULL CHECK (length(trim(question_text)) > 0),
  survey_id integer NOT NULL REFERENCES surveys (id) ON DELETE CASCADE,
  username text NOT NULL REFERENCES users (username) ON DELETE CASCADE
);

CREATE TABLE options (
  id serial PRIMARY KEY,
  option_value text NOT NULL CHECK (length(trim(option_value)) > 0),
  question_id integer NOT NULL REFERENCES questions (id) ON DELETE CASCADE
);

CREATE TABLE participants (
  id serial PRIMARY KEY,
  survey_id integer NOT NULL REFERENCES surveys (id) ON DELETE CASCADE
);

CREATE TABLE answers (
  id serial PRIMARY KEY,
  survey_id integer NOT NULL REFERENCES surveys (id) ON DELETE CASCADE,
  question_id integer NOT NULL REFERENCES questions (id) ON DELETE CASCADE,
  participant_id integer NOT NULL REFERENCES participants (id) ON DELETE CASCADE,
  -- The answer can be:
  -- - option IDs for `closed` and `nominal` quesitons (i.e. '1, 2, 5')
  -- - user answer for `open` questions (i.e. 'I like ice cream becuase it's delicious.')
  answer text NOT NULL CHECK (length(answer) > 0)
);
