document.addEventListener('DOMContentLoaded', () => {
    const BASE_URL = 'https://tellique-backend.onrender.com';

    // Fixed theme toggle functionality
    const themeToggle = document.getElementById('switch'); // Fixed selector
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
                })
                .catch(err => {
                    console.error('Error loading avatar:', err);
                    avatarImg.src = 'assets/images/default-avatar.png';
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
                        }).catch(err => console.error('Error updating avatar:', err));
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
            const usernameDisplay = document.getElementById('username-display');
            if (usernameDisplay) {
                usernameDisplay.textContent = currentUser;
            }
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
            const usernameDisplay = document.getElementById('username-display');
            if (usernameDisplay) {
                usernameDisplay.textContent = currentUser;
            }
            const sentContainer = document.getElementById('sent-messages-container');

            if (sentContainer) {
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
                    })
                    .catch(err => {
                        console.error('Error loading sent messages:', err);
                        sentContainer.innerHTML = `<p>Failed to load sent messages.</p>`;
                    });
            }

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
            const usernameDisplay = document.getElementById('username-display');
            if (usernameDisplay) {
                usernameDisplay.textContent = currentUser;
            }
            const params = new URLSearchParams(window.location.search);
            const recipient = params.get('to');
            if (recipient) {
                const recipientInput = document.getElementById('recipient');
                if (recipientInput) {
                    recipientInput.value = recipient;
                }
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

    // Fixed and improved loadMessages function
    function loadMessages() {
        const messagesContainer = document.getElementById('messages-container');
        if (!messagesContainer || !currentUser) return;

        fetch(`${BASE_URL}/api/messages/inbox/${currentUser}`)
            .then(res => res.json())
            .then(data => {
                if (!data.length) {
                    messagesContainer.innerHTML = `<p style="text-align: center; color: var(--text-color); opacity: 0.7;">No messages yet. Share your username with friends to receive confessions!</p>`;
                    return;
                }

                const messageHTML = data.map(msg => {
                    const avatar = msg.senderAvatar || 'assets/images/default-avatar.png';
                    const currentReaction = msg.reaction || '';
                    
                    return `
                        <div class="message" data-id="${msg._id}" style="position: relative;">
                            <img src="${avatar}" alt="Avatar" 
                                 style="width:40px; height:40px; border-radius:50%; margin-bottom: 0.5rem;" />
                            <h3>From: ${msg.nickname || 'Anonymous Confessor'}</h3>
                            <p style="margin: 1rem 0; line-height: 1.6;">${msg.content}</p>
                            <small style="opacity: 0.7;">${new Date(msg.date).toLocaleString()}</small>
                            
                            <div style="margin-top: 1rem; display: flex; gap: 0.5rem; align-items: center;">
                                <a href="compose.html?to=${msg.from}" class="glow-button small" 
                                   style="padding: 0.5rem 1rem; font-size: 0.8rem;">Reply</a>
                                
                                <!-- Reaction trigger -->
                                <button class="reaction-trigger" 
                                        style="background: none; border: none; font-size: 1.2rem; cursor: pointer; 
                                               padding: 0.5rem; border-radius: 50%; transition: all 0.3s;">
                                    ${currentReaction || '😊'}
                                </button>
                            </div>

                            <!-- Current reaction display -->
                            ${currentReaction ? `<div style="margin-top: 0.5rem; font-size: 1.2rem;">Your reaction: ${currentReaction}</div>` : ''}
                        </div>
                    `;
                }).join('');

                messagesContainer.innerHTML = messageHTML;

                // Add reaction functionality
                document.querySelectorAll(".reaction-trigger").forEach(btn => {
                    btn.addEventListener("click", (e) => {
                        const parent = e.target.closest(".message");
                        const messageId = parent.dataset.id;

                        // Remove existing panel
                        const oldPanel = parent.querySelector(".reaction-panel");
                        if (oldPanel) {
                            oldPanel.remove();
                            return;
                        }

                        // Create reaction panel
                        const panel = document.createElement("div");
                        panel.classList.add("reaction-panel");
                        panel.style.cssText = `
                            position: absolute;
                            bottom: 60px;
                            right: 20px;
                            background: var(--card-bg);
                            border: 1px solid rgba(255,255,255,0.2);
                            border-radius: 25px;
                            padding: 0.5rem;
                            display: flex;
                            gap: 0.5rem;
                            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                            backdrop-filter: blur(10px);
                            z-index: 1000;
                            animation: fadeIn 0.3s ease;
                        `;
                        
                        const reactions = ['👍', '❤️', '😂', '😮', '😢', '😡', '🔥', '💯'];
                        panel.innerHTML = reactions.map(reaction => 
                            `<span class="reaction-option" data-reaction="${reaction}" 
                                   style="cursor: pointer; font-size: 1.5rem; padding: 0.3rem; 
                                          border-radius: 50%; transition: all 0.3s; 
                                          hover: transform: scale(1.2);">${reaction}</span>`
                        ).join('');

                        parent.appendChild(panel);

                        // Handle reaction selection
                        panel.querySelectorAll(".reaction-option").forEach(opt => {
                            opt.addEventListener("click", async (ev) => {
                                const reaction = ev.target.dataset.reaction;
                                
                                // Update UI immediately
                                btn.textContent = reaction;
                                panel.remove();

                                // Update reaction display
                                const existingReactionDiv = parent.querySelector('[style*="Your reaction"]');
                                if (existingReactionDiv) {
                                    existingReactionDiv.innerHTML = `Your reaction: ${reaction}`;
                                } else {
                                    const reactionDiv = document.createElement('div');
                                    reactionDiv.style.cssText = 'margin-top: 0.5rem; font-size: 1.2rem;';
                                    reactionDiv.innerHTML = `Your reaction: ${reaction}`;
                                    parent.appendChild(reactionDiv);
                                }

                                // Save to backend
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

                            // Add hover effect
                            opt.addEventListener('mouseenter', (e) => {
                                e.target.style.transform = 'scale(1.2)';
                                e.target.style.background = 'rgba(255,255,255,0.1)';
                            });
                            
                            opt.addEventListener('mouseleave', (e) => {
                                e.target.style.transform = 'scale(1)';
                                e.target.style.background = 'none';
                            });
                        });

                        // Close panel when clicking outside
                        setTimeout(() => {
                            document.addEventListener('click', function closePanel(e) {
                                if (!panel.contains(e.target) && e.target !== btn) {
                                    panel.remove();
                                    document.removeEventListener('click', closePanel);
                                }
                            });
                        }, 100);
                    });
                });
            })
            .catch(err => {
                console.error("Error loading messages:", err);
                messagesContainer.innerHTML = `<p style="text-align: center; color: var(--text-color); opacity: 0.7;">Failed to load messages. Please try refreshing the page.</p>`;
            });
    }
});