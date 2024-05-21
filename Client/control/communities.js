
        document.addEventListener('DOMContentLoaded', function() {
            fetch('http://localhost:3000/api/communities')
                .then(response => response.json())
                .then(communities => {
                    const communityList = document.getElementById('community-list');
                    communities.forEach(community => {
                        const li = document.createElement('li');
                        li.className = 'list-group-item';
                        li.textContent = community.name;
                        communityList.appendChild(li);
                    });
                })
                .catch(error => console.error('Error fetching communities:', error));
        });