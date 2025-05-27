// --- Game Constants and State ---
const ROOM_TYPES = {
  EMPTY: "empty",
  MONSTER: "monster",
  BOSS: "boss",
  CHEST: "chest",
  TRAP: "trap",
  SAFE: "safe",
  CORPSE: "corpse",
};

const ROOM_PROBABILITIES = [
  { type: ROOM_TYPES.MONSTER, weight: 60 },
  { type: ROOM_TYPES.CHEST, weight: 20 },
  { type: ROOM_TYPES.TRAP, weight: 15 },
  { type: ROOM_TYPES.EMPTY, weight: 5 },
];

const BOSS_ROOM = 50;
const SAFE_ROOMS = [15, 30, 45];
const MESSAGE_DELAY = 2000; // 2 segundos entre mensagens
const UPGRADE_COST = 20; // Custo em ouro para melhorar um atributo

// Estado inicial do jogador
const playerInitialState = {
  hp: 20,
  maxHp: 20,
  ac: 15,
  attackBonus: 5,
  damageBonus: 2,
  potions: 2,
  gold: 0,
  currentRoom: 0,
  lastRoomTypes: [],
};

// Estado global do jogo
let player = { ...playerInitialState };
let currentMonster = null;
let playerDodging = false;
let monsterDodging = false;
let gameRooms = {};
let playerDeaths = {};
let messageQueue = [];
let processingMessages = false;
let waitingForAction = false;
let currentRoomData = { number: 0, type: ROOM_TYPES.EMPTY };

// --- DOM Elements ---
// Screens
const menuScreen = document.getElementById("menu-screen");
const storyScreen = document.getElementById("story-screen");
const gameScreen = document.getElementById("game-screen");
const gameOverScreen = document.getElementById("game-over-screen");
const creditsScreen = document.getElementById("credits-screen");
const aboutScreen = document.getElementById("about-screen");
const instructionsScreen = document.getElementById("instructions-screen");
const strengthenModal = document.getElementById("strengthen-modal");

// Buttons
const startButton = document.getElementById("btn-start");
const continueButton = document.getElementById("btn-continue");
const aboutButton = document.getElementById("btn-about");
const instructionsButton = document.getElementById("btn-instructions");
const deleteDataButton = document.getElementById("btn-delete-data");
const startGameButton = document.getElementById("btn-start-game");
const attackButton = document.getElementById("btn-attack");
const dodgeButton = document.getElementById("btn-dodge");
const leftButton = document.getElementById("btn-left");
const rightButton = document.getElementById("btn-right");
const inventory = document.getElementById("inventory");
const potionButton = document.getElementById("btn-potion");
const restartButton = document.getElementById("btn-restart");
const creditsMenuButton = document.getElementById("btn-credits-menu");
const aboutMenuButton = document.getElementById("btn-about-menu");
const instructionsMenuButton = document.getElementById("btn-instructions-menu");
const specialActionButton = document.getElementById("special-action-button");
const strengthenButton = document.getElementById("btn-strengthen");
const saveContinueButton = document.getElementById("btn-save-continue");
const upgradeAttackButton = document.getElementById("btn-upgrade-attack");
const upgradeDefenseButton = document.getElementById("btn-upgrade-defense");
const upgradeHpButton = document.getElementById("btn-upgrade-hp");
const upgradeDamageButton = document.getElementById("btn-upgrade-damage");
const closeModalButton = document.getElementById("btn-close-modal");
const btnPotion = document.getElementById("btn-potion");

// Game UI
const playerHpEl = document.getElementById("player-hp");
const playerMaxHpEl = document.getElementById("player-max-hp");
const playerAcEl = document.getElementById("player-ac");
const playerDamageEl = document.getElementById("player-damage");
const playerGoldEl = document.getElementById("player-gold");
const potionCountEl = document.getElementById("potion-count");
const monsterNameEl = document.getElementById("monster-name");
const roomNumberEl = document.getElementById("room-number");
const roomElementEl = document.getElementById("room-element");
const imageMonster = document.getElementById("image-monster");
const logAreaEl = document.getElementById("log-area");
const orientationText = document.getElementById("orientation");
const actionButtons = document.getElementById("action-buttons");
const exploreButtons = document.getElementById("explore-buttons");
const specialActionContainer = document.getElementById(
  "special-action-container"
);
const safeRoomButtons = document.getElementById("safe-room-buttons");
const bonusDamageEl = document.getElementById("damage-bonus");

// --- Event Listeners ---
// Menu
startButton.addEventListener("click", startNewGame);
continueButton.addEventListener("click", continueGame);
aboutButton.addEventListener("click", () => showScreen(aboutScreen));
instructionsButton.addEventListener("click", () =>
  showScreen(instructionsScreen)
);
deleteDataButton.addEventListener("click", deleteAllData);

// Story
startGameButton.addEventListener("click", startGameFromStory);

// Game
attackButton.addEventListener("click", playerAttack);
dodgeButton.addEventListener("click", playerDodge);
leftButton.addEventListener("click", () => moveToNextRoom("left"));
rightButton.addEventListener("click", () => moveToNextRoom("right"));
potionButton.addEventListener("click", usePotion);

