const sqlite3 = require('sqlite3').verbose();

// Öffnen einer Verbindung zur Datenbank
let db = new sqlite3.Database('database.db');

// Erstellen der Tabellen für Benutzer und Communities
db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT)");
    db.run("CREATE TABLE IF NOT EXISTS communities (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, user_id INTEGER, FOREIGN KEY(user_id) REFERENCES users(id))");
    db.run("CREATE TABLE IF NOT EXISTS user_communities (user_id INTEGER, community_id INTEGER, FOREIGN KEY(user_id) REFERENCES users(id), FOREIGN KEY(community_id) REFERENCES communities(id))");
    // Neue Tabelle für das Community-Leaderboard
    db.run(`CREATE TABLE IF NOT EXISTS leaderboard (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        community_id INTEGER,
        user_id INTEGER,
        position INTEGER,
        change TEXT,
        name TEXT,
        result1 TEXT,
        result2 TEXT,
        result3 TEXT,
        result4 TEXT,
        points INTEGER,
        FOREIGN KEY(community_id) REFERENCES communities(id),
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);
});

module.exports = db;
