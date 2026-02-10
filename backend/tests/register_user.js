async function register() {
    try {
        const res = await fetch('http://localhost:3000/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@caribe.com',
                password: 'Admin123!',
                fullName: 'Admin User'
            })
        });
        const data = await res.json();
        console.log('Status:', res.status);
        console.log('Body:', data);
    } catch (e) {
        console.error('Error:', e);
    }
}

register();
