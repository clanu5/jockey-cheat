// === Wordlist işlemleri ===
let wordList = [];

async function yasuo() {
  try {
    const response = await fetch('https://raw.githubusercontent.com/clanu5/jockey-cheat/refs/heads/main/5.txt');
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

    const text = await response.text();
    wordList = text
      .split('\n')
      .map(w => w.trim().toLowerCase())
      .filter(w => w.length === 5);

    console.log(`✅ ${wordList.length} kelime yüklendi!`);
  } catch (err) {
    console.error("❌ Wordlist yüklenemedi:", err);
  }
}

yasuo(); // Başlangıçta kelime listesini yükle

// === Wordle çözüm fonksiyonları ===
function parseGameBoardFromHTML(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  const items = Array.from(div.querySelectorAll('.wolfdlebot-mp-game__content__container__item'));
  const grid = [];

  for (let i = 0; i < items.length; i += 5) {
    const row = items.slice(i, i + 5).map(item => {
      return {
        letter: item.textContent.toLowerCase(),
        status: item.classList.contains('correct') ? 'correct' :
                item.classList.contains('incorrect') ? 'present' :
                item.classList.contains('invalid') ? 'absent' : 'empty'
      };
    });
    grid.push(row);
  }

  return grid;
}

function filterPossibleWords(board, words) {
  const guessed = board.filter(row => row.some(cell => cell.status !== 'empty'));
  if (guessed.length === 0) return words;

  return words.filter(word => {
    return guessed.every(row => {
      for (let i = 0; i < 5; i++) {
        const cell = row[i];
        const letter = word[i];

        if (cell.status === 'correct' && letter !== cell.letter) return false;
        if (cell.status === 'present') {
          if (!word.includes(cell.letter) || word[i] === cell.letter) return false;
        }
        if (cell.status === 'absent') {
          const usedElsewhere = guessed.some(r => r.some((c, j) =>
            j !== i && c.letter === cell.letter && (c.status === 'correct' || c.status === 'present')));
          if (!usedElsewhere && word.includes(cell.letter)) return false;
        }
      }
      return true;
    });
  });
}

// === Bot ayarları ===
let targetGroupId = 17159115;
let client = PalringoWebConnection;
let isListening = false;

let lastGuessTime = 0;
let lastGuessWord = '';
let guessCount = 0;
let sending = false;
let waitingForNewGame = false;
let gameOver = false;
let noMessageTimer = null;

const spamWords = ["aaaaa", "ggggg", "ttttt", "ppppp"];
let spamIndex = 0;
let spamInterval = null;

let _sendMessage = (targetId, content, isGroup) => {
  let packet = {
    body: {
      recipient: targetId,
      isGroup: isGroup,
      mimeType: 'text/plain',
      data: new TextEncoder().encode(content).buffer,
      flightId: Math.random().toString(36).substring(7),
    }
  };
  return client.socket.emit('message send', packet);
};

let sendGroupMessage = (targetId, content) => _sendMessage(targetId, content, true);

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendGuessWithCooldown(guess) {
  guess = guess.toLowerCase();

  if (sending) return;
  if (guess === lastGuessWord) return;
  if (guessCount >= 6) return;

  sending = true;

  const now = Date.now();
  const elapsed = now - lastGuessTime;
  const waitTime = Math.max(0, 5000 - elapsed);

  if (waitTime > 0) await delay(waitTime);

  if (waitingForNewGame || gameOver) {
    sending = false;
    return;
  }

  sendGroupMessage(targetGroupId, guess);
  lastGuessTime = Date.now();
  lastGuessWord = guess;
  guessCount++;
  resetNoMessageTimer();

  sending = false;
}

function resetNoMessageTimer() {
  if (noMessageTimer) clearTimeout(noMessageTimer);
  noMessageTimer = setTimeout(() => {
    sendGroupMessage(targetGroupId, "!wo");
    resetNoMessageTimer();
  }, 10000);
}

function startSpamEndGame() {
  if (spamInterval) return;

  spamIndex = 0;
  spamInterval = setInterval(() => {
    if (gameOver || waitingForNewGame) {
      clearInterval(spamInterval);
      spamInterval = null;
      return;
    }
    if (spamIndex >= spamWords.length) spamIndex = 0;
    sendGroupMessage(targetGroupId, spamWords[spamIndex]);
    spamIndex++;
  }, 5000);
}

function stopSpamEndGame() {
  if (spamInterval) {
    clearInterval(spamInterval);
    spamInterval = null;
  }
}

// === Bot dinleyici ===
if (!isListening) {
  client.socket.on('message send', async function (data) {
    let message = data.body;
    message.text = new TextDecoder().decode(message.data).trim();

    if (message.originator === 82641759 && message.recipient === targetGroupId) {
      resetNoMessageTimer();

      if (message.mimeType === "text/plain") {
        const text = message.text.toLowerCase();

        // Kazanıldı
        if (text.includes("that's it")) {
          gameOver = true;
          stopSpamEndGame();
          await delay(2000);
          waitingForNewGame = true;
          await sendGuessWithCooldown("torei");
          waitingForNewGame = false;
          gameOver = false;
          guessCount = 0;
          lastGuessWord = '';
          return;
        }

        // Yeni oyun
        if (text.includes("a new game has begun")) {
          waitingForNewGame = false;
          gameOver = false;
          guessCount = 0;
          lastGuessWord = '';
          stopSpamEndGame();
          await sendGuessWithCooldown("torei");
          return;
        }

        // Ödül verildi
        if (text.includes("and has been awarded")) {
          gameOver = true;
          stopSpamEndGame();
          return;
        }

        // Kanal hiç bilemedi
        if (text.includes("game over") && text.includes("the channel failed to guess")) {
          console.log("💀 Kimse bilemedi. 2 saniye sonra '!wo' gönderiliyor.");
          await delay(2000);
          sendGroupMessage(targetGroupId, "!wo");
          return;
        }
      }

      if (message.mimeType === "text/html") {
        const html = message.text;
        const board = parseGameBoardFromHTML(html);

        let isEmptyBoard = board.every(row => row.every(cell => cell.status === 'empty' && cell.letter === ''));
        if (isEmptyBoard) {
          waitingForNewGame = false;
          gameOver = false;
          guessCount = 0;
          lastGuessWord = '';
          stopSpamEndGame();
          await sendGuessWithCooldown("torei");
          return;
        }

        const candidates = filterPossibleWords(board, wordList);

        if (candidates.length === 0) {
          startSpamEndGame();
          return;
        } else {
          stopSpamEndGame();
          let guess = candidates[0];
          if (guess === lastGuessWord && candidates.length > 1) {
            guess = candidates[1];
          }
          await sendGuessWithCooldown(guess);
        }
      }
    }
  });

  resetNoMessageTimer();
  isListening = true;
}
