const express = require('express');
const bodyParser = require('body-parser');
const db = require('./database');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const cors = require('cors');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // Wichtig für JSON POST requests
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

// Endpoint zum Abrufen der Communities für einen bestimmten Benutzer
app.get('/api/user-communities', (req, res) => {
    const userId = req.query.userId;

    db.all('SELECT * FROM communities WHERE id IN (SELECT community_id FROM user_communities WHERE user_id = ?)', [userId], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Server error');
        }
        res.json(rows);
    });
});

// Endpoint zum Erstellen einer neuen Community
app.post('/create-community', (req, res) => {
    const communityName = req.body.communityName;
    const userId = req.body.userId;

    // Überprüfen, ob die Community bereits existiert
    db.get('SELECT * FROM communities WHERE name = ?', [communityName], (err, row) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ message: 'Server error' });
        }
        if (row) {
            return res.status(400).json({ message: 'Community already exists' });
        } else {
            // Community existiert nicht, füge sie hinzu
            db.run('INSERT INTO communities (name, user_id) VALUES (?, ?)', [communityName, userId], function(err) {
                if (err) {
                    return console.error(err.message);
                }
                const communityId = this.lastID;
                db.run('INSERT INTO user_communities (user_id, community_id) VALUES (?, ?)', [userId, communityId], (err) => {
                    if (err) {
                        console.error(err.message);
                        return res.status(500).send('Server error');
                    }
                    res.status(200).json({message: 'Community erstellt'});
                });
            });
        }
    });
});

// Endpoint zum Abrufen des Community-Leaderboards
app.get('/api/community-leaderboard', (req, res) => {
    const communityId = req.query.communityId;

    db.all('SELECT * FROM leaderboard WHERE community_id = ?', [communityId], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ message: 'Server error' });
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

app.post('/join-community', (req, res) => {
    const communityName = req.body.communityName;
    const userId = req.body.userId;

    db.get('SELECT id FROM communities WHERE name = ?', [communityName], (err, row) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ message: 'Server error' });
        }
        if (row) {
            const communityId = row.id;

            // Überprüfen, ob der Benutzer bereits in der Community ist
            db.get('SELECT * FROM user_communities WHERE user_id = ? AND community_id = ?', [userId, communityId], (err, userCommunityRow) => {
                if (err) {
                    console.error(err.message);
                    return res.status(500).json({ message: 'Server error' });
                }
                if (userCommunityRow) {
                    return res.status(400).json({ message: 'User is already a member of the community' });
                } else {
                    db.run('INSERT INTO user_communities (user_id, community_id) VALUES (?, ?)', [userId, communityId], (err) => {
                        if (err) {
                            console.error(err.message);
                            return res.status(500).json({ message: 'Server error' });
                        }
                        res.status(200).json({ message: 'Successfully joined the community' });
                    });
                }
            });
        } else {
            res.status(404).json({ message: 'Community not found: ' + communityName });
        }
    });
});

app.listen(3000, () => {
    console.log('Server läuft auf http://localhost:3000');
});
