let currentPage = 1;
const limit = 10;

document.addEventListener('DOMContentLoaded', function() {
    var urlParams = new URLSearchParams(window.location.search);
    var communityId = urlParams.get('communityId');

    if (!communityId) {
        console.error('No community ID found in URL');
        return;
    }

    fetch(`http://localhost:3000/api/community?communityId=${communityId}`)
        .then(response => response.json())
        .then(community => {
            document.getElementById('community-name').textContent = community.name + ' Leaderboard';
            loadLeaderboard(communityId, currentPage, limit);
        })
        .catch(error => console.error('Error fetching community:', error));

    document.getElementById('search-form').addEventListener('submit', function(event) {
        event.preventDefault();
        const username = document.getElementById('searchUser').value;
        searchUser(communityId, username);
    });

    document.getElementById('prev-page').addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            loadLeaderboard(communityId, currentPage, limit);
        }
    });

    document.getElementById('next-page').addEventListener('click', function() {
        currentPage++;
        loadLeaderboard(communityId, currentPage, limit);
    });
});

function loadLeaderboard(communityId, page, limit) {
    fetch(`http://localhost:3000/api/community-leaderboard?communityId=${communityId}&page=${page}&limit=${limit}`)
        .then(response => response.json())
        .then(data => {
            var leaderboardBody = document.getElementById('leaderboard-body');
            leaderboardBody.innerHTML = '';

            data.forEach((entry, index) => {
                var row = document.createElement('tr');
                row.innerHTML = `
                    <td>${entry.current_rank}</td>
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
        .catch(error => console.error('Error fetching leaderboard:', error));
}

function searchUser(communityId, username) {
    fetch(`http://localhost:3000/api/search-user?communityId=${communityId}&username=${username}`)
        .then(response => response.json())
        .then(data => {
            var leaderboardBody = document.getElementById('leaderboard-body');
            leaderboardBody.innerHTML = '';

            data.forEach((entry, index) => {
                var row = document.createElement('tr');
                row.innerHTML = `
                    <td>${entry.current_rank}</td>
                    <td>${entry.username}</td>
                    <td>${entry.current_points}</td>
                `;
                leaderboardBody.appendChild(row);
            });
        })
        .catch(error => console.error('Error searching user:', error));
}
