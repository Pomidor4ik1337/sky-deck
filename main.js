// Данные мобов
const MOBS = [
    { id: 'dragon', name: 'Дракон Края', hp: 10, str: 10, icon: '🐉', isBoss: true },
    { id: 'wither', name: 'Визер', hp: 8, str: 6, icon: '💀', isBoss: true },
    { id: 'iron_golem', name: 'Жел. Голем', hp: 7, str: 4, icon: '🤖' },
    { id: 'snow_golem', name: 'Снег. Голем', hp: 5, str: 0, icon: '☃️' },
    { id: 'skeleton', name: 'Скелет', hp: 3, str: 4, icon: '🏹' },
    { id: 'creeper', name: 'Крипер', hp: 3, str: 3, icon: '💥' },
    { id: 'fox', name: 'Лиса', hp: 3, str: 3, icon: '🦊' },
    { id: 'zombie', name: 'Зомби', hp: 2, str: 1, icon: '🧟' },
    { id: 'frog', name: 'Лягушка', hp: 2, str: 1, icon: '🐸' },
    { id: 'axolotl', name: 'Аксолотль', hp: 1, str: 1, icon: '🦎' },
    { id: 'chicken', name: 'Курица', hp: 1, str: 0, icon: '🐔' },
    { id: 'spider', name: 'Паук', hp: 3, str: 2, icon: '🕷️' },
    { id: 'enderman', name: 'Эндермен', hp: 6, str: 5, icon: '👾' },
    { id: 'blaze', name: 'Ифрит', hp: 4, str: 5, icon: '🔥' },
    { id: 'witch', name: 'Ведьма', hp: 4, str: 3, icon: '🧙‍♀️' },
    { id: 'piglin', name: 'Пиглин', hp: 4, str: 4, icon: '🐷' }
];

// Типы блоков
const BLOCKS = [
    { id: 'iron', name: 'ЖЕЛЕЗНЫЙ БЛОК (СИЛА ⚔️)', icon: '⚙️', color: '#777777' },
    { id: 'redstone', name: 'РЕДСТОУН БЛОК (HP ❤️)', icon: '🔴', color: '#ff3333' }
];

// Система рангов
const RANKS = [
    { min: 0, max: 299, name: 'Нуб III', class: 'rank-noob' },
    { min: 300, max: 599, name: 'Любитель II', class: 'rank-amateur' },
    { min: 600, max: 999, name: 'Профи I', class: 'rank-pro' },
    { min: 1000, max: 1499, name: 'Мастер', class: 'rank-master' },
    { min: 1500, max: Infinity, name: 'Легенда', class: 'rank-legend' }
];

// Состояние приложения
const state = {
    user: {
        nickname: localStorage.getItem('skydeck_nickname') || ('Игрок_' + Math.floor(Math.random() * 1000)),
        elo: parseInt(localStorage.getItem('skydeck_elo') || '0', 10),
        coins: parseInt(localStorage.getItem('skydeck_coins') || '500', 10),
        isVerified: localStorage.getItem('skydeck_verified') === 'true'
    },
    game: {
        active: false,
        mode: 'bot',
        bet: 0,
        round: 0,
        playerScore: 0,
        oppScore: 0,
        currentBlock: null,
        playerHand: [],
        oppHand: [],
        playerCard: null,
        oppCard: null,
        isProcessing: false,
        isHost: false
    }
};

let peer = null;
let conn = null;

const screens = {
    main: document.getElementById('main-menu'),
    game: document.getElementById('game-screen')
};

const modals = {
    modes: document.getElementById('modal-modes'),
    p2p: document.getElementById('modal-p2p')
};

function updateUI() {
    document.getElementById('player-nickname').textContent = state.user.nickname;
    document.getElementById('elo-display').textContent = `${state.user.elo} ЭЛО`;
    document.getElementById('coins-display').textContent = `💰 ${state.user.coins} монет`;

    const rank = RANKS.find(r => state.user.elo >= r.min && state.user.elo <= r.max) || RANKS[0];
    const rankBadge = document.getElementById('rank-badge');
    rankBadge.textContent = rank.name;
    rankBadge.className = `rank-badge ${rank.class}`;

    if (state.user.isVerified) {
        document.getElementById('verified-icon').classList.remove('hidden');
    }

    localStorage.setItem('skydeck_nickname', state.user.nickname);
    localStorage.setItem('skydeck_elo', state.user.elo.toString());
    localStorage.setItem('skydeck_coins', state.user.coins.toString());
    localStorage.setItem('skydeck_verified', state.user.isVerified);
}

