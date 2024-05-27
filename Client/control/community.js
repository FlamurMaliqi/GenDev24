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
            loadLeaderboard(communityId);
        })
        .catch(error => console.error('Error fetching community:', error));
});

function loadLeaderboard(communityId) {
    fetch(`http://localhost:3000/api/community-leaderboard?communityId=${communityId}`)
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
        .catch(error => console.error('Error fetching leaderboard:', error));
}

function searchUser() {
    var username = document.getElementById("searchUser").value;
    alert("Searching for user: " + username);
    // Add the logic to search for the user within the community leaderboard
}

function loadPreviousPage() {
    alert("Loading previous page of users...");
    // Add the logic to load the previous page of users in the leaderboard
}

function loadNextPage() {
    alert("Loading next page of users...");
    // Add the logic to load the next page of users in the leaderboard
}
