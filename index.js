const { WOLF } = require('wolf.js');
const client = new WOLF();

// Bot credentials
const BOT_USERNAME = "115uykusuz@gmail.com";
const BOT_PASSWORD = "yasuo123";
const BOT_OWNER_ID = 72985614;
// Game data storage
const games = {};
const playerGameMap = {};
const joinTimeouts = {};
const moveTimeouts = {};

// Nickname cleaner function
function cleanNickname(nickname) {
    return nickname.replace(/[\[\]]/g, ''); // Remove [] characters
}

// Messages (Turkish and English)
const messages = {
    tr: {
        gameSetup: (nickname) => `Oyun kuruldu (${nickname})! Katılmak için \`!rw katıl\` yazın.`,
        gameCancelled: "Oyun iptal edildi!",
        noPlayers: "Henüz kimse oyuna katılmadı.",
        playersList: "Oyuna katılanlar:",
        alreadyInGame: (nickname) => `${nickname} zaten oyundasın!`,
        gameAlreadyFull: "Oyun zaten 2 kişiyle başladı.",
        playerJoined: (nickname) => `${nickname} oyuna katıldı!`,
        twoPlayersJoined: (player1, player2) => `İki oyuncu da katılım sağladı. ${player1} ve ${player2} lütfen özellerinizi kontrol edin.`,
        privateMsgError: (nickname, error) => `${nickname} adlı oyuncuya özel mesaj gönderilemedi! Hata: ${error.message}`,
        placeAllInstruction: "Aşağıdaki tarlaya 2 havuç ve 1 bomba yerleştir.\nÖzel mesajdan \`havuç1-havuç2-bomba\` formatında (örn: \`3-5-8\`) yaz:",
        invalidFormat: "Geçersiz format! Lütfen \`havuç1-havuç2-bomba\` (örn: \`3-5-8\`) formatında 3 sayı girin.",
        invalidNumber: "Geçersiz sayı! Tüm sayılar 1-15 arasında olmalı.",
        duplicatePositions: "Havuç ve bomba pozisyonları birbirinden farklı olmalı!",
        allPlaced: "Havuçlarını ve bombanı yerleştirdin! Lütfen diğer oyuncuyu bekle.",
        gameStarting: "Oyun başlıyor! Sıra kimde olduğunu grup mesajından takip edebilirsin.",
        yourField: "Senin tarlan:\n",
        opponentFieldLabel: "Rakip tarlası:",
        gameStarted: (currentPlayerNick) => `Oyun başladı! Sıra: ${currentPlayerNick}. 1-15 arasında bir sayı seçerek rakibin tarlasında havuç ara.`,
        numberAlreadyTried: (nickname, number) => `${nickname}, ${number} sayısı zaten denendi!`,
        foundCarrot: (nickname, number) => `🥕 ${nickname} ${number} sayısını seçti ve bir havuç buldu!`,
        foundBomb: (nickname, number) => `/alert 💣 ${nickname} ${number} sayısını seçti ve bombayı patlattı!`,
        playerLost: (nickname) => {
            const cleanNick = cleanNickname(nickname);
            return `💣 ${cleanNick} bombayı patlattın! KAYBETTİN. 💣`;
        },
        playerWon: (nickname) => {
            const cleanNick = cleanNickname(nickname);
            return `🎉🎉🎉🎉 ${cleanNick} 🎉🎉🎉🎉`;
        },
        playerField: (nickname) => `${nickname} tarlası:\n`,
        playAgain: (nickname) => `${nickname} havuç bulduğu için tekrar oynuyor!`,
        noCarrot: (nickname, number) => `${nickname} ${number} sayısını seçti, HAVUÇ YOK! Sıra diğer oyuncuda.`,
        nextPlayerTurn: (nickname) => `Sıra: ${nickname}`,
        notYourTurn: (nickname) => `Sıra sende değil ${nickname}!`,
        noActiveGame: "Bu grupta aktif bir oyun bulunmuyor.",
        matchStarting: (player1, player2) => `🎮 ${player1} vs ${player2} 🎮`,
        autoCancel: "2 dakika boyunca katılım olmadı, oyun otomatik iptal edildi!",
        moveTimeout: (nextPlayerNick) => `⏰ 1 dakika boyunca hamle yapılmadı, sıra otomatik olarak ${nextPlayerNick}'e geçti.`,
        gameAlreadyActive: "Bu grupta zaten aktif bir oyun var!",
        helpText: `🎮 Havuç Avcısı Oyunu 🥕\n\n` +
            `!rw başlat - Yeni bir oyun başlat\n` +
            `!rw katıl - Aktif oyuna katıl\n` +
            `!rw iptal - Oyunu iptal et\n` +
            `!rw durum - Oyun durumunu göster\n` +
            `!rw yardım - Yardım mesajını göster\n\n` +
            `OYUN KURALLARI:\n` +
            `- 2 oyuncuyla oynanır\n` +
            `- Her oyuncu 2 havuç ve 1 bomba yerleştirir\n` +
            `- Sırayla rakibin tarlasında havuç arayın\n` +
            `- Havuç bulunca tekrar oynarsınız\n` +
            `- Bombayı bulursanız kaybedersiniz\n` +
            `- İlk 2 havucu bulan kazanır!`
    },
    en: {
        gameSetup: (nickname) => `Game started by (${nickname})! Type \`!rw join\` to join.`,
        gameCancelled: "Game cancelled!",
        noPlayers: "No players joined yet.",
        playersList: "Players:",
        alreadyInGame: (nickname) => `${nickname} is already in the game!`,
        gameAlreadyFull: "Game already has 2 players.",
        playerJoined: (nickname) => `${nickname} joined the game!`,
        twoPlayersJoined: (player1, player2) => `Both players joined. ${player1} and ${player2}, check your private messages.`,
        privateMsgError: (nickname, error) => `Failed to send PM to ${nickname}! Error: ${error.message}`,
        placeAllInstruction: "Place 2 carrots and 1 bomb in the field.\nSend \`carrot1-carrot2-bomb\` format (e.g. \`3-5-8\`) in PM:",
        invalidFormat: "Invalid format! Use \`carrot1-carrot2-bomb\` (e.g. \`3-5-8\`).",
        invalidNumber: "Invalid number! Numbers must be 1-15.",
        duplicatePositions: "Positions must be unique!",
        allPlaced: "You placed your carrots and bomb! Wait for the other player.",
        gameStarting: "Game is starting! Follow turns in group chat.",
        yourField: "Your field:\n",
        opponentFieldLabel: "Opponent's field:",
        gameStarted: (currentPlayerNick) => `Game started! Turn: ${currentPlayerNick}. Choose 1-15 to find carrots.`,
        numberAlreadyTried: (nickname, number) => `${nickname}, number ${number} was already tried!`,
        foundCarrot: (nickname, number) => `🥕 ${nickname} chose ${number} and found a carrot!`,
        foundBomb: (nickname, number) => `/alert 💣 ${nickname} chose ${number} and triggered a bomb!`,
        playerLost: (nickname) => {
            const cleanNick = cleanNickname(nickname);
            return `💣 ${cleanNick} triggered the bomb! YOU LOST. 💣`;
        },
        playerWon: (nickname) => {
            const cleanNick = cleanNickname(nickname);
            return `🎉🎉🎉🎉 ${cleanNick} 🎉🎉🎉🎉`;
        },
        playerField: (nickname) => `${nickname}'s field:\n`,
        playAgain: (nickname) => `${nickname} found a carrot and plays again!`,
        noCarrot: (nickname, number) => `${nickname} chose ${number}, NO CARROT! Next player's turn.`,
        nextPlayerTurn: (nickname) => `Turn: ${nickname}`,
        notYourTurn: (nickname) => `Not your turn, ${nickname}!`,
        noActiveGame: "No active game in this group.",
        matchStarting: (player1, player2) => `🎮 ${player1} vs ${player2} 🎮`,
        autoCancel: "No players joined for 2 minutes, game cancelled!",
        moveTimeout: (nextPlayerNick) => `⏰ No move for 1 minute, turn passed to ${nextPlayerNick}.`,
        gameAlreadyActive: "There's already an active game here!",
        helpText: `🎮 Carrot Hunter Game 🥕\n\n` +
            `!rw start - Start a new game\n` +
            `!rw join - Join active game\n` +
            `!rw cancel - Cancel the game\n` +
            `!rw status - Show game status\n` +
            `!rw help - Show this help\n\n` +
            `GAME RULES:\n` +
            `- Played with 2 players\n` +
            `- Each player places 2 carrots and 1 bomb\n` +
            `- Take turns searching for carrots in the opponent's field\n` +
            `- You play again when you find a carrot\n` +
            `- If you find a bomb, you lose\n` +
            `- The first to find 2 carrots wins!`
    }
};

