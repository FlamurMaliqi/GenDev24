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
            if (response.status === 200) {
                // Benutzer wurde erfolgreich registriert, verarbeiten Sie die Antwort hier
                return response.text().then(text => {
                    // Das Dashboard HTML wird hier geladen
                    document.body.innerHTML = text;
                });
            } else {
                // Es gab einen Fehler, verarbeiten Sie die Antwort hier
                alert('Benutzername existiert nicht');
            }
        })
        .catch(error => console.error('Fehler:', error));
    }