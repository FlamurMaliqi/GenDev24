const express = require('express');
const bodyParser = require('body-parser');
const db = require('./database');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const cors = require('cors');
const async = require('async');

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
            db.run('INSERT INTO users (username, current_points) VALUES (?, 0)', [username], function(err) {
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

// Endpoint zum Pinnen und Entpinnen von Benutzern
app.post('/api/pin-user', (req, res) => {
    const { userId, communityId, targetUserId, action } = req.body;

    if (action === 'pin') {
        db.run('INSERT INTO pinned_users (user_id, community_id, pinned_user_id) VALUES (?, ?, ?)', [userId, communityId, targetUserId], function(err) {
            if (err) {
                console.error(err.message);
                return res.status(500).json({ message: 'Error pinning user' });
            }
            res.status(200).json({ message: 'User pinned successfully' });
        });
    } else if (action === 'unpin') {
        db.run('DELETE FROM pinned_users WHERE user_id = ? AND community_id = ? AND pinned_user_id = ?', [userId, communityId, targetUserId], function(err) {
            if (err) {
                console.error(err.message);
                return res.status(500).json({ message: 'Error unpinning user' });
            }
            res.status(200).json({ message: 'User unpinned successfully' });
        });
    } else {
        res.status(400).json({ message: 'Invalid action' });
    }
})

// Route zum Erstellen einer Community
app.post('/create-community', (req, res) => {
    const { communityName, userId } = req.body;

    // Überprüfen, wie viele Communities der Benutzer bereits hat
    db.get('SELECT COUNT(*) as count FROM user_communities WHERE user_id = ?', [userId], (err, row) => {
        if (err) {
            return res.status(500).json({ message: 'Database error' });
        }
        if (row.count >= 5) {
            return res.status(400).json({ message: 'You cannot create or join more than 5 communities.' });
        }

        // Überprüfen, ob die Community bereits existiert
        db.get('SELECT * FROM communities WHERE name = ?', [communityName], (err, row) => {
            if (err) {
                return res.status(500).json({ message: 'Database error' });
            }
            if (row) {
                return res.status(400).json({ message: 'Community already exists' });
            }

            // Community erstellen
            db.run('INSERT INTO communities (name, user_id) VALUES (?, ?)', [communityName, userId], function (err) {
                if (err) {
                    return res.status(500).json({ message: 'Error creating community' });
                }

                const communityId = this.lastID;

                // Benutzer zur user_communities Tabelle hinzufügen
                db.run('INSERT INTO user_communities (user_id, community_id) VALUES (?, ?)', [userId, communityId], function (err) {
                    if (err) {
                        return res.status(500).json({ message: 'Error adding user to community' });
                    }

                    res.status(200).json({ message: 'Community created successfully' });
                });
            });
        });
    });
});

// Endpoint zum Abrufen der Community-Details
app.get('/api/community', (req, res) => {
    const communityId = req.query.communityId;

    db.get('SELECT * FROM communities WHERE id = ?', [communityId], (err, row) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ message: 'Server error' });
        }
        if (!row) {
            return res.status(404).json({ message: 'Community not found' });
        }
        res.json(row);
    });
});

