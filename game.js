const currentDayElement = document.getElementById('day-value');
const carbonUsedElement = document.getElementById('carbon-used');
const budgetRemainingElement = document.getElementById('budget-remaining');
const budgetStatusElement = document.getElementById('budget-status');
const budgetProgress = document.getElementById('budget-progress');
const scenarioText = document.getElementById('scenario-text');
const feedbackMessage = document.getElementById('feedback-message');
const choicesPanel = document.getElementById('choices-panel');
const gameArea = document.getElementById('game-area');
const endgameScreen = document.getElementById('endgame-screen');
const endgameSummary = document.getElementById('endgame-summary');
const endgameStatus = document.getElementById('endgame-status');
const endgameComparison = document.getElementById('endgame-comparison');
const endgameTips = document.getElementById('endgame-tips');
const finalCarbon = document.getElementById('final-carbon');
const restartButton = document.getElementById('restart-button');

const totalDays = 7;
let currentDay = 1;
let carbonUsed = 0;
const carbonBudget = 60; // HARD MODE: 60kg budget
let gameActive = true;
let userChoices = [];
let feedbackTimer = null;

const dayData = [
  {
    scenario: 'You need to get to work/school. How do you travel?',
    choices: [
      { text: '🚲 Bike or Walk', carbon: 0, feedback: 'Zero carbon! Perfect start! 🌱' },
      { text: '🚗 Drive alone', carbon: 12, feedback: '12kg! Driving alone is expensive. Carpool or transit?' },
      { text: '🚌 Public transit', carbon: 3, feedback: '3kg — decent. But could be better!' }
    ]
  },
  {
    scenario: 'Time for lunch. What\'s on your plate?',
    choices: [
      { text: '🥩 Beef burger', carbon: 25, feedback: '25kg!! That\'s nearly half your daily budget gone!' },
      { text: '🌱 Veggie bowl', carbon: 2, feedback: 'Only 2kg! Plants save the planet.' },
      { text: '🥪 Local sandwich', carbon: 5, feedback: '5kg — okay, but veggie is better.' }
    ]
  },
  {
    scenario: 'Evening at home. How do you use electricity?',
    choices: [
      { text: '💡 Lights + TV on', carbon: 3, feedback: '3kg — small impact.' },
      { text: '🕯️ Candles + reading', carbon: 0.2, feedback: '0.2kg! Cozy AND green.' },
      { text: '❄️ AC/Heater all night', carbon: 15, feedback: '15kg!! Layer up or use a fan instead.' }
    ]
  },
  {
    scenario: 'You need a new shirt. What do you buy?',
    choices: [
      { text: '👕 New fast fashion', carbon: 22, feedback: '22kg! Thrift stores are cheaper AND greener.' },
      { text: '♻️ Thrift store', carbon: 1, feedback: '1kg — climate hero move!' },
      { text: '🧵 Borrow from friend', carbon: 0.5, feedback: '0.5kg! Sharing is caring.' }
    ]
  },
  {
    scenario: 'You finish a meal. What happens to leftovers?',
    choices: [
      { text: '🗑️ Throw in trash', carbon: 8, feedback: '8kg! Food waste = methane = bad.' },
      { text: '🌱 Compost scraps', carbon: 0.5, feedback: '0.5kg — nature thanks you.' },
      { text: '🍱 Save for later', carbon: 0, feedback: '0kg! Zero waste perfection!' }
    ]
  },
  {
    scenario: 'Time to clean up. What\'s your routine?',
    choices: [
      { text: '🚿 Long hot shower', carbon: 8, feedback: '8kg! Shorten it to save carbon AND water.' },
      { text: '⏱️ Quick 5-min shower', carbon: 2, feedback: '2kg — efficient and green.' },
      { text: '🚰 Cold rinse only', carbon: 0.3, feedback: '0.3kg! Hardcore commitment!' }
    ]
  },
  {
    scenario: 'FINAL DAY! Friends invite you out. What do you do?',
    choices: [
      { text: '✈️ Take a flight', carbon: 85, feedback: '85kg!!! GAME OVER — that alone destroys your budget!' },
      { text: '🚆 Take a train', carbon: 10, feedback: '10kg — trains are efficient.' },
      { text: '🚶 Stay local, hike', carbon: 0, feedback: '0kg! Perfect ending to a green week!' }
    ]
  }
];

