const sqlite3 = require('sqlite3').verbose();

// Öffnen einer Verbindung zur Datenbank
let db = new sqlite3.Database('database.db');

// Erstellen der Tabellen für Benutzer und Communities
db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, current_points INTEGER DEFAULT 0)");
    db.run("CREATE TABLE IF NOT EXISTS communities (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, user_id INTEGER, FOREIGN KEY(user_id) REFERENCES users(id))");
    db.run("CREATE TABLE IF NOT EXISTS user_communities (user_id INTEGER, community_id INTEGER, FOREIGN KEY(user_id) REFERENCES users(id), FOREIGN KEY(community_id) REFERENCES communities(id))");
    db.run("CREATE TABLE IF NOT EXISTS leaderboard (id INTEGER PRIMARY KEY AUTOINCREMENT, community_id INTEGER, user_id INTEGER, FOREIGN KEY(community_id) REFERENCES communities(id), FOREIGN KEY(user_id) REFERENCES users(id))");
    
    // Neue Tabelle für Spiele
    db.run(`CREATE TABLE IF NOT EXISTS games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        team_home_name TEXT,
        team_away_name TEXT,
        home_score INTEGER,
        away_score INTEGER,
        game_starts_at TEXT
    )`, (err) => {
        if (err) {
            console.error('Error creating games table', err);
        } else {
            // Dummy-Daten einfügen
            db.run(`INSERT INTO games (team_home_name, team_away_name, home_score, away_score, game_starts_at) VALUES
                ('Deutschland', 'Schottland', 4, 3, '2024-06-14 19:00:00'),
                ('Ungarn', 'Schweiz', 2, 1, '2024-06-15 13:00:00'),
                ('Spanien', 'Kroatien', 3, 2, '2024-06-15 16:00:00')`);
        }
    });

    // Neue Tabelle für Wetten
    db.run(`CREATE TABLE IF NOT EXISTS bets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        game_starts_at TEXT,
        team_home_name TEXT,
        team_away_name TEXT,
        home_score INTEGER,
        away_score INTEGER,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);
});

module.exports = db;