// Game Over and Credits
restartButton.addEventListener("click", () => showScreen(menuScreen));
creditsMenuButton.addEventListener("click", () => showScreen(menuScreen));
aboutMenuButton.addEventListener("click", () => showScreen(menuScreen));
instructionsMenuButton.addEventListener("click", () => showScreen(menuScreen));

// Safe Room
strengthenButton.addEventListener("click", showStrengthenModal);
saveContinueButton.addEventListener("click", saveAndContinue);

// Strengthen Modal
upgradeAttackButton.addEventListener("click", () => upgradeAttribute("attack"));
upgradeDefenseButton.addEventListener("click", () =>
  upgradeAttribute("defense")
);
upgradeHpButton.addEventListener("click", () => upgradeAttribute("hp"));
upgradeDamageButton.addEventListener("click", () => upgradeAttribute("damage"));
closeModalButton.addEventListener("click", hideStrengthenModal);

//Modal Erase
const eraseModal = document.getElementById("erase-modal");
const confirmOptions = document.getElementById("confirm-options");
const okOptions = document.getElementById("ok-buttons");
const eraseOptions = document.getElementById("erase-options");

// --- Helper Functions ---
function addMessage(message) {
  messageQueue.push(message);

  if (!processingMessages) {
    processMessageQueue();
  }
}

function hideAllActions() {
  actionButtons.style.display = "none";
  exploreButtons.style.display = "none";
  specialActionContainer.style.display = "none";
  safeRoomButtons.style.display = "none";
  btnPotion.disabled = true;
  orientationText.textContent = "";
}

function processMessageQueue() {
  if (messageQueue.length === 0) {
    processingMessages = false;

    // Quando todas as mensagens forem processadas, mostrar os botões apropriados
    if (waitingForAction) {
      showAppropriateActions();
      btnPotion.disabled = false;
    }

    return;
  }

  processingMessages = true;
  const message = messageQueue.shift();
  logAreaEl.textContent = message;

  // Esconder todos os botões enquanto as mensagens estão sendo exibidas
  hideAllActions();

  setTimeout(() => {
    processMessageQueue();
  }, MESSAGE_DELAY);
}

// --- Gerenciamento de Telas ---
function showScreen(screen) {
  // Esconder todas as telas
  menuScreen.style.display = "none";
  storyScreen.style.display = "none";
  gameScreen.style.display = "none";
  gameOverScreen.style.display = "none";
  creditsScreen.style.display = "none";
  aboutScreen.style.display = "none";
  instructionsScreen.style.display = "none";

  // Mostrar a tela solicitada
  screen.style.display = "block";
}

// --- Inicialização do Jogo ---
function initializeGame() {
  // Carregar mortes anteriores
  const deathsData = localStorage.getItem("rpgGameDeaths");
  if (deathsData) {
    playerDeaths = JSON.parse(deathsData);
  } else {
    playerDeaths = {};
  }

  // Carregar ou gerar salas
  const roomsData = localStorage.getItem("rpgGameRooms");
  if (roomsData) {
    gameRooms = JSON.parse(roomsData);
  } else {
    generateAllRooms();
    localStorage.setItem("rpgGameRooms", JSON.stringify(gameRooms));
  }

  // Verificar se existe jogo salvo em sala segura
  const savedGame = localStorage.getItem("rpgGameSafeSave");
  if (savedGame) {
    continueButton.disabled = false;
    continueButton.style.display = "block";
  } else {
    continueButton.disabled = true;
    continueButton.style.display = "none";
  }

  // Iniciar com a tela de menu
  showScreen(menuScreen);
}

function startNewGame() {
  player = { ...playerInitialState };
  currentMonster = null;
  playerDodging = false;
  monsterDodging = false;
  messageQueue = [];
  processingMessages = false;
  waitingForAction = false;

  // Mostrar a tela de história
  showScreen(storyScreen);
}

function continueGame() {
  const savedGame = localStorage.getItem("rpgGameSafeSave");
  if (savedGame) {
    player = JSON.parse(savedGame);

    // Converter a sala segura em sala vazia para evitar salvar novamente
    if (SAFE_ROOMS.includes(player.currentRoom)) {
      gameRooms[player.currentRoom] = ROOM_TYPES.EMPTY;
      localStorage.setItem("rpgGameRooms", JSON.stringify(gameRooms));
    }

    showScreen(gameScreen);
    updateUI();

    // Definir o tipo da sala atual como vazia para garantir que apenas as opções de direção apareçam
    currentRoomData = {
      number: player.currentRoom,
      type: ROOM_TYPES.EMPTY,
    };

    addMessage("Você acorda em um local seguro.");
    waitingForAction = true;
  }
}

function startGameFromStory() {
  showScreen(gameScreen);
  updateUI();
  enterRoom(0);
}

