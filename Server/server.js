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
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

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
});

app.post('/create-community', (req, res) => {
    const { communityName, userId } = req.body;

    db.get('SELECT COUNT(*) as count FROM user_communities WHERE user_id = ?', [userId], (err, row) => {
        if (err) {
            return res.status(500).json({ message: 'Database error' });
        }
        if (row.count >= 5) {
            return res.status(400).json({ message: 'You cannot create or join more than 5 communities.' });
        }

        db.get('SELECT * FROM communities WHERE name = ?', [communityName], (err, row) => {
            if (err) {
                return res.status(500).json({ message: 'Database error' });
            }
            if (row) {
                return res.status(400).json({ message: 'Community already exists' });
            }

            db.run('INSERT INTO communities (name, user_id) VALUES (?, ?)', [communityName, userId], function (err) {
                if (err) {
                    return res.status(500).json({ message: 'Error creating community' });
                }

                const communityId = this.lastID;

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

app.get('/api/community-leaderboard', (req, res) => {
    const communityId = req.query.communityId;
    const userId = req.query.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

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

            const leaderboard = rows.map((row, index) => ({
                rank: offset + index + 1,
                userId: row.userId,
                username: row.username,
                current_points: row.current_points,
                pinned: pinnedUserIds.includes(row.userId)
            }));

            db.all('SELECT u.id as userId, u.username, u.current_points FROM user_communities uc JOIN users u ON uc.user_id = u.id WHERE uc.community_id = ? ORDER BY u.current_points DESC, u.id ASC', [communityId], (err, allRows) => {
                if (err) {
                    console.error(err.message);
                    return res.status(500).json({ message: 'Server error' });
                }

                const topUsers = allRows.slice(0, 3).map((row, index) => ({
                    rank: index + 1,
                    userId: row.userId,
                    username: row.username,
                    current_points: row.current_points,
                }));

                const currentUserIndex = allRows.findIndex(row => row.userId == userId);
                const currentUser = {
                    rank: currentUserIndex + 1,
                    ...allRows[currentUserIndex]
                };

                const lastUser = {
                    rank: allRows.length,
                    ...allRows[allRows.length - 1]
                };

                const pinnedUsers = allRows.filter(row => pinnedUserIds.includes(row.userId)).map((row) => ({
                    rank: allRows.findIndex(r => r.userId === row.userId) + 1,
                    userId: row.userId,
                    username: row.username,
                    current_points: row.current_points,
                }));

                res.json({ leaderboard, topUsers, currentUser, lastUser, pinnedUsers });
            });
        });
    });
});

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

app.post('/api/place-bet', (req, res) => {
    const { userId, gameStartsAt, homeTeam, awayTeam, homeScore, awayScore } = req.body;

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

        db.run('INSERT INTO bets (user_id, game_starts_at, team_home_name, team_away_name, home_score, away_score) VALUES (?, ?, ?, ?, ?, ?)', [userId, game.game_starts_at, homeTeam, awayTeam, homeScore, awayScore], function(err) {
            if (err) {
                console.error(err.message);
                return res.status(500).json({ message: 'Error placing bet' });
            }

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

app.post('/api/update-game-result', (req, res) => {
    const { gameId, homeScore, awayScore } = req.body;

    db.run('UPDATE games SET home_score = ?, away_score = ? WHERE id = ?', [homeScore, awayScore, gameId], function(err) {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ message: 'Error updating game result' });
        }

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

function calculatePoints(actualHomeScore, actualAwayScore, betHomeScore, betAwayScore) {
    const actualGoalDifference = actualHomeScore - actualAwayScore;
    const betGoalDifference = betHomeScore - betAwayScore;

    if (actualHomeScore == betHomeScore && actualAwayScore == betAwayScore) {
        return 8;
    }

    if (actualGoalDifference === betGoalDifference && actualGoalDifference !== 0) {
        return 6;
    }

    if (actualGoalDifference === 0 && betGoalDifference === 0) {
        return 4;
    }

    if ((actualHomeScore > actualAwayScore && betHomeScore > betAwayScore) ||
        (actualHomeScore < actualAwayScore && betHomeScore < betAwayScore)) {
        return 4;
    }

    return 0;
}

app.get('/api/global-leaderboard', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    db.all('SELECT id as userId, username, current_points FROM users ORDER BY current_points DESC, id ASC LIMIT ? OFFSET ?', [limit, offset], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ message: 'Server error' });
        }

        const leaderboard = rows.map((row, index) => ({
            rank: offset + index + 1,
            userId: row.userId,
            username: row.username,
            current_points: row.current_points
        }));

        res.json(leaderboard);
    });
});

app.get('/api/community-sneak-peek', (req, res) => {
    const userId = req.query.userId;

    db.all('SELECT community_id FROM user_communities WHERE user_id = ?', [userId], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ message: 'Server error' });
        }

        if (rows.length === 0) {
            return res.status(404).json({ message: 'User is not part of any community' });
        }

        const communityId = rows[0].community_id;

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

            while (sneakPeek.length < 7 && members.length > sneakPeek.length) {
                for (let i = 0; i < members.length && sneakPeek.length < 7; i++) {
                    if (!sneakPeek.some(user => user.userId === members[i].userId)) {
                        sneakPeek.push(members[i]);
                    }
                }
            }

            res.json(sneakPeek.map((user, index) => ({
                ...user,
                rank: members.findIndex(m => m.userId === user.userId) + 1
            })));
        });
    });
});

app.get('/api/user-community-sneak-previews', (req, res) => {
    const userId = req.query.userId;

    db.all('SELECT * FROM communities WHERE id IN (SELECT community_id FROM user_communities WHERE user_id = ?)', [userId], (err, communities) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Server error');
        }

        const sneakPreviews = [];

        const getSneakPreview = (community, callback) => {
            db.all('SELECT u.id as userId, u.username, u.current_points FROM user_communities uc JOIN users u ON uc.user_id = u.id WHERE uc.community_id = ? ORDER BY u.current_points DESC, u.id ASC', [community.id], (err, rows) => {
                if (err) {
                    console.error(err.message);
                    return callback(err);
                }

                const userIndex = rows.findIndex(row => row.userId == userId);
                const top3Users = rows.slice(0, 3);
                const currentUser = rows[userIndex];
                const userBefore = userIndex > 0 ? rows[userIndex - 1] : null;
                const userAfter = userIndex < rows.length - 1 ? rows[userIndex + 1] : null;
                const lastUser = rows[rows.length - 1];

                let sneakPeek = [...top3Users];

                if (userBefore) {
                    sneakPeek.push(userBefore);
                }

                if (!sneakPeek.some(user => user.userId === currentUser.userId)) {
                    sneakPeek.push(currentUser);
                }

                if (userAfter && !sneakPeek.some(user => user.userId === userAfter.userId)) {
                    sneakPeek.push(userAfter);
                }

                if (!sneakPeek.some(user => user.userId === lastUser.userId)) {
                    sneakPeek.push(lastUser);
                }

                while (sneakPeek.length < 7 && rows.length > sneakPeek.length) {
                    for (let i = 0; i < rows.length && sneakPeek.length < 7; i++) {
                        if (!sneakPeek.some(user => user.userId === rows[i].userId)) {
                            sneakPeek.push(rows[i]);
                        }
                    }
                }

                sneakPreviews.push({
                    community: community.name,
                    users: sneakPeek.map(user => ({
                        ...user,
                        rank: rows.findIndex(r => r.userId === user.userId) + 1
                    }))
                });

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

app.post('/join-community', (req, res) => {
    const communityName = req.body.communityName;
    const userId = req.body.userId;

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
