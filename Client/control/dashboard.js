let currentPage = 1;
const limit = 10;

document.addEventListener('DOMContentLoaded', function() {
    const userId = localStorage.getItem('userId'); // Assuming userId is stored in localStorage

    // Fetch upcoming games
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

    // Load global leaderboard
    loadGlobalLeaderboard(currentPage, limit, userId);

    document.getElementById('prev-page').addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            loadGlobalLeaderboard(currentPage, limit, userId);
        }
    });

    document.getElementById('next-page').addEventListener('click', function() {
        currentPage++;
        loadGlobalLeaderboard(currentPage, limit, userId);
    });

    // Load community sneak previews
    loadCommunitySneakPreviews(userId);
});

function loadGlobalLeaderboard(page, limit, userId) {
    fetch(`http://localhost:3000/api/global-leaderboard?page=${page}&limit=${limit}`)
        .then(response => response.json())
        .then(data => {
            const leaderboardBody = document.getElementById('global-leaderboard-body');
            leaderboardBody.innerHTML = '';

            data.forEach((entry, index) => {
                const row = document.createElement('tr');
                if (entry.userId == userId) {
                    row.classList.add('highlight');
                }
                row.innerHTML = `
                    <td>${entry.rank}</td>
                    <td>${entry.username}</td>
                    <td>${entry.current_points}</td>
                `;
                leaderboardBody.appendChild(row);
            });

            if (data.length < limit) {
                document.getElementById('next-page').style.display = 'none';
            } else {
                document.getElementById('next-page').style.display = 'inline';
            }

            if (currentPage === 1) {
                document.getElementById('prev-page').style.display = 'none';
            } else {
                document.getElementById('prev-page').style.display = 'inline';
            }
        })
        .catch(error => console.error('Error fetching global leaderboard:', error));
}

function loadCommunitySneakPreviews(userId) {
    fetch(`http://localhost:3000/api/user-community-sneak-previews?userId=${userId}`)
        .then(response => response.json())
        .then(sneakPreviews => {
            const container = document.getElementById('community-sneak-previews');
            container.innerHTML = '';

            sneakPreviews.forEach(preview => {
                const previewDiv = document.createElement('div');
                previewDiv.className = 'community-preview';
                previewDiv.innerHTML = `
                    <h3>${preview.community} Leaderboard</h3>
                    <div class="leaderboard">
                        <table class="leaderboard-table">
                            <thead>
                                <tr>
                                    <th>Rank</th>
                                    <th>Username</th>
                                    <th>Points</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${preview.users.map(user => `
                                    <tr${user.id === userId ? ' class="highlight"' : ''}>
                                        <td>${user.rank}</td>
                                        <td>${user.username}</td>
                                        <td>${user.current_points}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
                container.appendChild(previewDiv);
            });
        })
        .catch(error => console.error('Error fetching community sneak previews:', error));
}