function deleteAllData() {
  eraseModal.style.display = "flex";
  document.getElementById("btn-yes").addEventListener("click", () => {
    confirmOptions.style.display = "none";
    eraseOptions.style.display = "block";
  });

  document.getElementById("btn-erase-yes").addEventListener("click", () => {
    localStorage.removeItem("rpgGameDeaths");
    localStorage.removeItem("rpgGameRooms");
    localStorage.removeItem("rpgGameSafeSave");
    playerDeaths = {};
    generateAllRooms();
    localStorage.setItem("rpgGameRooms", JSON.stringify(gameRooms));
    continueButton.disabled = true;
    continueButton.style.display = "none";
    eraseOptions.style.display = "none";
    okOptions.style.display = "flex";
    document.getElementById("btn-ok").addEventListener("click", () => {
      resetEraseModal();
    });
  });

  document.getElementById("btn-erase-no").addEventListener("click", () => {
    resetEraseModal();
  });
  document.getElementById("btn-no").addEventListener("click", () => {
    resetEraseModal();
  });
}
function resetEraseModal() {
  eraseModal.style.display = "none";
  confirmOptions.style.display = "block";
  eraseOptions.style.display = "none";
  okOptions.style.display = "none";
}

// --- Atualização da UI ---
function updateUI() {
  playerHpEl.textContent = player.hp;
  playerMaxHpEl.textContent = player.maxHp;
  playerAcEl.textContent = player.ac;
  playerDamageEl.textContent = player.attackBonus;
  playerGoldEl.textContent = player.gold;
  potionCountEl.textContent = player.potions;
  //roomNumberEl.textContent = `SALA ${player.currentRoom}`;
  if (currentMonster) {
    monsterNameEl.style.opacity = 1;
    monsterNameEl.textContent = currentMonster.name;
  } else {
    monsterNameEl.textContent = "";
    monsterNameEl.style.opacity = 0;
  }

  // Atualizar classe do elemento da sala
  roomElementEl.className = "room-element";
  if (currentRoomData.type) {
    roomElementEl.classList.add(currentRoomData.type);
  }

  bonusDamageEl.textContent = `${player.damageBonus + 1}-${
    player.damageBonus + 6
  }`;
}

function showCombatActions() {
  if (!processingMessages) {
    orientationText.textContent = "O que fazer?";
    actionButtons.style.display = "flex";
    exploreButtons.style.display = "none";
    specialActionContainer.style.display = "none";
    safeRoomButtons.style.display = "none";
  }
}

function showExploreActions() {
  if (!processingMessages) {
    orientationText.textContent = "Pra onde ir?";
    actionButtons.style.display = "none";
    exploreButtons.style.display = "flex";
    specialActionContainer.style.display = "none";
    safeRoomButtons.style.display = "none";

    // Remover o elemento visual da sala quando mostrar os botões de exploração
    roomElementEl.className = "room-element";
  }
}

function showSpecialAction(actionText, actionFunction) {
  if (!processingMessages) {
    orientationText.textContent = "O que fazer?";
    actionButtons.style.display = "none";
    exploreButtons.style.display = "none";
    specialActionContainer.style.display = "flex";
    safeRoomButtons.style.display = "none";

    specialActionButton.textContent = actionText;
    specialActionButton.onclick = actionFunction;
  }
}

function showAppropriateActions() {
  waitingForAction = false;

  switch (currentRoomData.type) {
    case ROOM_TYPES.EMPTY:
      showExploreActions();
      break;
    case ROOM_TYPES.MONSTER:
    case ROOM_TYPES.BOSS:
      if (currentMonster && currentMonster.hp > 0) {
        showCombatActions();
      } else {
        showExploreActions();
      }
      break;
    case ROOM_TYPES.CHEST:
      showSpecialAction("ABRIR BAÚ", () => {
        openChest();
        // Após abrir o baú, ele desaparece
        roomElementEl.className = "room-element";
        waitingForAction = true;
      });
      break;
    case ROOM_TYPES.TRAP:
      showSpecialAction("LEVANTAR", () => {
        addMessage("Você se levanta com cuidado.");
        // Após levantar, a armadilha desaparece e a sala é marcada como vazia
        setTimeout(() => {
          imageMonster.src = "";
        }, 2000);
        roomElementEl.className = "room-element";
        currentRoomData.type = ROOM_TYPES.EMPTY;
        addMessage("Você está pronto para seguir em frente.");
        waitingForAction = true;
      });
      break;
    case ROOM_TYPES.SAFE:
      // Em sala segura, mostrar os botões específicos de sala segura
      actionButtons.style.display = "none";
      exploreButtons.style.display = "none";
      specialActionContainer.style.display = "none";

      if (!processingMessages) {
        safeRoomButtons.style.display = "flex";
        potionButton.style.display = "flex";
      }
      break;
    case ROOM_TYPES.CORPSE:
      showSpecialAction("EXAMINAR", () => {
        checkCorpse(player.currentRoom);
        // Após examinar, o cadáver desaparece
        roomElementEl.className = "room-element";
        waitingForAction = true;
      });
      break;
  }
}

