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
    .then(response => {
        if (response.status === 200) {
            return response.json().then(data => {
                window.location.href = '/Client/view/communities.html';
                alert(data.message);
            });
        } else {
            return response.json().then(data => {
                alert(data.message);
            });
        }
    })
    .catch(error => console.error('Error:', error));
}
