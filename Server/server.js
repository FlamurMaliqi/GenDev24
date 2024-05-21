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
            res.sendFile(path.join(__dirname, '../Client/view/dashboard.html'));
        } else {
            res.status(404).send('Benutzer existiert nicht.');
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
            res.status(404).send('Benutzer existiert bereits.');
        } else {
            db.run('INSERT INTO users (username) VALUES (?)', [username], (err) => {
                if (err) {
                    console.error(err.message);
                    return res.status(500).send('Server error');
                }
                res.sendFile(path.join(__dirname, '../Client/view/dashboard.html')); 
            });
        }
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

app.listen(3000, () => {
    console.log('Server läuft auf http://localhost:3000');
});
