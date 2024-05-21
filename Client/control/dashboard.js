document.addEventListener("DOMContentLoaded", function() {
            fetch('http://localhost:3000/api/upcoming-games')
                .then(response => response.json())
                .then(games => {
                    const upcomingGamesList = document.getElementById('upcoming-games');
                    games.forEach(game => {
                        const listItem = document.createElement('li');
                        listItem.className = 'list-group-item';
                        listItem.textContent = `${game.team_home_name} vs. ${game.team_away_name} - ${new Date(game.game_starts_at).toLocaleString()}`;
                        upcomingGamesList.appendChild(listItem);
                    });
                })
                .catch(error => console.error('Error fetching upcoming games:', error));
        });