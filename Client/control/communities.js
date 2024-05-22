document.addEventListener('DOMContentLoaded', function() {
    fetch('http://localhost:3000/api/communities')
        .then(response => response.json())
        .then(communities => {
            const communityList = document.getElementById('community-list');
            communities.forEach(community => {
                const li = document.createElement('li');
                li.className = 'list-group-item';

                const link = document.createElement('a');
                link.href = "community.html"; // Set this to the desired URL
                link.textContent = community.name;

                li.appendChild(link);
                communityList.appendChild(li);
            });
        })
        .catch(error => console.error('Error fetching communities:', error));
});
