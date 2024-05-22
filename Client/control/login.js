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

    fetch('http://localhost:3000/check-user', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            'username': username
        }),
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw err });
        }
        return response.json();
    })
    .then(data => {
        if (data.userId) {
            console.log('User ID:', data.userId);
            // Store userId in local storage
            localStorage.setItem('userId', data.userId);
            // Redirect to dashboard
            window.location.href = '/Client/view/dashboard.html';
        } else {
            alert('Benutzername existiert nicht');
        }
    })
    .catch(error => {
        console.error('Fehler:', error);
        alert(error.message || 'Unbekannter Fehler');
    });
}
