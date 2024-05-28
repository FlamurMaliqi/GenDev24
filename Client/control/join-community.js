function submitJoinForm(event) {
    event.preventDefault();

    var communityName = document.getElementById('communityName').value;
    var userId = localStorage.getItem('userId');

    if (!userId) {
        console.error('No user ID found in local storage');
        return;
    }

    fetch('http://localhost:3000/join-community', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({ 'communityName': communityName, 'userId': userId })
    })
    .then(response => response.json().then(data => ({ status: response.status, body: data })))
    .then(({ status, body }) => {
        if (status === 200) {
            window.location.href = '/Client/view/communities.html';
            alert(body.message);
        } else {
            alert(body.message);
        }
    })
    .catch(error => console.error('Error:', error));
}

document.getElementById('joinCommunityForm').addEventListener('submit', submitJoinForm);
