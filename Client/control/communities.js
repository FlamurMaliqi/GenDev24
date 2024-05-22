document.addEventListener('DOMContentLoaded', function() {
    var userId = localStorage.getItem('userId');
    
    if (!userId) {
        console.error('No user ID found in local storage');
        return;
    }

    fetch(`http://localhost:3000/api/user-communities?userId=${userId}`)
        .then(response => response.json())
        .then(communities => {
            var communityList = document.getElementById('community-list');
            communityList.innerHTML = '';

            communities.forEach(community => {
                var listItem = document.createElement('li');
                listItem.textContent = community.name;
                communityList.appendChild(listItem);
            });
        })
        .catch(error => console.error('Error fetching communities:', error));
});
