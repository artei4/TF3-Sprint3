-- Academia Pelé — modelo inicial do banco de dados da Sprint 3
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('player','staff')),
  cpf TEXT UNIQUE
);

CREATE TABLE addresses (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  cep TEXT, state TEXT, city TEXT, district TEXT, address TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE athlete_positions (
  athlete_id INTEGER NOT NULL,
  position TEXT NOT NULL,
  is_primary INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (athlete_id) REFERENCES users(id)
);

CREATE TABLE tryouts (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  location TEXT NOT NULL,
  seats INTEGER NOT NULL,
  created_by INTEGER NOT NULL,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE tryout_positions (
  tryout_id INTEGER NOT NULL,
  position TEXT NOT NULL,
  FOREIGN KEY (tryout_id) REFERENCES tryouts(id)
);

CREATE TABLE tryout_registrations (
  tryout_id INTEGER NOT NULL,
  athlete_id INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (tryout_id, athlete_id),
  FOREIGN KEY (tryout_id) REFERENCES tryouts(id),
  FOREIGN KEY (athlete_id) REFERENCES users(id)
);

CREATE TABLE evaluations (
  id INTEGER PRIMARY KEY,
  athlete_id INTEGER NOT NULL,
  evaluator_id INTEGER NOT NULL,
  rating REAL NOT NULL,
  comment TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (athlete_id) REFERENCES users(id),
  FOREIGN KEY (evaluator_id) REFERENCES users(id)
);

CREATE TABLE conversations (
  id INTEGER PRIMARY KEY,
  created_at TEXT NOT NULL
);

CREATE TABLE conversation_members (
  conversation_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  PRIMARY KEY (conversation_id, user_id),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE messages (
  id INTEGER PRIMARY KEY,
  conversation_id INTEGER NOT NULL,
  sender_id INTEGER NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id),
  FOREIGN KEY (sender_id) REFERENCES users(id)
);