function updateUI() {
  currentDayElement.textContent = `${currentDay} / ${totalDays}`;
  carbonUsedElement.textContent = `${carbonUsed.toFixed(1)} kg`;
  const remaining = Math.max(carbonBudget - carbonUsed, 0);
  budgetRemainingElement.textContent = `${remaining.toFixed(1)} kg`;
  const percent = Math.max(Math.min((remaining / carbonBudget) * 100, 100), 0);
  budgetProgress.style.width = `${percent}%`;

  budgetProgress.className = 'progress-fill';
  const remainingBudget = carbonBudget - carbonUsed;
  
  if (remainingBudget > 30) {
    budgetProgress.classList.add('green');
    budgetStatusElement.textContent = '✅ Looking good! Keep making smart choices.';
  } else if (remainingBudget > 10) {
    budgetProgress.classList.add('yellow');
    budgetStatusElement.textContent = '⚠️ Getting tight! Choose carefully.';
  } else if (remainingBudget >= 0) {
    budgetProgress.classList.add('red');
    budgetStatusElement.textContent = '🔴 CRITICAL! One bad choice will sink you!';
  } else {
    budgetProgress.classList.add('dark-red');
    budgetStatusElement.textContent = '💀 BUDGET BLOWN! Restart and try harder.';
  }
  
  // Add warning if budget is nearly gone
  if (carbonBudget - carbonUsed < 5 && carbonBudget - carbonUsed >= 0) {
    budgetStatusElement.textContent = '🚨 LAST CHANCE! Only ' + (carbonBudget - carbonUsed).toFixed(1) + 'kg left!';
  }
}

function showFeedback(message) {
  clearTimeout(feedbackTimer);
  feedbackMessage.textContent = message;
  
  // Flash red if bad choice
  if (message.includes('kg!!') || message.includes('GAME OVER')) {
    feedbackMessage.style.color = '#f3a261';
    setTimeout(() => {
      feedbackMessage.style.color = '';
    }, 1000);
  } else if (message.includes('0kg') || message.includes('hero')) {
    feedbackMessage.style.color = '#7bc67b';
    setTimeout(() => {
      feedbackMessage.style.color = '';
    }, 1000);
  }
  
  feedbackTimer = setTimeout(() => {
    feedbackMessage.textContent = 'Choose wisely — every kilogram matters.';
    feedbackMessage.style.color = '';
  }, 4200);
}

function disableChoices(disabled) {
  const buttons = choicesPanel.querySelectorAll('button');
  buttons.forEach((button) => {
    button.disabled = disabled;
  });
}

function loadDay(day) {
  if (!gameActive) return;
  
  choicesPanel.innerHTML = '';
  const dayIndex = day - 1;
  const dayInfo = dayData[dayIndex];
  
  if (!dayInfo) return;
  
  scenarioText.textContent = dayInfo.scenario;

  dayInfo.choices.forEach((choice) => {
    const button = document.createElement('button');
    button.className = 'choice-button';
    button.textContent = `${choice.text} — ${choice.carbon}kg CO2`;
    button.addEventListener('click', () => makeChoice(choice.carbon, choice.text, choice.feedback));
    choicesPanel.appendChild(button);
  });
}

function makeChoice(carbon, choiceText, feedbackText) {
  if (!gameActive) return;
  gameActive = false;
  disableChoices(true);

  carbonUsed += carbon;
  userChoices.push({ day: currentDay, choiceText, carbon, feedbackText });
  showFeedback(`Day ${currentDay}: ${feedbackText}`);
  updateUI();

  setTimeout(() => {
    if (currentDay >= totalDays) {
      endGame();
      return;
    }
    currentDay += 1;
    gameActive = true;
    loadDay(currentDay);
    updateUI();
    disableChoices(false);
  }, 800);
}

