INSERT INTO surveys (title, username)
  VALUES ('Some Simple Questions', 'admin'),
         ('More Questions', 'admin'),
         ('Even More Questions', 'admin');

INSERT INTO questions (question_type, question_text, survey_id, username)
  VALUES ('closed', 'The earth is flat. True or False?', 1, 'admin'),
         ('nominal', 'What are your favorite flavours of ice cream?', 1, 'admin'),
         ('open', 'How old are you?', 1, 'admin'),
         ('closed', 'What is the capitol of UK?', 1, 'admin'),
         ('closed', 'Chocolate is delicious.', 2, 'admin'),
         ('open', 'What is your name?', 2, 'admin');

INSERT INTO options (option_value, question_id)
  VALUES ('true', 1),
         ('false', 1),
         ('chocolate', 2),
         ('vanilla', 2),
         ('strawberry', 2),
         ('pistachio', 2),
         ('None of the above', 2),
         ('London', 4),
         ('Birmingham', 4),
         ('Liverpool', 4),
         ('true', 5),
         ('false', 5),
         ('neutral', 5);
