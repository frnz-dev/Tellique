document.addEventListener('DOMContentLoaded', () => {
    const BASE_URL = 'https://tellique-backend.onrender.com';

    window.previewImage = function () {
        const preview = document.getElementById('preview');
        const file = document.getElementById('profile-pic').files[0];
        const reader = new FileReader();
        reader.onloadend = function () {
            preview.src = reader.result;
        };
        if (file) {
            reader.readAsDataURL(file);
        } else {
            preview.src = 'assets/images/default-avatar.png';
        }
    };

    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const profilePic = document.getElementById('preview')?.src || '';

            if (password !== confirmPassword) {
                alert("Passwords don't match!");
                return;
            }

            try {
                const response = await fetch(`${BASE_URL}/api/users/signup`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password, profilePic })
                });
                const data = await response.json();
                if (response.ok) {
                    sessionStorage.setItem('currentUser', username);
                    window.location.href = 'login.html';
                } else {
                    alert(data.error || 'Signup failed');
                }
            } catch (err) {
                console.error(err);
                alert('Error signing up');
            }
        });
    }

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;

            try {
                const response = await fetch(`${BASE_URL}/api/users/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                const data = await response.json();
                if (response.ok) {
                    sessionStorage.setItem('currentUser', username);
                    window.location.href = 'home.html';
                } else {
                    alert(data.error || 'Login failed');
                }
            } catch (err) {
                console.error(err);
                alert('Error logging in');
            }
        });
    }

    const currentUser = sessionStorage.getItem('currentUser');
    if (currentUser) {
        const avatarImg = document.getElementById('current-avatar');
        const avatarInput = document.getElementById('update-avatar');

        if (avatarImg) {
            fetch(`${BASE_URL}/api/users/profile/${currentUser}`)
                .then(res => res.json())
                .then(data => {
                    avatarImg.src = data.profilePic || 'assets/images/default-avatar.png';
                });
        }

        if (avatarInput) {
            avatarInput.addEventListener('change', () => {
                const file = avatarInput.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const newAvatar = reader.result;
                        if (avatarImg) avatarImg.src = newAvatar;

                        fetch(`${BASE_URL}/api/users/profile/${currentUser}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ profilePic: newAvatar })
                        });
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
    }

    if (window.location.pathname.includes('home.html')) {
        if (!currentUser) {
            window.location.href = 'login.html';
        } else {
            document.getElementById('username-display').textContent = currentUser;
            loadMessages();

            document.getElementById('send-form')?.addEventListener('submit', async (e) => {
                e.preventDefault();
                const recipient = document.getElementById('recipient').value;
                const nickname = document.getElementById('nickname')?.value || 'Anonymous';
                const content = document.getElementById('confession-text').value;

                try {
                    const response = await fetch(`${BASE_URL}/api/messages`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ from: currentUser, to: recipient, nickname, content })
                    });
                    if (response.ok) {
                        alert('Confession sent!');
                        document.getElementById('send-form').reset();
                        loadMessages();
                    } else {
                        const data = await response.json();
                        alert(data.error || 'Failed to send');
                    }
                } catch (err) {
                    console.error(err);
                    alert('Error sending message');
                }
            });

            document.getElementById('logout-btn')?.addEventListener('click', () => {
                sessionStorage.removeItem('currentUser');
                window.location.href = 'login.html';
            });
        }
    }

    if (window.location.pathname.includes('sent.html')) {
        if (!currentUser) {
            window.location.href = 'login.html';
        } else {
            document.getElementById('username-display').textContent = currentUser;
            const sentContainer = document.getElementById('sent-messages-container');

            fetch(`${BASE_URL}/api/messages/sent/${currentUser}`)
                .then(res => res.json())
                .then(data => {
                    if (data.length > 0) {
                        sentContainer.innerHTML = data.map(msg => `
                            <div class="message">
                                <h3>You (as "${msg.nickname}") → ${msg.to}</h3>
                                <p>${msg.content}</p>
                                <small>${msg.date}</small>
                            </div>
                        `).join('');
                    } else {
                        sentContainer.innerHTML = `<p>No sent messages yet.</p>`;
                    }
                });

            document.getElementById('logout-btn')?.addEventListener('click', () => {
                sessionStorage.removeItem('currentUser');
                window.location.href = 'login.html';
            });
        }
    }

    if (window.location.pathname.includes('compose.html')) {
        if (!currentUser) {
            window.location.href = 'login.html';
        } else {
            document.getElementById('username-display').textContent = currentUser;
            const params = new URLSearchParams(window.location.search);
            const recipient = params.get('to');
            if (recipient) {
                document.getElementById('recipient').value = recipient;
            }

            document.getElementById('send-form')?.addEventListener('submit', async (e) => {
                e.preventDefault();
                const recipient = document.getElementById('recipient').value;
                const nickname = document.getElementById('nickname')?.value || 'Anonymous';
                const content = document.getElementById('confession-text').value;

                try {
                    const response = await fetch(`${BASE_URL}/api/messages`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ from: currentUser, to: recipient, nickname, content })
                    });
                    if (response.ok) {
                        alert('Confession sent!');
                        document.getElementById('send-form').reset();
                        window.location.href = 'sent.html';
                    } else {
                        const data = await response.json();
                        alert(data.error || 'Failed to send');
                    }
                } catch (err) {
                    console.error(err);
                    alert('Error sending message');
                }
            });

            document.getElementById('logout-btn')?.addEventListener('click', () => {
                sessionStorage.removeItem('currentUser');
                window.location.href = 'login.html';
            });
        }
    }

    function loadMessages() {
        const messagesContainer = document.getElementById('messages-container');
        if (!messagesContainer || !currentUser) return;

        fetch(`${BASE_URL}/api/messages/inbox/${currentUser}`)
            .then(res => res.json())
            .then(async data => {
                if (!data.length) {
                    messagesContainer.innerHTML = `<p>No messages yet.</p>`;
                    return;
                }

                const messageHTML = await Promise.all(data.map(async msg => {
                    const res = await fetch(`${BASE_URL}/api/users/profile/${msg.from}`);
                    const profile = await res.json();
                    const avatar = profile.profilePic || 'assets/images/default-avatar.png';

                    return `
                        <div class="message">
                            <img src="${avatar}" alt="Avatar" style="width:40px; height:40px; border-radius:50%; margin-bottom: 0.5rem;" />
                            <h3>From: ${msg.nickname || 'Anonymous Confessor'}</h3>
                            <p>${msg.content}</p>
                            <small>${msg.date}</small>
                            <br/>
                            <a href="compose.html?to=${msg.from}" class="glow-button small" style="margin-top: 0.5rem;">Reply</a>
                        </div>
                    `;
                }));
                messagesContainer.innerHTML = messageHTML.join('');
            });
    }

    const themeToggle = document.querySelector('.switch .circle');
    if (themeToggle) {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            themeToggle.checked = true;
        }

        themeToggle.addEventListener('change', () => {
            document.body.classList.toggle('dark-mode', themeToggle.checked);
            localStorage.setItem('theme', themeToggle.checked ? 'dark' : 'light');
        });
    }
});
