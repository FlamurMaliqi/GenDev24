function validateForm() {
    var communityName = document.getElementById('communityName').value;
    if (communityName == "") {
        alert("Community name cannot be empty");
        return false;
    }
    return true;
}

function submitForm(event) {
    event.preventDefault(); // Prevent the default form submission

    if (!validateForm()) {
        return;
    }

    var communityName = document.getElementById('communityName').value;
    var userId = localStorage.getItem('userId');
    console.log('Community Name:', communityName);

    fetch('http://localhost:3000/create-community', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            'communityName': communityName,
            'userId': userId
        }),
    })
    .then(response => {
        if (response.status === 200) {
            window.location.href = '/Client/view/communities.html';
        } else {
            // Handle error response
            alert('Error creating community');
        }
    })
    .catch(error => console.error('Error:', error));
}

document.getElementById('createCommunityForm').addEventListener('submit', submitForm);
