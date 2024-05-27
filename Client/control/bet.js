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
        // Hier können Sie die Logik zum Speichern der Wette hinzufügen
        const homeTeam = document.getElementById('homeTeam').value;
        const awayTeam = document.getElementById('awayTeam').value;
        const homeScore = document.getElementById('homeScore').value;
        const awayScore = document.getElementById('awayScore').value;
        console.log(`Bet placed on ${homeTeam} vs ${awayTeam}: ${homeScore} - ${awayScore}`);
    });
});

function updateTeams(game) {
    document.getElementById('homeTeam').value = game.team_home_name;
    document.getElementById('awayTeam').value = game.team_away_name;
}