function createTips() {
  const selectedTips = new Set();
  const choices = userChoices.map((choice) => choice.choiceText);
  let totalCarbon = carbonUsed;

  // Severe warnings for bad choices
  if (choices.some((text) => text.includes('Beef'))) {
    selectedTips.add('🔴 BEEF = 25kg PER MEAL. Try beans or tofu — 90% less carbon.');
  }
  if (choices.some((text) => text.includes('Drive alone'))) {
    selectedTips.add('🔴 DRIVING ALONE = 12kg/day. Bike, walk, or bus saves 60kg/week!');
  }
  if (choices.some((text) => text.includes('fast fashion'))) {
    selectedTips.add('🔴 FAST FASHION = 22kg per shirt. Buy second-hand or borrow.');
  }
  if (choices.some((text) => text.includes('flight'))) {
    selectedTips.add('✈️ ONE FLIGHT = 85kg. That\'s more than your ENTIRE weekly budget! Stay local.');
  }
  if (choices.some((text) => text.includes('AC'))) {
    selectedTips.add('🔴 AC/HEATER all night = 15kg. Use a fan or blanket — save 100kg/month.');
  }
  if (choices.some((text) => text.includes('trash'))) {
    selectedTips.add('🔴 FOOD WASTE = 8kg per meal. Compost or meal plan to avoid methane.');
  }
  if (choices.some((text) => text.includes('Long hot'))) {
    selectedTips.add('🔴 LONG SHOWERS = 8kg. 5-minute showers save water AND carbon.');
  }

  // Positive reinforcement
  if (totalCarbon < 30) {
    selectedTips.add('🌟 AMAZING! You\'re below 30kg — you\'re a climate superhero!');
  } else if (totalCarbon < 60) {
    selectedTips.add('👍 Good job! You stayed under budget. Small changes add up!');
  } else {
    selectedTips.add('💪 Room to grow! Try picking the greenest option next time.');
  }

  const fallbackTips = [
    '🌱 Meatless Mondays save 100kg+ CO2 per year!',
    '🚲 One car-free day per week = 600kg CO2 saved yearly.',
    '🧥 Buy second-hand clothes — they\'re cheaper AND greener.',
    '🚿 Take 5-minute showers to save 4,000 liters of water monthly.'
  ];

  let tips = Array.from(selectedTips).slice(0, 3);
  let fallbackIndex = 0;
  while (tips.length < 3 && fallbackIndex < fallbackTips.length) {
    if (!tips.includes(fallbackTips[fallbackIndex])) {
      tips.push(fallbackTips[fallbackIndex]);
    }
    fallbackIndex += 1;
  }

  return tips;
}

function endGame() {
  gameActive = false;
  gameArea.classList.add('hidden');
  endgameScreen.classList.remove('hidden');
  finalCarbon.textContent = `${carbonUsed.toFixed(1)}kg`;

  const remaining = carbonBudget - carbonUsed;
  if (remaining >= 0) {
    endgameStatus.innerHTML = `🎉 YOU WON! ${remaining.toFixed(1)}kg to spare. You're a climate hero! 🦸`;
  } else {
    endgameStatus.innerHTML = `💀 GAME OVER! You blew the budget by ${Math.abs(remaining).toFixed(1)}kg. Restart and try harder! 🔥`;
  }

  const average = 120;
  const delta = carbonUsed - average;
  if (delta <= -30) {
    endgameComparison.innerHTML = `🏆 INCREDIBLE! You used ${carbonUsed.toFixed(1)}kg — way below the average of ${average}kg!`;
  } else if (delta <= 0) {
    endgameComparison.innerHTML = `👍 Good! ${carbonUsed.toFixed(1)}kg is below the average of ${average}kg. Keep it up!`;
  } else {
    endgameComparison.innerHTML = `⚠️ The average is ${average}kg. You used ${delta.toFixed(1)}kg MORE than average. Time for changes!`;
  }

  endgameTips.innerHTML = '';
  const tips = createTips();
  tips.forEach((tip) => {
    const li = document.createElement('li');
    li.textContent = tip;
    endgameTips.appendChild(li);
  });
}

function restartGame() {
  currentDay = 1;
  carbonUsed = 0;
  gameActive = true;
  userChoices = [];
  feedbackMessage.textContent = 'Select an option to see your impact and move to the next day.';
  endgameScreen.classList.add('hidden');
  gameArea.classList.remove('hidden');
  updateUI();
  loadDay(currentDay);
}

restartButton.addEventListener('click', restartGame);

updateUI();
loadDay(currentDay);