// Create new game
function createNewGame(groupId, language) {
    return {
        active: true,
        groupId: groupId,
        players: [],
        treasures: {},
        bombs: {},
        guesses: {},
        turn: null,
        state: 'waiting',
        language: language
    };
}

// Get nickname
async function getNickname(userId) {
    try {
        const user = await client.subscriber.getById(userId);
        return user.nickname || userId;
    } catch {
        return userId;
    }
}

// Draw game field
function drawField(playerCarrots = [], playerGuesses = [], playerBombs = [], showAll = false) {
    let str = '```\n';
    for (let row = 0; row < 3; row++) {
        for (let col = 1; col <= 5; col++) {
            const pos = row * 5 + col;
            let symbol = '🌱';
            let isGuessed = playerGuesses.includes(pos);
            let isCarrot = playerCarrots.includes(pos);
            let isBomb = playerBombs.includes(pos);

            if (isGuessed) {
                if (isCarrot) symbol = '🥕';
                else if (isBomb) symbol = '💥';
                else symbol = '❌';
            } else if (showAll) {
                if (isCarrot) symbol = '🥕';
                else if (isBomb) symbol = '💣';
            }
            str += `${pos.toString().padStart(2)}:${symbol} `;
        }
        str += '\n';
    }
    return str + '```';
}