// --- Lógica de Salas ---
function determineRoomType(roomNumber) {
  // Verificar se o jogador já morreu nesta sala
  if (playerDeaths[roomNumber] && roomNumber !== BOSS_ROOM) {
    return ROOM_TYPES.CORPSE;
  }

  // Salas fixas
  if (roomNumber === 0) return ROOM_TYPES.EMPTY; // Start room
  if (roomNumber === BOSS_ROOM) return ROOM_TYPES.BOSS;
  if (SAFE_ROOMS.includes(roomNumber)) return ROOM_TYPES.SAFE;
  if (roomNumber === BOSS_ROOM - 1) return ROOM_TYPES.CHEST; // Sala 49 sempre é baú

  // Verificar as últimas salas visitadas para aplicar as regras de sequência
  const lastTwoRooms = player.lastRoomTypes.slice(-2);

  // Regra: Após 2 monstros ou monstro+armadilha ou armadilha+armadilha, próxima sala é baú
  if (lastTwoRooms.length >= 2) {
    const isMonsterOrTrap = (type) =>
      type === ROOM_TYPES.MONSTER || type === ROOM_TYPES.TRAP;
    if (isMonsterOrTrap(lastTwoRooms[0]) && isMonsterOrTrap(lastTwoRooms[1])) {
      return ROOM_TYPES.CHEST;
    }
  }

  // Regra: Após sala vazia ou baú, próxima sala é monstro ou armadilha
  if (player.lastRoomTypes.length > 0) {
    const lastRoom = player.lastRoomTypes[player.lastRoomTypes.length - 1];
    if (lastRoom === ROOM_TYPES.EMPTY || lastRoom === ROOM_TYPES.CHEST) {
      // 85% monstro, 15% armadilha
      return Math.random() < 0.85 ? ROOM_TYPES.MONSTER : ROOM_TYPES.TRAP;
    }
  }

  // Para outras situações, usar a tabela de probabilidades
  const totalWeight = ROOM_PROBABILITIES.reduce(
    (sum, room) => sum + room.weight,
    0
  );
  let random = Math.random() * totalWeight;

  for (const room of ROOM_PROBABILITIES) {
    if (random < room.weight) {
      return room.type;
    }
    random -= room.weight;
  }

  return ROOM_TYPES.MONSTER; // Fallback
}

function generateRoomType(roomNumber) {
  // Garantir que as salas 15, 30 e 45 sejam sempre salas seguras
  if (SAFE_ROOMS.includes(roomNumber)) {
    gameRooms[roomNumber] = ROOM_TYPES.SAFE;
    localStorage.setItem("rpgGameRooms", JSON.stringify(gameRooms));
    return ROOM_TYPES.SAFE;
  }

  // Se a sala já foi pré-determinada, usar esse valor
  if (gameRooms[roomNumber] !== null) {
    return gameRooms[roomNumber];
  }

  // Caso contrário, determinar o tipo e salvar
  const roomType = determineRoomType(roomNumber);
  gameRooms[roomNumber] = roomType;
  localStorage.setItem("rpgGameRooms", JSON.stringify(gameRooms));

  return roomType;
}

function enterRoom(roomNumber) {
  // Esconder todos os botões no início
  hideAllActions();

  player.currentRoom = roomNumber;
  const roomType = generateRoomType(roomNumber);

  // Registrar o tipo da sala para as regras de sequência
  player.lastRoomTypes.push(roomType);
  if (player.lastRoomTypes.length > 5) {
    player.lastRoomTypes.shift(); // Manter apenas as últimas 5 salas
  }

  // Atualizar dados da sala atual
  currentRoomData = {
    number: roomNumber,
    type: roomType,
  };

  // Atualizar UI
  updateUI();

  // Lógica específica para cada tipo de sala
  switch (roomType) {
    case ROOM_TYPES.EMPTY:
      if (roomNumber === 0) {
        logMessage("Você atravessa a fresta. Na sua frente, varios caminhos.");
      } else {
        logMessage("Não tem nada neste lugar.");
      }
      break;
    case ROOM_TYPES.MONSTER:
      currentMonster = generateMonster(roomNumber);
      logMessage(`${currentMonster.name} apareceu!`);
      break;
    case ROOM_TYPES.BOSS:
      currentMonster = generateBoss();
      logMessage(`${currentMonster.name} apareceu!`);
      break;
    case ROOM_TYPES.CHEST:
      imageMonster.src = "images/bau.webp"; // Imagem de baú
      logMessage("Baú encontrado!");
      break;
    case ROOM_TYPES.TRAP:
      imageMonster.src = "images/armadilha.webp";
      logMessage("Você caiu em uma Armadilha!");

      // Aplicar dano da armadilha
      const trapDamage = 5;
      player.hp -= trapDamage;
      logMessage(`Você perdeu ${trapDamage} de vida!`);

      // Verificar se o jogador morreu
      if (player.hp <= 0) {
        player.hp = 0;
        updateUI();
        setTimeout(() => {
          gameOver();
        }, 4000);
        return;
      }
      break;
    case ROOM_TYPES.SAFE:
      imageMonster.src = "images/fogueira.webp";
      logMessage("Você sente que está em um lugar seguro.");
      break;
    case ROOM_TYPES.CORPSE:
      logMessage("Você encontra um cadáver de um aventureiro que sucumbiu.");
      break;
  }

  // Atualizar UI
  updateUI();

  // Marcar que estamos esperando uma ação do jogador
  waitingForAction = true;
}

