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
                var link = document.createElement('a');
                link.href = `community.html?communityId=${community.id}`;
                link.textContent = community.name;
                link.className = 'list-group-item';
                communityList.appendChild(link);
            });
        })
        .catch(error => console.error('Error fetching communities:', error));
});
