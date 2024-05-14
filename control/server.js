const express = require('express');
const bodyParser = require('body-parser');
const db = require('./database');
const path = require('path');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

// Endpoint zum Überprüfen von Benutzern
app.post('/check-user', (req, res) => {
    const username = req.body.username;

    db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
        if (err) {
            return console.error(err.message);
        }
        if (row) {
            res.sendFile(path.join(__dirname, '../view/dashboard.html'));
        } else {
            res.send('Benutzer existiert nicht.');
        }
    });
});

// Endpoint zum Hinzufügen von Benutzern
app.post('/register-user', (req, res) => {
    const username = req.body.username;

    db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
        if (err) {
            return console.error(err.message);
        }
        if (row) {
            res.send('Benutzer existiert bereits.');
        } else {
            db.run('INSERT INTO users (username) VALUES (?)', [username], (err) => {
                if (err) {
                    return console.error(err.message);
                }
                res.sendFile(path.join(__dirname, '../view/dashboard.html')); 
            });
        }
    });
});

app.listen(3000, () => {
    console.log('Server läuft auf http://localhost:3000');
});