function generateAllRooms() {
  gameRooms = {};

  // Pré-definir salas fixas
  gameRooms[0] = ROOM_TYPES.EMPTY; // Sala inicial
  gameRooms[BOSS_ROOM] = ROOM_TYPES.BOSS; // Sala do boss

  // Garantir que as salas seguras sejam sempre do tipo SAFE
  for (const safeRoom of SAFE_ROOMS) {
    gameRooms[safeRoom] = ROOM_TYPES.SAFE;
  }

  // Sala 49 (antes do boss) sempre é baú
  gameRooms[BOSS_ROOM - 1] = ROOM_TYPES.CHEST;

  // Gerar as outras salas aleatoriamente
  for (let i = 1; i < BOSS_ROOM; i++) {
    if (gameRooms[i] === undefined) {
      gameRooms[i] = null; // Será determinado quando o jogador entrar na sala
    }
  }
}

function moveToNextRoom(direction) {
  // Determinar o próximo número de sala
  let nextRoom;

  if (direction === "left") {
    nextRoom = player.currentRoom + 1;
  } else {
    nextRoom = player.currentRoom + 2;
  }

  // Entrar na próxima sala
  enterRoom(nextRoom);
}

// --- Lógica de Combate ---
function rollDice(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

function playerAttack() {
  if (processingMessages) return;

  // Roll d20 + attack bonus
  const attackRoll = rollDice(20);
  const attackTotal = attackRoll + player.attackBonus;

  addMessage("Você ataca!");

  // Check if hit
  if (attackTotal >= currentMonster.ac) {
    // Roll damage
    const damageRoll = rollDice(6);
    let damageTotal = damageRoll + player.damageBonus;

    // Nova lógica de dano
    if (attackRoll === 20) {
      // Ataque crítico - dobro do dano
      damageTotal *= 2;
      addMessage(`CRÍTICO! você causa ${damageTotal} de dano ao inimigo!`);
    } else if (attackTotal === currentMonster.ac) {
      // Ataque igual à CA - metade do dano
      damageTotal = Math.floor(damageTotal / 2);
      addMessage(`Raspão! você causa ${damageTotal} de dano ao inimigo.`);
    } else if (
      attackTotal >=
      currentMonster.ac + Math.ceil(currentMonster.ac * 0.5)
    ) {
      // Ataque supera CA+50% - dano aumentado em 50%
      damageTotal = Math.floor(damageTotal * 1.5);
      addMessage(`Golpe forte! você causa ${damageTotal} de dano ao inimigo!`);
    } else {
      // Dano normal
      addMessage(`Você causa ${damageTotal} de dano ao inimigo.`);
    }

    currentMonster.hp -= damageTotal;

    // Check if monster is defeated
    if (currentMonster.hp <= 0) {
      currentMonster.hp = 0;
      addMessage(`${currentMonster.name} foi derrotado!`);
      monsterDefeated();
      return;
    }
  } else {
    addMessage("Você errou!");
  }

  // Monster's turn
  monsterTurn();
}

function playerDodge() {
  if (processingMessages) return;

  addMessage("Você se prepara para desviar!");
  playerDodging = true;

  // Monster's turn
  monsterTurn();
}

function monsterTurn() {
  if (currentMonster.hp <= 0) {
    return;
  }

  // Attack
  // Calculate effective player AC (including dodge bonus)
  const effectivePlayerAC = player.ac + (playerDodging ? 5 : 0);

  // Roll d20 + monster attack bonus
  const attackRoll = rollDice(20);
  const attackTotal = attackRoll + currentMonster.attackBonus;

  addMessage(`${currentMonster.name} vai te atacar`);

  // Check if hit
  if (attackTotal >= effectivePlayerAC) {
    // Roll damage
    const damageRoll = rollDice(6);
    let damageTotal = damageRoll + currentMonster.damageBonus;

    // Nova lógica de dano
    if (attackRoll === 20) {
      // Ataque crítico - dobro do dano
      damageTotal *= 2;
      addMessage(`CRÍTICO! você perde ${damageTotal} de vida!`);
    } else if (attackTotal === effectivePlayerAC) {
      // Ataque igual à CA - metade do dano
      damageTotal = Math.floor(damageTotal / 2);
      addMessage(`De raspão! você perde ${damageTotal} de vida.`);
    } else if (
      attackTotal >=
      effectivePlayerAC + Math.ceil(effectivePlayerAC * 0.5)
    ) {
      // Ataque supera CA+50% - dano aumentado em 50%
      damageTotal = Math.floor(damageTotal * 1.5);
      addMessage(`Golpe forte! você perde ${damageTotal} de vida!`);
    } else {
      // Dano normal
      addMessage(`Acerto! você perde ${damageTotal} de vida.`);
    }

    player.hp -= damageTotal;

    // Check if player is defeated
    if (player.hp <= 0) {
      player.hp = 0;
      updateUI();
      setTimeout(() => {
        gameOver();
      }, 4000);
      return;
    }
  } else {
    addMessage(`${currentMonster.name} errou!`);
  }

  // Reset dodge status
  playerDodging = false;
  monsterDodging = false;

  // Update UI
  updateUI();

  // Re-enable combat buttons after a delay
  waitingForAction = true;
}

function monsterDefeated() {
  // Handle monster loot
  setTimeout(() => {
    imageMonster.src = "";
    monsterNameEl.textContent = "";
    monsterNameEl.style.opacity = 0;
  }, 4000);
  if (currentMonster.type === "boss") {
    setTimeout(() => {
      victory();
    }, 4000);
    return;
  }

  // Generate loot based on monster type
  let goldAmount = 0;
  let potionChance = 0;

  switch (currentMonster.type) {
    case "fraco":
      goldAmount = Math.floor(Math.random() * 5) + 5; // 5-10 gold
      potionChance = 0.1; // 10% chance
      break;
    case "normal":
      goldAmount = Math.floor(Math.random() * 5) + 10; // 10-15 gold
      potionChance = 0.2; // 20% chance
      break;
    case "elite":
      goldAmount = Math.floor(Math.random() * 10) + 10; // 10-20 gold
      potionChance = 0.3; // 30% chance
      break;
  }

  // Add gold
  player.gold += goldAmount;
  addMessage(`Você achou ${goldAmount} ouro!`);

  // Chance for potion
  if (Math.random() < potionChance) {
    player.potions += 1;
    addMessage("Você achou 1 poção!");
  }

  // Allow player to continue exploring
  currentMonster = null;
  waitingForAction = true;
}

function usePotion() {
  if (player.potions <= 0) {
    addMessage("Você não tem poções!");
    waitingForAction = true;
    return;
  }

  if (player.hp >= player.maxHp) {
    addMessage("Sua vida já está no máximo!");
    waitingForAction = true;
    return;
  }

  player.potions--;
  const healAmount = 10;
  const healedLife =
    player.maxHp - player.hp < healAmount
      ? player.maxHp - player.hp
      : healAmount;
  player.hp = Math.min(player.hp + healAmount, player.maxHp);
  addMessage(`Você usou uma poção! curou ${healedLife} de vida.`);
  updateUI();
  waitingForAction = true;
}

function gameOver() {
  logMessage("Você sente um frio na espinha, vê seu sangue escorrer...");
  // Registrar a morte do jogador nesta sala
  playerDeaths[player.currentRoom] = true;
  localStorage.setItem("rpgGameDeaths", JSON.stringify(playerDeaths));

  // Remover o save em sala segura
  localStorage.removeItem("rpgGameSafeSave");

  // Mostrar tela de game over
  setTimeout(() => {
    imageMonster.src = "";
    showScreen(gameOverScreen);
  }, 7000);
}

function victory() {
  logMessage("Você respira fundo e segue em frente!");
  // Mostrar tela de créditos
  setTimeout(() => {
    showScreen(creditsScreen);
  }, 7000);
}

function logMessage(message) {
  addMessage(message);
}

// --- Lógica de Monstros ---
function generateMonster(roomNumber) {
  // Determine monster type based on room number
  let monsterType;

  if (roomNumber < 10) {
    monsterType = "fraco";
  } else if (roomNumber < 30) {
    monsterType = "normal";
  } else {
    monsterType = "elite";
  }

  // Generate monster stats based on type
  let selectedMonster;
  let monsterStats;
  let monsterName;
  let monsterImage;

  switch (monsterType) {
    case "fraco":
      monsterStats = {
        hp: Math.floor(Math.random() * 5) + 8, // 8-12 HP
        maxHp: 12,
        ac: 12,
        attackBonus: 3,
        damageBonus: 1,
      };

      // Choose random name and image
      const weakMonsters = [
        { name: "Goblin", image: "images/goblin.webp" },
        { name: "Rato Gigante", image: "images/rato.webp" },
        { name: "Kobold", image: "images/kobold.webp" },
        { name: "Esqueleto Frágil", image: "images/esqueleto.webp" },
        { name: "Aranha Pequena", image: "images/aranha.webp" },
      ];
      selectedMonster =
        weakMonsters[Math.floor(Math.random() * weakMonsters.length)];
      monsterName = selectedMonster.name;
      imageMonster.src = `${selectedMonster.image}`;
      break;

    case "normal":
      monsterStats = {
        hp: Math.floor(Math.random() * 10) + 15, // 15-24 HP
        maxHp: 24,
        ac: 14,
        attackBonus: 5,
        damageBonus: 2,
      };

      // Choose random name and image
      const normalMonsters = [
        { name: "Orc", image: "images/orc.webp" },
        { name: "Lobo", image: "images/lobo.webp" },
        { name: "Bandido", image: "images/bandido.webp" },
        { name: "Zumbi", image: "images/zumbi.webp" },
        { name: "Cultista", image: "images/cultista.webp" },
      ];
      selectedMonster =
        normalMonsters[Math.floor(Math.random() * normalMonsters.length)];

      monsterName = selectedMonster.name;
      imageMonster.src = `${selectedMonster.image}`;
      break;

    case "elite":
      monsterStats = {
        hp: Math.floor(Math.random() * 15) + 25, // 25-39 HP
        maxHp: 39,
        ac: 16,
        attackBonus: 7,
        damageBonus: 3,
      };

      // Choose random name and image
      const eliteMonsters = [
        { name: "Cavaleiro Negro", image: "images/cav-negro.webp" },
        { name: "Ogro", image: "images/ogro.webp" },
        { name: "Mago Sombrio", image: "images/mago-sombrio.webp" },
        { name: "Minotauro", image: "images/minotauro.webp" },
        { name: "Troll", image: "images/troll.webp" },
      ];
      selectedMonster =
        eliteMonsters[Math.floor(Math.random() * eliteMonsters.length)];
      monsterName = selectedMonster.name;
      imageMonster.src = `${selectedMonster.image}`;
      break;
  }

  return {
    name: monsterName,
    hp: monsterStats.hp,
    maxHp: monsterStats.maxHp,
    ac: monsterStats.ac,
    attackBonus: monsterStats.attackBonus,
    damageBonus: monsterStats.damageBonus,
    type: monsterType,
  };
}

function generateBoss() {
  const bossName = [
    { name: "Dragão Ancião", image: "images/dragao.webp" },
    { name: "Lich Ancião", image: "images/lich.webp" },
    { name: "Mantícora Alfa", image: "images/manticora.webp" },
  ];
  selectedMonster = bossName[Math.floor(Math.random() * bossName.length)];
  imageMonster.src = `${selectedMonster.image}`;
  return {
    name: selectedMonster.name,
    hp: 50,
    maxHp: 50,
    ac: 18,
    attackBonus: 9,
    damageBonus: 5,
    type: "boss",
  };
}

// --- Lógica de Baús e Cadáveres ---
function openChest() {
  // Determine chest type
  const roll = Math.random() * 100;
  let chestType;

  if (roll < 80) {
    chestType = "normal";
    //addMessage("Baú normal!");
  } else if (roll < 95) {
    chestType = "raro";
    //addMessage("Baú raro!");
  } else {
    chestType = "lendario";
    //addMessage("Baú lendário!");
  }

  // Generate loot based on chest type
  const loot = generateChestLoot(chestType);

  // Apply loot effects
  applyLoot(loot);

  // Marcar o tipo da sala como vazia após abrir o baú
  // para evitar que o botão "ABRIR BAÚ" apareça novamente
  currentRoomData.type = ROOM_TYPES.EMPTY;

  // Adicionar uma mensagem final para garantir que a fila de mensagens seja processada

  addMessage("Não há mais nada por aqui!");
}

function checkCorpse(roomNumber) {
  addMessage("Verificando cadáver...");

  // Usar a mesma lógica de baú, mas com maior chance de itens raros
  const roll = Math.random() * 100;
  let chestType;

  if (roll < 50) {
    chestType = "normal";
    addMessage("Itens comuns.");
  } else if (roll < 85) {
    chestType = "raro";
    addMessage("Itens raros!");
  } else {
    chestType = "lendario";
    addMessage("Itens lendários!");
  }

  // Generate loot based on chest type
  const loot = generateChestLoot(chestType);

  // Apply loot effects
  applyLoot(loot);

  // Marcar que o cadáver foi saqueado (remover da lista de mortes)
  delete playerDeaths[roomNumber];
  localStorage.setItem("rpgGameDeaths", JSON.stringify(playerDeaths));

  // Atualizar o tipo da sala para vazia
  gameRooms[roomNumber] = ROOM_TYPES.EMPTY;
  localStorage.setItem("rpgGameRooms", JSON.stringify(gameRooms));

  // Marcar a sala atual como vazia
  currentRoomData.type = ROOM_TYPES.EMPTY;
}

function generateChestLoot(chestType) {
  const roll = Math.random() * 100;
  let loot = {};

  switch (chestType) {
    case "normal":
      if (roll < 30) {
        loot = { type: "poção", amount: 1 };
      } else if (roll < 55) {
        loot = { type: "ouro", amount: 20 };
      } else if (roll < 70) {
        loot = { type: "arma_comum" };
      } else if (roll < 80) {
        loot = { type: "armadura_comum" };
      } else if (roll < 90) {
        loot = { type: "tonico" };
      } else {
        loot = { type: "elixir" };
      }
      break;
    case "raro":
      if (roll < 30) {
        loot = { type: "poção", amount: 2, ouro: 30 };
      } else if (roll < 55) {
        loot = { type: "arma_rara", ouro: 10 };
      } else if (roll < 80) {
        loot = { type: "armadura_rara", ouro: 10 };
      } else if (roll < 90) {
        loot = { type: "tonico_raro", ouro: 10 };
      } else {
        loot = { type: "elixir_raro", ouro: 10 };
      }
      break;
    case "lendario":
      if (roll < 30) {
        loot = { type: "poção", amount: 3, ouro: 50 };
      } else if (roll < 60) {
        loot = { type: "arma_lendaria", ouro: 30 };
      } else if (roll < 75) {
        loot = { type: "tonico_lendario", ouro: 30 };
      } else if (roll < 90) {
        loot = { type: "armadura_lendaria", ouro: 30 };
      } else {
        loot = { type: "elixir_lendario", ouro: 30 };
      }
      break;
  }

  return loot;
}

function applyLoot(loot) {
  setTimeout(() => {
    imageMonster.src = "";
  }, 2000);
  // Apply gold
  if (loot.ouro) {
    player.gold += loot.ouro;
    addMessage(`Você achou ${loot.ouro} de ouro!`);
  }

  // Apply potions
  if (loot.type === "poção") {
    player.potions += loot.amount;
    addMessage(
      `Você achou ${loot.amount} ${loot.amount == 1 ? "poção" : "poções"}!`
    );
  }

  // Apply weapon upgrades
  if (loot.type === "arma_comum") {
    player.damageBonus += 1;
    addMessage("Achou uma arma comum! Seu dano aumenta +1!");
  } else if (loot.type === "arma_rara") {
    player.damageBonus += 2;
    addMessage("Achou uma arma rara! Seu dano aumenta +2!");
  } else if (loot.type === "arma_lendaria") {
    player.damageBonus += 3;
    addMessage("Achou uma arma lendária Seu dano aumenta +3!");
  }

  // Apply armor upgrades
  if (loot.type === "armadura_comum") {
    player.ac += 1;
    addMessage("Achou uma armadura comum! Sua defesa aumenta +1!");
  } else if (loot.type === "armadura_rara") {
    player.ac += 2;
    addMessage("Achou uma armadura rara! Sua defesa aumenta +2!");
  } else if (loot.type === "armadura_lendaria") {
    player.ac += 3;
    addMessage("Achou uma armadura lendária! Sua defesa aumenta +3!");
  }

  // Apply elixirs (increase max HP)
  if (loot.type === "elixir") {
    player.maxHp += 5;
    player.hp += 5;
    addMessage("Achou um exlixir! +5 vida máxima!");
  } else if (loot.type === "elixir_raro") {
    player.maxHp += 10;
    player.hp += 10;
    addMessage("Achou um exlixir raro! +10 vida máxima!");
  } else if (loot.type === "elixir_lendario") {
    player.maxHp += 15;
    player.hp += 15;
    addMessage("Achou um exlixir lendário! +15 vida máxima!");
  }

  // Apply attack bonus
  if (loot.type === "tonico") {
    player.attackBonus += 1;
    addMessage("Achou um tônico! +1 de ataque!");
  } else if (loot.type === "tonico_raro") {
    player.attackBonus += 2;
    addMessage("Achou um tônico raro! +2 de ataque!");
  } else if (loot.type === "tonico_lendario") {
    player.attackBonus += 3;
    addMessage("Achou um tônico lendário! +3 de ataque!");
  }
  // Update UI
  updateUI();
}

// --- Lógica de Sala Segura ---
function saveGameInSafeRoom() {
  localStorage.setItem("rpgGameSafeSave", JSON.stringify(player));
  addMessage("Você descansa ao lado da fogueira. Jogo salvo!");
}

function saveAndContinue() {
  saveGameInSafeRoom();
  setTimeout(() => {
    imageMonster.src = "";
  }, 2000);
  // Após salvar, marcar a sala como vazia para mostrar opções de direção
  currentRoomData.type = ROOM_TYPES.EMPTY;

  // Adicionar uma mensagem final para garantir que a fila de mensagens seja processada
  addMessage("Você se sente revigorado e pronto para continuar sua jornada.");
  waitingForAction = true;
}

// --- Lógica de Fortalecimento ---
function showStrengthenModal() {
  // Verificar se o jogador tem ouro suficiente
  const hasEnoughGold = player.gold >= UPGRADE_COST;

  // Atualizar estado dos botões de upgrade
  upgradeAttackButton.disabled = !hasEnoughGold;
  upgradeDefenseButton.disabled = !hasEnoughGold;
  upgradeHpButton.disabled = !hasEnoughGold;
  upgradeDamageButton.disabled = !hasEnoughGold;

  // Mostrar o modal
  strengthenModal.style.display = "flex";
}

function hideStrengthenModal() {
  strengthenModal.style.display = "none";
}

function upgradeAttribute(attribute) {
  // Verificar se o jogador tem ouro suficiente
  if (player.gold < UPGRADE_COST) {
    document.getElementById("strengthen-modal").disabled = true;
    addMessage("Ouro insuficiente!");
    hideStrengthenModal();
    return;
  }

  // Gastar o ouro
  player.gold -= UPGRADE_COST;

  // Aplicar o upgrade
  switch (attribute) {
    case "attack":
      player.attackBonus += 1;
      addMessage(
        `Ataque aumentado! (${player.attackBonus - 1} → ${player.attackBonus})`
      );
      break;
    case "defense":
      player.ac += 1;
      addMessage(`Defesa aumentada! (${player.ac - 1} → ${player.ac})`);
      break;
    case "hp":
      player.maxHp += 1;
      player.hp += 1;
      addMessage(
        `HP máximo aumentado! (${player.maxHp - 1} → ${player.maxHp})`
      );
      break;
    case "damage":
      player.damageBonus += 1;
      addMessage(
        `Dano aumentado! (${player.damageBonus - 1} → ${player.damageBonus})`
      );
      break;
  }

  // Fechar o modal
  hideStrengthenModal();

  // Atualizar UI
  updateUI();

  // Após fortalecer, marcar a sala como vazia para mostrar opções de direção
  //currentRoomData.type = ROOM_TYPES.EMPTY;

  // Adicionar uma mensagem final para garantir que a fila de mensagens seja processada
  addMessage("Herói fortalecido com sucesso!");
  waitingForAction = true;
}

// --- Inicialização ---
document.addEventListener("DOMContentLoaded", initializeGame);
