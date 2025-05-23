document.addEventListener('DOMContentLoaded', () => {
    let users = JSON.parse(localStorage.getItem('users')) || {
        'testuser': {
            password: 'testpass',
            messages: [],
            sent: [],
            profilePic: 'assets/images/default-avatar.png'
        }
    };

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
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const profilePic = document.getElementById('preview')?.src || 'assets/images/default-avatar.png';

            if (password !== confirmPassword) {
                alert("Passwords don't match!");
                return;
            }

            users[username] = { password, messages: [], sent: [], profilePic };
            localStorage.setItem('users', JSON.stringify(users));
            localStorage.setItem('currentUser', username);
            window.location.href = 'login.html';
        });
    }

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;
            const user = users[username];

            if (user && user.password === password) {
                localStorage.setItem('currentUser', username);
                window.location.href = 'home.html';
            } else {
                alert('Invalid credentials');
            }
        });
    }

    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        const avatarImg = document.getElementById('current-avatar');
        const avatarInput = document.getElementById('update-avatar');

        if (avatarImg) {
            avatarImg.src = users[currentUser]?.profilePic || 'assets/images/default-avatar.png';
        }

        if (avatarInput) {
            avatarInput.addEventListener('change', () => {
                const file = avatarInput.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const newAvatar = reader.result;
                        if (avatarImg) avatarImg.src = newAvatar;
                        users[currentUser].profilePic = newAvatar;
                        localStorage.setItem('users', JSON.stringify(users));
                        alert("Avatar updated!");
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

            document.getElementById('send-form')?.addEventListener('submit', (e) => {
                e.preventDefault();
                const recipient = document.getElementById('recipient').value;
                const nickname = document.getElementById('nickname')?.value || 'Anonymous';
                const content = document.getElementById('confession-text').value;

                if (!users[recipient]) {
                    alert('User not found');
                    return;
                }

                const timestamp = new Date().toLocaleString();

                users[recipient].messages.push({
                    from: currentUser,
                    nickname,
                    content,
                    date: timestamp
                });

                if (!users[currentUser].sent) users[currentUser].sent = [];
                users[currentUser].sent.push({
                    to: recipient,
                    content,
                    date: timestamp,
                    nickname
                });

                localStorage.setItem('users', JSON.stringify(users));
                document.getElementById('send-form').reset();
                alert('Confession sent!');
                loadMessages();
            });

            document.getElementById('logout-btn')?.addEventListener('click', () => {
                localStorage.removeItem('currentUser');
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
            const user = users[currentUser];

            if (sentContainer && user?.sent?.length > 0) {
                sentContainer.innerHTML = user.sent.map(msg => `
                    <div class="message">
                        <h3>You (as "${msg.nickname || 'Anonymous'}") → ${msg.to}</h3>
                        <p>${msg.content}</p>
                        <small>${msg.date}</small>
                    </div>
                `).join('');
            } else if (sentContainer) {
                sentContainer.innerHTML = `<p>No sent messages yet.</p>`;
            }

            document.getElementById('logout-btn')?.addEventListener('click', () => {
                localStorage.removeItem('currentUser');
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
                const input = document.getElementById('recipient');
                if (input) input.value = recipient;
            }

            document.getElementById('send-form')?.addEventListener('submit', (e) => {
                e.preventDefault();
                const recipient = document.getElementById('recipient').value;
                const nickname = document.getElementById('nickname')?.value || 'Anonymous';
                const content = document.getElementById('confession-text').value;

                if (!users[recipient]) {
                    alert('User not found');
                    return;
                }

                const timestamp = new Date().toLocaleString();

                users[recipient].messages.push({
                    from: currentUser,
                    nickname,
                    content,
                    date: timestamp
                });

                if (!users[currentUser].sent) users[currentUser].sent = [];
                users[currentUser].sent.push({
                    to: recipient,
                    content,
                    date: timestamp,
                    nickname
                });

                localStorage.setItem('users', JSON.stringify(users));
                document.getElementById('send-form').reset();
                alert('Confession sent!');
                window.location.href = 'sent.html';
            });

            document.getElementById('logout-btn')?.addEventListener('click', () => {
                localStorage.removeItem('currentUser');
                window.location.href = 'login.html';
            });
        }
    }

    function loadMessages() {
        const messagesContainer = document.getElementById('messages-container');

        if (messagesContainer && users[currentUser]) {
            const messages = users[currentUser].messages;
            if (messages.length === 0) {
                messagesContainer.innerHTML = `<p>No messages yet.</p>`;
                return;
            }

            messagesContainer.innerHTML = messages.map(msg => {
                const senderPic = users[msg.from]?.profilePic || 'assets/images/default-avatar.png';
                return `
                    <div class="message">
                        <img src="${senderPic}" alt="Avatar" style="width:40px; height:40px; border-radius:50%; margin-bottom: 0.5rem;" />
                        <h3>From: ${msg.nickname || 'Anonymous Confessor'}</h3>
                        <p>${msg.content}</p>
                        <small>${msg.date}</small>
                        <br/>
                        <a href="compose.html?to=${msg.from}" class="glow-button small" style="margin-top: 0.5rem;">Reply</a>
                    </div>
                `;
            }).join('');
        }
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