function openModal(modal) {
    if (modal) modal.classList.add('active');
}

function closeModal(modal) {
    if (modal) modal.classList.remove('active');
}

document.getElementById('btn-open-modes').addEventListener('click', () => {
    document.getElementById('bet-box').classList.add('hidden');
    openModal(modals.modes);
});

document.querySelectorAll('.close-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const targetId = e.currentTarget.getAttribute('data-close');
        closeModal(document.getElementById(targetId));
    });
});

document.getElementById('btn-change-nickname').addEventListener('click', () => {
    const nick = prompt('Введите новый никнейм:', state.user.nickname);
    if (nick && nick.trim()) {
        state.user.nickname = nick.trim();
        updateUI();
    }
});

document.getElementById('btn-donate').addEventListener('click', () => {
    state.user.isVerified = true;
    state.user.coins += 500;
    updateUI();
    alert('Спасибо за поддержку! +500 монет и статус верификации получены.');
});

document.querySelectorAll('.btn-mode').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const mode = e.currentTarget.dataset.mode;
        const betBox = document.getElementById('bet-box');

        if (mode === 'bets' && betBox.classList.contains('hidden')) {
            betBox.classList.remove('hidden');
            return;
        }

        let bet = 0;
        if (mode === 'bets') {
            bet = parseInt(document.getElementById('bet-input').value, 10) || 0;
            if (bet <= 0 || bet > state.user.coins) {
                alert('Недостаточно монет для такой ставки!');
                return;
            }
        }

        state.game.mode = mode;
        state.game.bet = bet;
        closeModal(modals.modes);

        if (mode === 'bot') {
            startMatch('ИИ Бот Алекс', 'bot');
        } else {
            initPeer();
            openModal(modals.p2p);
        }
    });
});

function initPeer() {
    if (peer) return;
    peer = new Peer();

    peer.on('open', id => {
        document.getElementById('my-peer-id').textContent = id;
    });

    peer.on('connection', c => {
        conn = c;
        state.game.isHost = true;
        setupP2P();
    });
}

document.getElementById('btn-create-room').addEventListener('click', () => {
    document.getElementById('room-code-box').classList.remove('hidden');
});

document.getElementById('btn-join-room').addEventListener('click', () => {
    const code = document.getElementById('join-code-input').value.trim();
    if (!code) {
        alert('Введи код комнаты!');
        return;
    }

    initPeer();
    conn = peer.connect(code);
    state.game.isHost = false;
    setupP2P();
});

function setupP2P() {
    conn.on('open', () => {
        closeModal(modals.p2p);
        if (state.game.isHost) {
            conn.send({
                type: 'START',
                oppName: state.user.nickname,
                mode: state.game.mode,
                bet: state.game.bet
            });
            startMatch('Соперник', state.game.mode);
        }
    });

    conn.on('data', data => {
        if (data.type === 'START') {
            startMatch(data.oppName, data.mode);
        } else if (data.type === 'PLAY_CARD') {
            state.game.oppCard = data.card;
            document.getElementById('opp-played-card-slot').innerHTML = renderCardHTML(data.card);
            checkRoundResult();
        } else if (data.type === 'NEXT_ROUND') {
            applyNextRound(data.block);
        }
    });
}

function shuffle(arr) {
    return [...arr].sort(() => Math.random() - 0.5);
}

function startMatch(oppName, mode) {
    state.game.active = true;
    state.game.round = 0;
    state.game.playerScore = 0;
    state.game.oppScore = 0;

    document.getElementById('opp-name').textContent = oppName;
    document.getElementById('player-score').textContent = '0';
    document.getElementById('opp-score').textContent = '0';

    const deck = shuffle(MOBS);
    state.game.playerHand = deck.slice(0, 7);
    state.game.oppHand = deck.slice(7, 14);

    screens.main.classList.remove('active');
    screens.game.classList.add('active');

    if (mode === 'bot' || state.game.isHost) {
        nextRound();
    }
}

