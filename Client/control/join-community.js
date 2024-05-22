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
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            window.location.href = '/Client/view/dashboard.html';
        } else {
            alert('Error joining the community: ' + data.message);
        }
    })
    .catch(error => console.error('Error:', error));
}
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
                                                                                                                                                                                                                        