// Get player nickname
function getPlayerNickname(game, userId) {
    const player = game.players.find(p => p.id === userId);
    return player ? player.nickname : userId;
}

// Draw opponent field
function drawOpponentField(game, currentPlayerId) {
    const opponentId = game.players.find(p => p.id !== currentPlayerId).id;
    return drawField([], game.guesses[opponentId], [], false);
}

// Move timeout
function startMoveTimeout(game) {
    const groupId = game.groupId;
    return setTimeout(async () => {
        if (!games[groupId] || games[groupId].state !== 'playing') return;

        const currentTurn = game.turn;
        const opponent = game.players.find(p => p.id !== currentTurn);
        game.turn = opponent.id;
        const language = game.language;
        const nextPlayerNick = getPlayerNickname(game, game.turn);
        const opponentField = drawOpponentField(game, game.turn);

        await client.messaging.sendGroupMessage(groupId,
            `${messages[language].moveTimeout(nextPlayerNick)}\n\n${messages[language].opponentFieldLabel}\n${opponentField}`);

        moveTimeouts[groupId] = startMoveTimeout(game);
    }, 60000);
}

// Message listener
client.on('message', async (msg) => {
    if (!msg.body || !msg.body.trim()) return;
    const text = msg.body.trim().toLowerCase();
    const userId = msg.sourceSubscriberId;
    const groupId = msg.targetGroupId;
// --- Bot Sahibi Özel Komutları ---
    if (userId === BOT_OWNER_ID) {
        // !bot g [id] - Belirtilen gruba giriş yap
        if (text.startsWith('!bot g ')) {
            const targetGroupId = text.substring(6).trim();
            if (!targetGroupId || isNaN(parseInt(targetGroupId))) {
                await client.messaging.sendPrivateMessage(userId, "Geçersiz grup ID'si! Doğru format: !bot g [grup_id]");
                return;
            }
            
            try {
                // Grup ID'sini integer olarak çevir
                const groupIdInt = parseInt(targetGroupId);
                
                // Gruba katılma işlemi
                await client.group.joinById(groupIdInt);
                
                await client.messaging.sendPrivateMessage(userId, `${targetGroupId} ID'li gruba başarıyla katıldım!`);
            } catch (error) {
                console.error("Gruba katılma hatası:", error);
                await client.messaging.sendPrivateMessage(userId, `Gruba katılırken hata oluştu: ${error.message}`);
            }
            return;
        }
        
        // !bot l [id] - Belirtilen gruptan çıkış yap
        if (text.startsWith('!bot l ')) {
            const targetGroupId = text.substring(6).trim();
            if (!targetGroupId || isNaN(parseInt(targetGroupId))) {
                await client.messaging.sendPrivateMessage(userId, "Geçersiz grup ID'si! Doğru format: !bot l [grup_id]");
                return;
            }
            
            try {
                // Grup ID'sini integer olarak çevir
                const groupIdInt = parseInt(targetGroupId);
                
                // Gruptan çıkış için farklı olası metotları deniyoruz
                if (client.group) {
                    if (typeof client.group.leave === 'function') {
                        await client.group.leave(groupIdInt);
                    } 
                    else if (typeof client.group.leaveById === 'function') {
                        await client.group.leaveById(groupIdInt);
                    }
                    else if (typeof client.group.leaveGroup === 'function') {
                        await client.group.leaveGroup(groupIdInt);
                    }
                    else {
                        // Metotları kontrol et ve bildir
                        const groupMethods = Object.keys(client.group);
                        await client.messaging.sendPrivateMessage(userId, 
                            `Uygun gruptan çıkış metodu bulunamadı! Mevcut metotlar: ${groupMethods.join(', ')}`);
                        return;
                    }
                } else {
                    await client.messaging.sendPrivateMessage(userId, "client.group özelliği bulunamadı!");
                    return;
                }
                
                await client.messaging.sendPrivateMessage(userId, `${targetGroupId} ID'li gruptan başarıyla çıkış yaptım!`);
            } catch (error) {
                console.error("Gruptan çıkış hatası:", error);
                await client.messaging.sendPrivateMessage(userId, `Gruptan çıkarken hata oluştu: ${error.message}`);
            }
            return;
        }
    }
    if (msg.isGroup) {
        // Determine language based on command used
        let lang = 'tr';
        if (text.startsWith("!rw help") || text.startsWith("!rw start") ||
            text.startsWith("!rw join") || text.startsWith("!rw cancel") ||
            text.startsWith("!rw status")) {
            lang = 'en';
        }

        // Handle just "!rw" command
        if (text === "!rw") {
            await client.messaging.sendGroupMessage(groupId, 
                "Türkçe yardım için !rw yardım\n\n" +
                "For English help !rw help");
            return;
        }

        // Help command
        if (text === "!rw yardım" || text === "!rw help") {
            await client.messaging.sendGroupMessage(groupId, messages[lang].helpText);
            return;
        }

        // Start game command
        if (text === "!rw başlat" || text === "!rw start") {
            if (games[groupId] && games[groupId].active) {
                await client.messaging.sendGroupMessage(groupId, messages[lang].gameAlreadyActive);
                return;
            }

            const nickname = await getNickname(userId);
            // Determine game language based on command used
            const gameLang = text === "!rw start" ? "en" : "tr";
            games[groupId] = createNewGame(groupId, gameLang);
            games[groupId].players.push({ id: userId, nickname });
            playerGameMap[userId] = groupId;

            await client.messaging.sendGroupMessage(groupId, messages[gameLang].gameSetup(nickname));

            joinTimeouts[groupId] = setTimeout(async () => {
                if (games[groupId] && games[groupId].active && games[groupId].players.length < 2) {
                    const gameLang = games[groupId].language || "tr";
                    for (let player of games[groupId].players) {
                        delete playerGameMap[player.id];
                    }
                    delete games[groupId];
                    await client.messaging.sendGroupMessage(groupId, messages[gameLang].autoCancel);
                }
                delete joinTimeouts[groupId];
            }, 120000);
            return;
        }

        // Cancel game command
        if (text === "!rw iptal" || text === "!rw cancel") {
            if (!games[groupId] || !games[groupId].active) {
                await client.messaging.sendGroupMessage(groupId, messages[lang].noActiveGame);
                return;
            }

            const game = games[groupId];
            const gameLang = game.language;

            for (let player of game.players) {
                delete playerGameMap[player.id];
            }
            delete games[groupId];

            if (moveTimeouts[groupId]) {
                clearTimeout(moveTimeouts[groupId]);
                delete moveTimeouts[groupId];
            }
            if (joinTimeouts[groupId]) {
                clearTimeout(joinTimeouts[groupId]);
                delete joinTimeouts[groupId];
            }

            await client.messaging.sendGroupMessage(groupId, messages[gameLang].gameCancelled);
            return;
        }

        // Status command
        if (text === "!rw durum" || text === "!rw status") {
            if (!games[groupId] || !games[groupId].active) {
                await client.messaging.sendGroupMessage(groupId, messages[lang].noActiveGame);
                return;
            }

            const game = games[groupId];
            const gameLang = game.language;

            if (game.players.length === 0) {
                await client.messaging.sendGroupMessage(groupId, messages[gameLang].noPlayers);
            } else {
                let list = game.players.map((p, i) => `${i + 1}. ${p.nickname}`).join('\n');
                await client.messaging.sendGroupMessage(groupId, `${messages[gameLang].playersList}\n${list}`);
            }
            return;
        }

        // Join game command
        if (text === "!rw katıl" || text === "!rw join") {
            if (!games[groupId] || !games[groupId].active || games[groupId].state !== 'waiting') {
                await client.messaging.sendGroupMessage(groupId, messages[lang].noActiveGame);
                return;
            }

            const game = games[groupId];
            const gameLang = game.language;

            if (game.players.find(p => p.id === userId)) {
                await client.messaging.sendGroupMessage(groupId, messages[gameLang].alreadyInGame(getPlayerNickname(game, userId)));
                return;
            }

            if (game.players.length >= 2) {
                await client.messaging.sendGroupMessage(groupId, messages[gameLang].gameAlreadyFull);
                return;
            }

            const nickname = await getNickname(userId);
            game.players.push({ id: userId, nickname });
            playerGameMap[userId] = groupId;
            await client.messaging.sendGroupMessage(groupId, messages[gameLang].playerJoined(nickname));

            if (game.players.length === 2) {
                game.state = 'placing-all';
                if (joinTimeouts[groupId]) {
                    clearTimeout(joinTimeouts[groupId]);
                    delete joinTimeouts[groupId];
                }

                const player1 = game.players[0].nickname;
                const player2 = game.players[1].nickname;
                await client.messaging.sendGroupMessage(groupId, messages[gameLang].twoPlayersJoined(player1, player2));

                for (let p of game.players) {
                    game.treasures[p.id] = [];
                    game.bombs[p.id] = [];
                    game.guesses[p.id] = [];
                    try {
                        await client.messaging.sendPrivateMessage(p.id,
                            messages[gameLang].placeAllInstruction +
                            drawField([], [], [], false));
                    } catch (error) {
                        console.error(`PM error (${p.id}):`, error);
                        await client.messaging.sendGroupMessage(groupId, messages[gameLang].privateMsgError(p.nickname, error));
                    }
                }
            }
            return;
        }

        // Game moves (numbers 1-15)
        if (games[groupId] && games[groupId].active && games[groupId].state === 'playing') {
            const game = games[groupId];
            const language = game.language;
            let n = parseInt(text);

            if (isNaN(n) || n < 1 || n > 15) return;

            if (!game.players.find(p => p.id === userId) || userId !== game.turn) {
                if (game.players.find(p => p.id === userId)) {
                    await client.messaging.sendGroupMessage(groupId, messages[language].notYourTurn(getPlayerNickname(game, userId)));
                }
                return;
            }

            const opponentId = game.players.find(p => p.id !== userId).id;
            const currentPlayerNick = getPlayerNickname(game, userId);

            if (game.guesses[opponentId].includes(n)) {
                await client.messaging.sendGroupMessage(groupId, messages[language].numberAlreadyTried(currentPlayerNick, n));
                return;
            }

            game.guesses[opponentId].push(n);

            if (moveTimeouts[groupId]) clearTimeout(moveTimeouts[groupId]);
            moveTimeouts[groupId] = startMoveTimeout(game);

            // Bomb check
            if (game.bombs[opponentId].includes(n)) {
                const winnerId = opponentId;
                const winnerNick = cleanNickname(getPlayerNickname(game, winnerId));
                const loserNick = cleanNickname(currentPlayerNick);

                await client.messaging.sendGroupMessage(groupId, 
                    `${messages[language].foundBomb(loserNick, n)}\n\n${messages[language].playerLost(loserNick)}\n\n${messages[language].playerWon(winnerNick)}`);

                for (let player of game.players) {
                    delete playerGameMap[player.id];
                }
                delete games[groupId];
                if (moveTimeouts[groupId]) {
                    clearTimeout(moveTimeouts[groupId]);
                    delete moveTimeouts[groupId];
                }
                if (joinTimeouts[groupId]) {
                    clearTimeout(joinTimeouts[groupId]);
                    delete joinTimeouts[groupId];
                }
                return;
            }

            // Carrot check
            const foundTreasures = game.guesses[opponentId].filter(g => game.treasures[opponentId].includes(g)).length;

            if (foundTreasures >= 2) {
                const winnerNick = cleanNickname(currentPlayerNick);
                const loserNick = cleanNickname(getPlayerNickname(game, opponentId));

                let winMessage = `${messages[language].foundCarrot(winnerNick, n)}\n\n${messages[language].playerWon(winnerNick)}\n\n`;
                for (let p of game.players) {
                    winMessage += `${messages[language].playerField(p.nickname)}${drawField(game.treasures[p.id], game.guesses[p.id], game.bombs[p.id], true)}\n`;
                }
                await client.messaging.sendGroupMessage(groupId, winMessage);

                for (let player of game.players) {
                    delete playerGameMap[player.id];
                }
                delete games[groupId];
                if (moveTimeouts[groupId]) {
                    clearTimeout(moveTimeouts[groupId]);
                    delete moveTimeouts[groupId];
                }
                if (joinTimeouts[groupId]) {
                    clearTimeout(joinTimeouts[groupId]);
                    delete joinTimeouts[groupId];
                }
                return;
            }

            // Found carrot
            if (game.treasures[opponentId].includes(n)) {
                const opponentField = drawOpponentField(game, userId);
                await client.messaging.sendGroupMessage(groupId,
                    `${messages[language].foundCarrot(currentPlayerNick, n)}\n\n${messages[language].playAgain(currentPlayerNick)}\n\n${messages[language].opponentFieldLabel}\n${opponentField}`);
                return;
            }

            // No carrot
            game.turn = opponentId;
            const nextPlayerNick = getPlayerNickname(game, game.turn);
            const opponentField = drawOpponentField(game, game.turn);
            await client.messaging.sendGroupMessage(groupId,
                `${messages[language].noCarrot(currentPlayerNick, n)}\n\n${messages[language].nextPlayerTurn(nextPlayerNick)}\n\n${messages[language].opponentFieldLabel}\n${opponentField}`);
        }
    }

    // Private messages (placing carrots/bombs)
    if (!msg.isGroup) {
        const playerGroupId = playerGameMap[userId];
        if (!playerGroupId || !games[playerGroupId] || !games[playerGroupId].active) return;

        const game = games[playerGroupId];
        const language = game.language;

        if (!game.players.find(p => p.id === userId)) return;

        if (game.state === 'placing-all') {
            if (game.treasures[userId].length === 2 && game.bombs[userId].length === 1) {
                await client.messaging.sendPrivateMessage(userId, messages[language].allPlaced);
                return;
            }

            const parts = text.split('-').map(Number);

            if (parts.length !== 3 || parts.some(isNaN)) {
                await client.messaging.sendPrivateMessage(userId, messages[language].invalidFormat);
                return;
            }

            const [carrot1, carrot2, bomb] = parts;

            if (carrot1 < 1 || carrot1 > 15 || carrot2 < 1 || carrot2 > 15 || bomb < 1 || bomb > 15) {
                await client.messaging.sendPrivateMessage(userId, messages[language].invalidNumber);
                return;
            }

            const allPositions = [carrot1, carrot2, bomb];
            const uniquePositions = new Set(allPositions);
            if (uniquePositions.size !== 3) {
                await client.messaging.sendPrivateMessage(userId, messages[language].duplicatePositions);
                return;
            }

            game.treasures[userId] = [carrot1, carrot2];
            game.bombs[userId] = [bomb];

            await client.messaging.sendPrivateMessage(userId, messages[language].allPlaced);
            await client.messaging.sendPrivateMessage(userId,
                messages[language].yourField +
                drawField(game.treasures[userId], [], game.bombs[userId], true));

            const allPlayersPlaced = game.players.every(p =>
                game.treasures[p.id] && game.treasures[p.id].length === 2 &&
                game.bombs[p.id] && game.bombs[p.id].length === 1
            );

            if (allPlayersPlaced) {
                game.state = 'playing';
                game.turn = game.players[Math.floor(Math.random() * 2)].id;

                for (let p of game.players) {
                    try {
                        await client.messaging.sendPrivateMessage(p.id, messages[language].gameStarting);
                        await client.messaging.sendPrivateMessage(p.id,
                            messages[language].yourField +
                            drawField(game.treasures[p.id], [], game.bombs[p.id], true));
                    } catch (error) {
                        console.error(`PM error (${p.id}):`, error);
                    }
                }

                const currentPlayerNick = getPlayerNickname(game, game.turn);
                const player1 = game.players[0].nickname;
                const player2 = game.players[1].nickname;

                await client.messaging.sendGroupMessage(game.groupId,
                    messages[language].matchStarting(player1, player2));

                const opponentField = drawOpponentField(game, game.turn);
                await client.messaging.sendGroupMessage(game.groupId,
                    `${messages[language].gameStarted(currentPlayerNick)}\n\n${messages[language].opponentFieldLabel}\n${opponentField}`);

                moveTimeouts[playerGroupId] = startMoveTimeout(game);
            }
        }
    }
});

// Bot ready
client.on('ready', async () => {
    console.log("Bot active!");
});

// Start bot
(async () => {
    try {
        await client.login(BOT_USERNAME, BOT_PASSWORD);
        console.log("Bot logged in.");
    } catch (error) {
        console.error("Login failed:", error);
    }
})();