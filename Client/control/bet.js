document.addEventListener('DOMContentLoaded', function() {
    fetch('http://localhost:3000/api/next-three-games')
        .then(response => response.json())
        .then(games => {
            const gameSelect = document.getElementById('gameSelect');

            games.forEach((game, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = `${game.team_home_name} vs ${game.team_away_name} (${new Date(game.game_starts_at).toLocaleString()})`;
                gameSelect.appendChild(option);
            });

            if (games.length > 0) {
                updateTeams(games[0]);
            }

            gameSelect.addEventListener('change', function() {
                const selectedGame = games[this.value];
                updateTeams(selectedGame);
            });
        })
        .catch(error => console.error('Error fetching next games:', error));

    document.getElementById('bet-form').addEventListener('submit', function(event) {
        event.preventDefault();
        placeBet();
    });
});

function updateTeams(game) {
    document.getElementById('homeTeam').value = game.team_home_name;
    document.getElementById('awayTeam').value = game.team_away_name;
    document.getElementById('homeScore').dataset.gameId = game.id; // Save gameId in dataset for later use
    document.getElementById('awayScore').dataset.gameId = game.id; // Save gameId in dataset for later use
}

function placeBet() {
    const userId = localStorage.getItem('userId'); // Assuming userId is stored in localStorage
    const gameId = document.getElementById('homeScore').dataset.gameId;
    const homeScore = document.getElementById('homeScore').value;
    const awayScore = document.getElementById('awayScore').value;
    console.log(gameId);

    fetch('http://localhost:3000/api/place-bet', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            userId: userId,
            gameId: gameId,
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
