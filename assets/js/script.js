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
        <img src="${msg.senderAvatar || 'assets/images/default-avatar.png'}"
             style="width:40px; height:40px; border-radius:50%; margin-bottom:0.5rem;" />
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
        .then(data => {
            if (!data.length) {
                messagesContainer.innerHTML = `<p>No messages yet.</p>`;
                return;
            }

            const messageHTML = data.map(msg => {
                const avatar = msg.senderAvatar || 'assets/images/default-avatar.png';
                return `
                    <div class="message" data-id="${msg._id}" 
                         style="position: relative; padding: 10px; border: 1px solid #ddd; border-radius: 10px; margin-bottom: 10px;">
                        <img src="${avatar}" alt="Avatar" 
                             style="width:40px; height:40px; border-radius:50%; margin-bottom: 0.5rem;" />
                        <h3>From: ${msg.nickname || 'Anonymous Confessor'}</h3>
                        <p>${msg.content}</p>
                        <small>${msg.date}</small>
                        <br/>
                        <a href="compose.html?to=${msg.from}" class="glow-button small" style="margin-top: 0.5rem;">Reply</a>

                        <!-- Reaction trigger icon -->
                        <button class="reaction-trigger" 
                                style="margin-left: 10px; cursor: pointer; border: none; background: none; font-size: 18px;">😊</button>

                        <!-- Display saved reaction -->
                        <div class="chosen-reaction" style="margin-top: 5px; font-size: 18px;">
                            ${msg.reaction || ""}
                        </div>
                    </div>
                `;
            }).join('');

            messagesContainer.innerHTML = messageHTML;

            // 👉 Reaction trigger logic
            document.querySelectorAll(".reaction-trigger").forEach(btn => {
                btn.addEventListener("click", (e) => {
                    const parent = e.target.closest(".message");

                    // Remove old panel if it exists
                    const oldPanel = parent.querySelector(".reaction-panel");
                    if (oldPanel) oldPanel.remove();

                    // Create new panel
                    const panel = document.createElement("div");
                    panel.classList.add("reaction-panel");
                    panel.style.cssText = `
                        display: flex; gap: 5px; position: absolute; 
                        bottom: 35px; left: 50px; background: #fff; 
                        border: 1px solid #ddd; border-radius: 20px; 
                        padding: 5px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                    `;
                    panel.innerHTML = `
                        <span class="reaction-option" data-reaction="👍">👍</span>
                        <span class="reaction-option" data-reaction="❤️">❤️</span>
                        <span class="reaction-option" data-reaction="😂">😂</span>
                        <span class="reaction-option" data-reaction="😮">😮</span>
                        <span class="reaction-option" data-reaction="😢">😢</span>
                        <span class="reaction-option" data-reaction="😡">😡</span>
                    `;

                    parent.appendChild(panel);

                    // 👉 Handle selection
                    panel.querySelectorAll(".reaction-option").forEach(opt => {
                        opt.addEventListener("click", async (ev) => {
                            const reaction = ev.target.dataset.reaction;
                            const chosen = parent.querySelector(".chosen-reaction");
                            const messageId = parent.dataset.id;

                            chosen.innerText = reaction; // show chosen reaction
                            panel.remove(); // close panel

                            // Save reaction to backend
                            try {
                                await fetch(`${BASE_URL}/api/messages/${messageId}/react`, {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ reaction })
                                });
                            } catch (err) {
                                console.error("Error saving reaction:", err);
                            }
                        });
                    });
                });
            });
        })
        .catch(err => {
            console.error("Error loading messages:", err);
            messagesContainer.innerHTML = `<p>Failed to load messages.</p>`;
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
