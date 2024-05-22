const express = require('express');
const bodyParser = require('body-parser');
const db = require('./database');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const cors = require('cors');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint zum Überprüfen von Benutzern
app.post('/check-user', (req, res) => {
    const username = req.body.username;

    db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Server error');
        }
        if (row) {
            res.status(200).json({ message: 'Benutzer ist eingeloggt.', userId: row.id });
        } else {
            res.status(404).json({ message: 'Benutzer existiert nicht.' });
        }
    });
});

// Endpoint zum Hinzufügen von Benutzern
app.post('/register-user', (req, res) => {
    const username = req.body.username;

    db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Server error');
        }
        if (row) {
            res.status(403).json({ message: 'Benutzer existiert bereits.' });
        } else {
            db.run('INSERT INTO users (username) VALUES (?)', [username], function(err) {
                if (err) {
                    console.error(err.message);
                    return res.status(500).send('Server error');
                }
                res.status(200).json({ message: 'Benutzer wurde erstellt.', userId: this.lastID });
            });
        }
    });
});

// Endpoint zum Abrufen aller Communities
app.get('/api/communities', (req, res) => {
    db.all('SELECT * FROM communities', [], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Server error');
        }
        res.json(rows);
    });
});

// Endpoint zum Abrufen der bevorstehenden Spiele
app.get('/api/upcoming-games', (req, res) => {
    const games = [];
    const csvFilePath = path.join(__dirname, 'game_schedule.csv');

    fs.createReadStream(csvFilePath)
        .pipe(csv({ separator: ';' }))
        .on('data', (row) => {
            games.push(row);
        })
        .on('end', () => {
            const upcomingGames = games
                .filter(game => new Date(game.game_starts_at) > new Date())
                .sort((a, b) => new Date(a.game_starts_at) - new Date(b.game_starts_at))
                .slice(0, 3);
            res.json(upcomingGames);
        })
        .on('error', (err) => {
            console.error(err);
            res.status(500).send('Server error');
        });
});

// Endpoint zum Erstellen einer neuen Community
app.post('/create-community', (req, res) => {
    const communityName = req.body.communityName;

    db.run('INSERT INTO communities (name) VALUES (?)', [communityName], (err) => {
        if (err) {
            return console.error(err.message);
        }
        res.status(200).send('Community erstellt');
    });
});

app.listen(3000, () => {
    console.log('Server läuft auf http://localhost:3000');
});
