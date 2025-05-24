-- D1 Database Schema for Cloudflare D1
-- Created based on the Prisma schema

-- Users table
CREATE TABLE User (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  token TEXT,
  role TEXT NOT NULL DEFAULT 'unverified',
  theme_preferences TEXT DEFAULT '{}',
  device_history TEXT DEFAULT '[]',
  verification_tokens TEXT DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Services table
CREATE TABLE Service (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Service Requests table
CREATE TABLE ServiceRequest (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  service_id INTEGER NOT NULL,
  details TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES User(id),
  FOREIGN KEY (service_id) REFERENCES Service(id)
);

-- Achievements table
CREATE TABLE Achievement (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Easter Eggs table
CREATE TABLE EasterEgg (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Secret Settings table
CREATE TABLE SecretSetting (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  achievement_id INTEGER,
  easter_egg_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (achievement_id) REFERENCES Achievement(id),
  FOREIGN KEY (easter_egg_id) REFERENCES EasterEgg(id)
);

-- User Achievements table
CREATE TABLE UserAchievement (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  achievement_id INTEGER NOT NULL,
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES User(id),
  FOREIGN KEY (achievement_id) REFERENCES Achievement(id),
  UNIQUE(user_id, achievement_id)
);

-- User Easter Eggs table
CREATE TABLE UserEasterEgg (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  easter_egg_id INTEGER NOT NULL,
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES User(id),
  FOREIGN KEY (easter_egg_id) REFERENCES EasterEgg(id),
  UNIQUE(user_id, easter_egg_id)
);

-- User Secret Settings table
CREATE TABLE UserSecretSetting (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  secret_setting_id INTEGER NOT NULL,
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES User(id),
  FOREIGN KEY (secret_setting_id) REFERENCES SecretSetting(id),
  UNIQUE(user_id, secret_setting_id)
);

-- Tickets table
CREATE TABLE Ticket (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  priority TEXT DEFAULT 'medium',
  user_id INTEGER NOT NULL,
  service_request_id INTEGER UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES User(id),
  FOREIGN KEY (service_request_id) REFERENCES ServiceRequest(id)
);

-- Ticket Messages table
CREATE TABLE TicketMessage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT NOT NULL,
  sender_id INTEGER NOT NULL,
  ticket_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_read BOOLEAN DEFAULT 0,
  FOREIGN KEY (sender_id) REFERENCES User(id),
  FOREIGN KEY (ticket_id) REFERENCES Ticket(id)
);

-- Create triggers to update the updated_at timestamp
CREATE TRIGGER update_user_timestamp 
AFTER UPDATE ON User
BEGIN
  UPDATE User SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_service_request_timestamp 
AFTER UPDATE ON ServiceRequest
BEGIN
  UPDATE ServiceRequest SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_ticket_timestamp 
AFTER UPDATE ON Ticket
BEGIN
  UPDATE Ticket SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;