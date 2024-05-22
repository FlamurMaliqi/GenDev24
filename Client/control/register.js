function validateForm() {
    var username = document.getElementById('Username').value;
    if (username == "") {
        alert("Benutzername darf nicht leer sein");
        return false;
    }
    return true;
}

function submitForm(event) {
    event.preventDefault(); // Verhindert das Neuladen der Seite

    if (!validateForm()) {
        return;
    }

    var username = document.getElementById('Username').value;
    console.log('Benutzername:', username);

    fetch('http://localhost:3000/register-user', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            'username': username
        }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.userId) {
            console.log('New User ID:', data.userId);
            // Store userId in local storage
            localStorage.setItem('userId', data.userId);
            window.location.href = '/Client/view/dashboard.html';
        } else {
            alert('Benutzername bereits vergeben');
        }
    })
    .catch(error => console.error('Fehler:', error));
}