// Endpoint zum Abrufen der Community-Leaderboards mit gepinnten Benutzern
app.get('/api/community-leaderboard', (req, res) => {
    const communityId = req.query.communityId;
    const userId = req.query.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Retrieve pinned users
    db.all('SELECT pinned_user_id FROM pinned_users WHERE user_id = ? AND community_id = ?', [userId, communityId], (err, pinnedRows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ message: 'Server error' });
        }

        const pinnedUserIds = pinnedRows.map(row => row.pinned_user_id);

        db.all('SELECT u.id as userId, u.username, u.current_points FROM user_communities uc JOIN users u ON uc.user_id = u.id WHERE uc.community_id = ? ORDER BY u.current_points DESC, u.id ASC LIMIT ? OFFSET ?', [communityId, limit, offset], (err, rows) => {
            if (err) {
                console.error(err.message);
                return res.status(500).json({ message: 'Server error' });
            }

            // Add pinned users to the leaderboard
            const pinnedUsersQuery = pinnedUserIds.length > 0 ? ` OR u.id IN (${pinnedUserIds.join(',')})` : '';
            db.all(`SELECT u.id as userId, u.username, u.current_points FROM user_communities uc JOIN users u ON uc.user_id = u.id WHERE uc.community_id = ?${pinnedUsersQuery} ORDER BY u.current_points DESC, u.id ASC`, [communityId], (err, pinnedRows) => {
                if (err) {
                    console.error(err.message);
                    return res.status(500).json({ message: 'Server error' });
                }

                const uniqueRows = [...new Map([...rows, ...pinnedRows].map(item => [item['userId'], item])).values()];

                const leaderboard = uniqueRows.map((row, index) => ({
                    rank: offset + index + 1,
                    userId: row.userId,
                    username: row.username,
                    current_points: row.current_points,
                    pinned: pinnedUserIds.includes(row.userId)
                }));

                res.json(leaderboard);
            });
        });
    });
});

// Endpoint zum Suchen von Benutzern im Leaderboard
app.get('/api/search-user', (req, res) => {
    const communityId = req.query.communityId;
    const username = req.query.username;

    db.all('SELECT u.username, u.current_points FROM user_communities uc JOIN users u ON uc.user_id = u.id WHERE uc.community_id = ? AND u.username LIKE ? ORDER BY u.current_points DESC', [communityId, `%${username}%`], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ message: 'Server error' });
        }

        const leaderboard = rows.map((row, index) => ({
            rank: index + 1,
            username: row.username,
            current_points: row.current_points
        }));

        res.json(leaderboard);
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
            const now = new Date();
            const upcomingGames = games
                .map(game => {
                    game.game_starts_at = new Date(game.game_starts_at);
                    return game;
                })
                .filter(game => game.game_starts_at > now)
                .sort((a, b) => a.game_starts_at - b.game_starts_at)
                .slice(0, 3);

            if (upcomingGames.length > 0) {
                res.json(upcomingGames);
            } else {
                res.status(404).json({ message: 'No upcoming games found' });
            }
        })
        .on('error', (err) => {
            console.error(err);
            res.status(500).send('Server error');
        });
});

// Endpoint zum Platzieren einer Wette basierend auf game_starts_at
app.post('/api/place-bet', (req, res) => {
    const { userId, gameStartsAt, homeTeam, awayTeam, homeScore, awayScore } = req.body;

    // Extrahiere nur das Datum
    const gameStartsAtDate = new Date(gameStartsAt).toISOString().split('T')[0];

    db.get('SELECT * FROM games WHERE DATE(game_starts_at) = ? AND team_home_name = ? AND team_away_name = ?', [gameStartsAtDate, homeTeam, awayTeam], (err, game) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({message: 'Server error'});
        }

        if (!game) {
            return res.status(404).json({message: 'Game not found'});
        }

        const gameStartsAtDateTime = new Date(game.game_starts_at);
        const now = new Date();

        if (now >= gameStartsAtDateTime) {
            return res.status(400).json({ message: 'Betting for this game is closed' });
        }

        // Wette speichern
        db.run('INSERT INTO bets (user_id, game_starts_at, team_home_name, team_away_name, home_score, away_score) VALUES (?, ?, ?, ?, ?, ?)', [userId, game.game_starts_at, homeTeam, awayTeam, homeScore, awayScore], function(err) {
            if (err) {
                console.error(err.message);
                return res.status(500).json({ message: 'Error placing bet' });
            }

            // Punkte berechnen und aktualisieren, falls das Spiel bereits beendet ist
            if (game.home_score !== null && game.away_score !== null) {
                const points = calculatePoints(game.home_score, game.away_score, homeScore, awayScore);
                db.run('UPDATE users SET current_points = current_points + ? WHERE id = ?', [points, userId], function(err) {
                    if (err) {
                        console.error(err.message);
                        return res.status(500).json({ message: 'Error updating user points' });
                    }
                    res.status(200).json({ message: 'Bet placed and points updated successfully' });
                });
            } else {
                res.status(200).json({ message: 'Bet placed successfully' });
            }
        });
    });
});

