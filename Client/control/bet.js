let selectedGame = null; // Variable to store the selected game

document.addEventListener('DOMContentLoaded', function() {
    fetch('http://localhost:3000/api/next-three-games')
        .then(response => response.json())
        .then(games => {
            const gameSelect = document.getElementById('gameSelect');

            games.forEach((game, index) => {
                const option = document.createElement('option');
                option.value = game.game_starts_at;
                const gameDate = new Date(game.game_starts_at);
                option.textContent = `${game.team_home_name} vs ${game.team_away_name} (${gameDate.toLocaleString()})`;
                gameSelect.appendChild(option);
            });

            if (games.length > 0) {
                selectedGame = games[0];
                updateTeams(selectedGame);
            }

            gameSelect.addEventListener('change', function() {
                selectedGame = games.find(game => game.game_starts_at === this.value);
                updateTeams(selectedGame);
            });
        })
        .catch(error => console.error('Error fetching next games:', error));

    document.getElementById('bet-form').addEventListener('submit', function(event) {
        event.preventDefault();
        placeBet(selectedGame); // Pass the selected game to the placeBet function
    });
});

function updateTeams(game) {
    document.getElementById('homeTeam').value = game.team_home_name;
    document.getElementById('awayTeam').value = game.team_away_name;
}

function placeBet(game) {
    if (!game) {
        alert('No game selected');
        return;
    }

    const userId = localStorage.getItem('userId'); // Assuming userId is stored in localStorage
    const gameStartsAt = game.game_starts_at; // Use game_starts_at from the game object
    const homeTeam = game.team_home_name;
    const awayTeam = game.team_away_name;
    const homeScore = document.getElementById('homeScore').value;
    const awayScore = document.getElementById('awayScore').value;

    fetch('http://localhost:3000/api/place-bet', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            userId: userId,
            gameStartsAt: gameStartsAt,
            homeTeam: homeTeam,
            awayTeam: awayTeam,
            homeScore: homeScore,
            awayScore: awayScore
        }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === 'Bet placed successfully') {
            alert('Bet placed successfully');
        } else {
            alert('Error placing bet: ' + data.message);
        }
    })
    .catch(error => console.error('Error placing bet:', error));
}
