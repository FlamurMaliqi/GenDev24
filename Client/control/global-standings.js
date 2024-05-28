let currentPage = 1;
const limit = 10;

document.addEventListener('DOMContentLoaded', function() {
    loadGlobalLeaderboard(currentPage, limit);

    document.getElementById('prev-page').addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            loadGlobalLeaderboard(currentPage, limit);
        }
    });

    document.getElementById('next-page').addEventListener('click', function() {
        currentPage++;
        loadGlobalLeaderboard(currentPage, limit);
    });
});

function loadGlobalLeaderboard(page, limit) {
    fetch(`http://localhost:3000/api/global-leaderboard?page=${page}&limit=${limit}`)
        .then(response => response.json())
        .then(data => {
            const leaderboardBody = document.getElementById('global-leaderboard-body');
            leaderboardBody.innerHTML = '';

            data.forEach((entry, index) => {
                const row = document.createElement('tr');
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
