let currentPage = 1;
const limit = 10;

document.addEventListener('DOMContentLoaded', function () {
    var urlParams = new URLSearchParams(window.location.search);
    var communityId = urlParams.get('communityId');
    const userId = localStorage.getItem('userId');

    if (!communityId) {
        console.error('No community ID found in URL');
        return;
    }

    fetch(`http://localhost:3000/api/community?communityId=${communityId}`)
        .then(response => response.json())
        .then(community => {
            document.getElementById('community-name').textContent = community.name + ' Leaderboard';
            loadLeaderboard(communityId, currentPage, limit, userId);
        })
        .catch(error => console.error('Error fetching community:', error));

    document.getElementById('search-form').addEventListener('submit', function (event) {
        event.preventDefault();
        const username = document.getElementById('searchUser').value;
        searchUser(communityId, username, userId);
    });

    document.getElementById('prev-page').addEventListener('click', function () {
        if (currentPage > 1) {
            currentPage--;
            loadLeaderboard(communityId, currentPage, limit, userId);
        }
    });

    document.getElementById('next-page').addEventListener('click', function () {
        currentPage++;
        loadLeaderboard(communityId, currentPage, limit, userId);
    });
});

function loadLeaderboard(communityId, page, limit, userId) {
    fetch(`http://localhost:3000/api/community-leaderboard?communityId=${communityId}&page=${page}&limit=${limit}&userId=${userId}`)
        .then(response => response.json())
        .then(data => {
            const leaderboardBody = document.getElementById('leaderboard-body');
            leaderboardBody.innerHTML = '';

            if (data.leaderboard) {
                data.leaderboard.forEach((entry) => {
                    const row = document.createElement('tr');
                    if (entry.userId === parseInt(userId)) {
                        row.classList.add('highlight');
                    }
                    row.innerHTML = `
                        <td>${entry.rank}</td>
                        <td>${entry.username} ${entry.pinned ? '📌' : ''}</td>
                        <td>${entry.current_points}</td>
                        <td><button onclick="togglePin(${communityId}, ${userId}, ${entry.userId}, ${entry.pinned})">${entry.pinned ? 'Unpin' : 'Pin'}</button></td>
                    `;
                    leaderboardBody.appendChild(row);
                });
            }

            document.getElementById('next-page').style.display = data.leaderboard.length < limit ? 'none' : 'inline';
            document.getElementById('prev-page').style.display = currentPage === 1 ? 'none' : 'inline';

            displayTopUsers(data.topUsers);
            displayCurrentUser(data.currentUser);
            displayLastUser(data.lastUser);
            displayPinnedUsers(data.pinnedUsers);
        })
        .catch(error => console.error('Error fetching leaderboard:', error));
}

function displayTopUsers(users) {
    const topUsersList = document.getElementById('top-users-list');
    topUsersList.innerHTML = '';
    if (users) {
        users.forEach(user => {
            const listItem = document.createElement('li');
            listItem.classList.add('list-group-item');
            listItem.textContent = `${user.rank}. ${user.username} (${user.current_points} points)`;
            topUsersList.appendChild(listItem);
        });
    }
}

function displayCurrentUser(user) {
    const currentUserList = document.getElementById('current-user-list');
    currentUserList.innerHTML = '';
    if (user) {
        const listItem = document.createElement('li');
        listItem.classList.add('list-group-item');
        listItem.textContent = `${user.rank}. ${user.username} (${user.current_points} points)`;
        currentUserList.appendChild(listItem);
    }
}

function displayLastUser(user) {
    const lastUserList = document.getElementById('last-user-list');
    lastUserList.innerHTML = '';
    if (user) {
        const listItem = document.createElement('li');
        listItem.classList.add('list-group-item');
        listItem.textContent = `${user.rank}. ${user.username} (${user.current_points} points)`;
        lastUserList.appendChild(listItem);
    }
}

function displayPinnedUsers(users) {
    const pinnedUsersList = document.getElementById('pinned-users-list');
    pinnedUsersList.innerHTML = '';
    if (users) {
        users.forEach(user => {
            const listItem = document.createElement('li');
            listItem.classList.add('list-group-item');
            listItem.textContent = `${user.rank}. ${user.username} (${user.current_points} points)`;
            pinnedUsersList.appendChild(listItem);
        });
    }
}

function searchUser(communityId, username, userId) {
    fetch(`http://localhost:3000/api/search-user?communityId=${communityId}&username=${username}`)
        .then(response => response.json())
        .then(data => {
            const leaderboardBody = document.getElementById('leaderboard-body');
            leaderboardBody.innerHTML = '';

            if (data) {
                data.forEach((entry) => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${entry.rank}</td>
                        <td>${entry.username}</td>
                        <td>${entry.current_points}</td>
                        <td><button onclick="togglePin(${communityId}, ${userId}, ${entry.userId}, ${entry.pinned})">${entry.pinned ? 'Unpin' : 'Pin'}</button></td>
                    `;
                    leaderboardBody.appendChild(row);
                });
            }
        })
        .catch(error => console.error('Error searching user:', error));
}

function togglePin(communityId, userId, targetUserId, isPinned) {
    const action = isPinned ? 'unpin' : 'pin';
    fetch('http://localhost:3000/api/pin-user', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            userId: userId,
            communityId: communityId,
            targetUserId: targetUserId,
            action: action
        }),
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        loadLeaderboard(communityId, currentPage, limit, userId);
    })
    .catch(error => console.error('Error pinning/unpinning user:', error));
}
