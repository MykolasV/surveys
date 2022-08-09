INSERT INTO surveys (title)
  VALUES ('Some Simple Questions'),
         ('More Questions'),
         ('Even More Questions');

INSERT INTO questions (question_type, question, survey_id)
  VALUES ('closed', 'The earth is flat. True or False?', 1),
         ('nominal', 'What are your favorite flavours of ice cream?', 1),
         ('open', 'How old are you?', 1),
         ('closed', 'What is the capitol of UK?', 1),
         ('closed', 'Chocolate is delicious.', 2),
         ('open', 'What is your name?', 2);

INSERT INTO options (option_value, question_id)
  VALUES ('true', 1),
         ('false', 1),
         ('chocolate', 2),
         ('vanilla', 2),
         ('strawberry', 2),
         ('pistachio', 2),
         ('None of the above', 2),
         (null, 3),
         ('London', 4),
         ('Birmingham', 4),
         ('Liverpool', 4),
         ('true', 5),
         ('false', 5),
         ('neutral', 5),
         (null, 6);