// Endpoint zum Aktualisieren der Spielergebnisse und Berechnen der Punkte
app.post('/api/update-game-result', (req, res) => {
    const { gameId, homeScore, awayScore } = req.body;

    db.run('UPDATE games SET home_score = ?, away_score = ? WHERE id = ?', [homeScore, awayScore, gameId], function(err) {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ message: 'Error updating game result' });
        }

        // Punkte berechnen und aktualisieren
        db.all('SELECT * FROM bets WHERE game_id = ?', [gameId], (err, bets) => {
            if (err) {
                console.error(err.message);
                return res.status(500).json({ message: 'Error retrieving bets' });
            }

            bets.forEach(bet => {
                const points = calculatePoints(homeScore, awayScore, bet.home_score, bet.away_score);

                db.run('UPDATE users SET current_points = current_points + ? WHERE id = ?', [points, bet.user_id], function(err) {
                    if (err) {
                        console.error(err.message);
                    }
                });
            });

            res.status(200).json({ message: 'Game result updated and points calculated' });
        });
    });
});

// Funktion zum Berechnen der Punkte basierend auf den Wettregeln
function calculatePoints(actualHomeScore, actualAwayScore, betHomeScore, betAwayScore) {
    const actualGoalDifference = actualHomeScore - actualAwayScore;
    const betGoalDifference = betHomeScore - betAwayScore;

    if (actualHomeScore == betHomeScore && actualAwayScore == betAwayScore) {
        return 8; // Exact result
    }

    if (actualGoalDifference === betGoalDifference && actualGoalDifference !== 0) {
        return 6; // Correct goal difference (non-draw)
    }

    if (actualGoalDifference === 0 && betGoalDifference === 0) {
        return 4; // Correct goal difference (draw)
    }

    if ((actualHomeScore > actualAwayScore && betHomeScore > betAwayScore) ||
        (actualHomeScore < actualAwayScore && betHomeScore < betAwayScore)) {
        return 4; // Correct tendency
    }

    return 0; // Everything else
}

// Endpoint zum Abrufen des globalen Leaderboards
app.get('/api/global-leaderboard', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    db.all('SELECT id as userId, username, current_points FROM users ORDER BY current_points DESC, id ASC LIMIT ? OFFSET ?', [limit, offset], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ message: 'Server error' });
        }

        // Hinzufügen der Rangnummer
        const leaderboard = rows.map((row, index) => ({
            rank: offset + index + 1,
            userId: row.userId,
            username: row.username,
            current_points: row.current_points
        }));

        res.json(leaderboard);
    });
});