function nextRound() {
    state.game.round++;
    if (state.game.round > 7) {
        return endGame();
    }

    const block = BLOCKS[Math.floor(Math.random() * BLOCKS.length)];
    if (conn) {
        conn.send({ type: 'NEXT_ROUND', block: block });
    }
    applyNextRound(block);
}

function applyNextRound(block) {
    state.game.currentBlock = block;
    state.game.playerCard = null;
    state.game.oppCard = null;
    state.game.isProcessing = false;

    const bInd = document.getElementById('block-indicator');
    document.getElementById('block-name').textContent = block.name;
    bInd.style.borderColor = block.color;
    bInd.querySelector('.block-icon').textContent = block.icon;

    document.getElementById('player-played-card-slot').innerHTML = '';
    document.getElementById('opp-played-card-slot').innerHTML = '';
    document.getElementById('round-status').textContent = `Раунд ${state.game.round} из 7: выберите моба`;

    renderHand();
}

function renderHand() {
    const handUI = document.getElementById('player-hand');
    handUI.innerHTML = '';
    state.game.playerHand.forEach((mob, idx) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = renderCardHTML(mob);
        card.addEventListener('click', () => playCard(idx));
        handUI.appendChild(card);
    });
}

function renderCardHTML(mob) {
    return `
        <span class="card-icon">${mob.icon}</span>
        <span class="card-title">${mob.name}</span>
        <div class="card-stats">
            <span class="stat-hp">❤️${mob.hp}</span>
            <span class="stat-str">⚔️${mob.str}</span>
        </div>
    `;
}

function playCard(index) {
    if (state.game.isProcessing || state.game.playerCard) return;

    state.game.playerCard = state.game.playerHand.splice(index, 1)[0];
    document.getElementById('player-played-card-slot').innerHTML = renderCardHTML(state.game.playerCard);
    renderHand();

    if (conn) {
        conn.send({ type: 'PLAY_CARD', card: state.game.playerCard });
    }

    if (state.game.mode === 'bot') {
        const botIdx = Math.floor(Math.random() * state.game.oppHand.length);
        state.game.oppCard = state.game.oppHand.splice(botIdx, 1)[0];
        document.getElementById('opp-played-card-slot').innerHTML = renderCardHTML(state.game.oppCard);
        setTimeout(evaluateBattle, 1000);
    } else {
        checkRoundResult();
    }
}

function checkRoundResult() {
    if (state.game.playerCard && state.game.oppCard) {
        state.game.isProcessing = true;
        setTimeout(evaluateBattle, 1000);
    }
}

function evaluateBattle() {
    const p = state.game.playerCard;
    const o = state.game.oppCard;
    const block = state.game.currentBlock.id;

    let winner = 'draw';
    if (block === 'redstone') {
        if (p.hp > o.hp) winner = 'player';
        else if (o.hp > p.hp) winner = 'opp';
    } else {
        if (p.str > o.str) winner = 'player';
        else if (o.str > p.str) winner = 'opp';
    }

    if (winner === 'player') {
        state.game.playerScore++;
    } else if (winner === 'opp') {
        state.game.oppScore++;
    }

    document.getElementById('player-score').textContent = state.game.playerScore;
    document.getElementById('opp-score').textContent = state.game.oppScore;

    setTimeout(() => {
        if (state.game.mode === 'bot' || state.game.isHost) {
            nextRound();
        }
    }, 1500);
}

function endGame() {
    let outcome = 'НИЧЬЯ!';
    if (state.game.playerScore > state.game.oppScore) {
        outcome = '🎉 ПОБЕДА!';
        if (state.game.mode === 'ranked') state.user.elo += 100;
        if (state.game.mode === 'bets') state.user.coins += state.game.bet;
    } else if (state.game.playerScore < state.game.oppScore) {
        outcome = 'ПОРАЖЕНИЕ!';
        if (state.game.mode === 'ranked') state.user.elo = Math.max(0, state.user.elo - 50);
        if (state.game.mode === 'bets') state.user.coins = Math.max(0, state.user.coins - state.game.bet);
    }

    updateUI();
    alert(`${outcome}\nСчет: ${state.game.playerScore} - ${state.game.oppScore}`);

    screens.game.classList.remove('active');
    screens.main.classList.add('active');
}

// Инициализация при старте
updateUI();
