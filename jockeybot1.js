let targetGroupId = 16934849; // Hedef oda ID
let botCommands = ['!j race', '!jockey race', '!jockey race <3', '!j race 🍀']; // Rastgele seçilecek komutlar
let client = PalringoWebConnection;
let lastFishTimestamp = Date.now();
let isCooldownActive = false;
let commandCounter = 0; // BURAYA DOKUNMA !!!
let maxCommandLimit = 99999;
let zaman = 33500; // 32500-34000 ARASINDA TUT

let _sendMessage = (targetId, content, isGroup) => {
  let packet = {
    body: {
      recipient: targetId,
      isGroup: isGroup,
      mimeType: 'text/plain',
      data: new TextEncoder().encode(content).buffer,
      flightId: Math.random().toString(36).substring(7),
      metadata: undefined,
      embeds: undefined,
    },
  };
  return client.socket.emit('message send', packet);
};

let sendGroupMessage = (targetId, content) => _sendMessage(targetId, content, true);
let sendPrivateMessage = (targetId, content) => _sendMessage(targetId, content, false);

let getRandomCommand = () => {
  return botCommands[Math.floor(Math.random() * botCommands.length)];
};

client.socket.on('message send', async function (data) {
  let message = data.body;
  message.text = new TextDecoder().decode(message.data);
  let targetGroupId = message.recipient;

  // --------------------------------------------
  // FISH
  // --------------------------------------------
  if (
    message.originator === 80277459 &&
    (message.text.includes('Energised Race consumed, the Channel') ||
     message.text.includes('تم استخدام سباق قوي لهذا الميدان'))
  ) {
    console.warn('Fish doldu', message.recipient);

    if (!isCooldownActive) {
      isCooldownActive = true;

      setTimeout(() => {
        commandCounter++;
        let randomCommand = getRandomCommand();
        console.warn(`${commandCounter}. komut gönderiliyor: ${randomCommand}`);
        sendGroupMessage(targetGroupId, randomCommand);
        lastFishTimestamp = Date.now();

        if (commandCounter >= maxCommandLimit) {
          console.warn(`${maxCommandLimit} komut gönderildi, kod durduruluyor.`);
          return;
        }

        isCooldownActive = false;
      }, zaman);
    } else {
      console.warn('Zaman kilidi aktif, işlem yapılmıyor.');
    }
  }

  // --------------------------------------------
  // 🍀🍀 algılayıcı
  // --------------------------------------------
  if (message.originator === 72985614 && message.text.includes('🍀🍀')) {
    console.warn('İkinci koşul tetiklendi:', message.text);
    sendGroupMessage(targetGroupId, '!j view');
  }
});