// Endpoint zum Abrufen der Sneak-Preview des Community-Leaderboards
app.get('/api/community-sneak-peek', (req, res) => {
    const userId = req.query.userId;

    // Finde die Community-IDs, in denen der Benutzer Mitglied ist
    db.all('SELECT community_id FROM user_communities WHERE user_id = ?', [userId], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ message: 'Server error' });
        }

        if (rows.length === 0) {
            return res.status(404).json({ message: 'User is not part of any community' });
        }

        const communityId = rows[0].community_id; // Für die Sneak-Preview verwenden wir die erste Community

        // Abrufen der Daten für die Sneak-Preview
        db.all('SELECT u.id as userId, u.username, u.current_points FROM user_communities uc JOIN users u ON uc.user_id = u.id WHERE uc.community_id = ? ORDER BY u.current_points DESC, u.id ASC', [communityId], (err, members) => {
            if (err) {
                console.error(err.message);
                return res.status(500).json({ message: 'Server error' });
            }

            const userIndex = members.findIndex(member => member.userId === parseInt(userId));
            const top3Users = members.slice(0, 3);
            const lastUser = members[members.length - 1];
            const currentUser = members[userIndex];
            const userBefore = userIndex > 0 ? members[userIndex - 1] : null;
            const userAfter = userIndex < members.length - 1 ? members[userIndex + 1] : null;

            let sneakPeek = [...top3Users];
            if (!sneakPeek.some(user => user.userId === currentUser.userId)) {
                sneakPeek.push(currentUser);
            }
            if (userBefore && !sneakPeek.some(user => user.userId === userBefore.userId)) {
                sneakPeek.push(userBefore);
            }
            if (userAfter && !sneakPeek.some(user => user.userId === userAfter.userId)) {
                sneakPeek.push(userAfter);
            }
            if (!sneakPeek.some(user => user.userId === lastUser.userId)) {
                sneakPeek.push(lastUser);
            }

            // Auffüllen der Sneak-Preview bis zu 7 Benutzer
            while (sneakPeek.length < 7 && members.length > sneakPeek.length) {
                for (let i = 0; i < members.length && sneakPeek.length < 7; i++) {
                    if (!sneakPeek.some(user => user.userId === members[i].userId)) {
                        sneakPeek.push(members[i]);
                    }
                }
            }

            res.json(sneakPeek);
        });
    });
});

// Endpoint zum Abrufen der Sneak-Preview für alle Communities des Benutzers
app.get('/api/user-community-sneak-previews', (req, res) => {
    const userId = req.query.userId;

    db.all('SELECT * FROM communities WHERE id IN (SELECT community_id FROM user_communities WHERE user_id = ?)', [userId], (err, communities) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Server error');
        }

        const sneakPreviews = [];

        const getSneakPreview = (community, callback) => {
            db.all('SELECT u.username, u.current_points FROM user_communities uc JOIN users u ON uc.user_id = u.id WHERE uc.community_id = ? ORDER BY u.current_points DESC, u.id ASC', [community.id], (err, rows) => {
                if (err) {
                    console.error(err.message);
                    return callback(err);
                }

                // Berechne die Sneak-Preview
                const userIndex = rows.findIndex(row => row.id === userId);
                const sneakPreview = [];

                // Top 3 users
                sneakPreview.push(...rows.slice(0, 3));

                // User before and after logged-in user
                if (userIndex !== -1) {
                    if (userIndex > 0) {
                        sneakPreview.push(rows[userIndex - 1]);
                    }
                    sneakPreview.push(rows[userIndex]);
                    if (userIndex < rows.length - 1) {
                        sneakPreview.push(rows[userIndex + 1]);
                    }
                }

                // Last user
                if (rows.length > 3 && rows[rows.length - 1].id !== userId) {
                    sneakPreview.push(rows[rows.length - 1]);
                }

                // Füllen, um 7 Benutzer zu haben
                while (sneakPreview.length < 7 && sneakPreview.length < rows.length) {
                    sneakPreview.push(rows[sneakPreview.length]);
                }

                sneakPreviews.push({ community: community.name, users: sneakPreview });

                callback(null);
            });
        };

        const tasks = communities.map(community => callback => getSneakPreview(community, callback));

        async.parallel(tasks, err => {
            if (err) {
                return res.status(500).send('Server error');
            }
            res.json(sneakPreviews);
        });
    });
});

// Endpoint zum Beitreten einer Community
app.post('/join-community', (req, res) => {
    const communityName = req.body.communityName;
    const userId = req.body.userId;

    // Überprüfen, wie viele Communities der Benutzer bereits hat
    db.get('SELECT COUNT(*) as count FROM user_communities WHERE user_id = ?', [userId], (err, row) => {
        if (err) {
            return res.status(500).json({ message: 'Database error' });
        }
        if (row.count >= 5) {
            return res.status(400).json({ message: 'You cannot create or join more than 5 communities.' });
        }

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
});
app.listen(3000, () => {
    console.log('Server läuft auf http://localhost:3000');
});
