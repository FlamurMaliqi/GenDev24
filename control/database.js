const sqlite3 = require('sqlite3').verbose();

// Öffnen einer Verbindung zur Datenbank
let db = new sqlite3.Database(':memory:');

// Erstellen einer Tabelle für Benutzerdaten
db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT)");
});

module.exports = db;
