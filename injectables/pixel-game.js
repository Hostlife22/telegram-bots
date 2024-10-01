
function waitForElement(selector, callback) {
  const element = document.querySelector(selector);
  if (element) {
    callback(element);
  } else {
    setTimeout(() => waitForElement(selector, callback), 500);
  }
}

// Симуляция событий указателя
function simulatePointerEvents(element, startX, startY, endX, endY) {
  const events = [
    new PointerEvent("pointerdown", { clientX: startX, clientY: startY, bubbles: true }),
    new PointerEvent("pointermove", { clientX: startX, clientY: startY, bubbles: true }),
    new PointerEvent("pointermove", { clientX: endX, clientY: endY, bubbles: true }),
    new PointerEvent("pointerup", { clientX: endX, clientY: endY, bubbles: true }),
  ];

  events.forEach((event) => element.dispatchEvent(event));
}

// Триггеры событий
function triggerEvents(element) {
  const events = [
    new PointerEvent("pointerdown", {
      bubbles: true,
      cancelable: true,
      isTrusted: true,
      pointerId: 1,
      width: 1,
      height: 1,
      pressure: 0.5,
      pointerType: "touch",
    }),
    new MouseEvent("mousedown", { bubbles: true, cancelable: true, isTrusted: true, screenX: 182, screenY: 877 }),
    new PointerEvent("pointerup", {
      bubbles: true,
      cancelable: true,
      isTrusted: true,
      pointerId: 1,
      width: 1,
      height: 1,
      pressure: 0,
      pointerType: "touch",
    }),
    new MouseEvent("mouseup", { bubbles: true, cancelable: true, isTrusted: true, screenX: 182, screenY: 877 }),
    new PointerEvent("click", {
      bubbles: true,
      cancelable: true,
      isTrusted: true,
      pointerId: 1,
      width: 1,
      height: 1,
      pressure: 0,
      pointerType: "touch",
    }),
    new PointerEvent("pointerout", {
      bubbles: true,
      cancelable: true,
      isTrusted: true,
      pointerId: 1,
      width: 1,
      height: 1,
      pressure: 0,
      pointerType: "touch",
    }),
    new PointerEvent("pointerleave", {
      bubbles: true,
      cancelable: true,
      isTrusted: true,
      pointerId: 1,
      width: 1,
      height: 1,
      pressure: 0,
      pointerType: "touch",
    }),
    new MouseEvent("mouseout", { bubbles: true, cancelable: true, isTrusted: true, screenX: 182, screenY: 877 }),
    new MouseEvent("mouseleave", { bubbles: true, cancelable: true, isTrusted: true, screenX: 182, screenY: 877 }),
  ];

  events.forEach((event, index) => {
    setTimeout(() => element.dispatchEvent(event), index * 100);
  });
}

// Открытие окна рисования
function openPaintWindow() {
  waitForElement("#canvasHolder", (canvas) => {
    const centerX = Math.floor(canvas.width / 2);
    const centerY = Math.floor(canvas.height / 2);
    simulatePointerEvents(canvas, centerX, centerY, centerX, centerY);
    console.log("Попытка открыть окно рисования");
  });
}

// Случайный клик
function randomClick() {
  if (isClickInProgress) {
    return;
  }

  isClickInProgress = true;

  checkPause();
  if (isAutoclickerPaused) {
    isClickInProgress = false;
    setTimeout(randomClick, 1000); // Проверка паузы
    return;
  }

  const paintButton = document.evaluate(
    '//*[@id="root"]/div/div[5]/div/button',
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null,
  ).singleNodeValue;
  if (paintButton) {
    const buttonText = paintButton.querySelector('span[class^="_button_text_"]').textContent;

    if (buttonText === "Paint") {
      waitForElement("#canvasHolder", (canvas) => {
        // Случайное перемещение карты
        const moveX = Math.floor(Math.random() * 200) - 100; // От -100 до 100
        const moveY = Math.floor(Math.random() * 200) - 100; // От -100 до 100
        simulatePointerEvents(canvas, canvas.width / 2, canvas.height / 2, canvas.width / 2 + moveX, canvas.height / 2 + moveY);

        // Случайная точка для рисования
        const x = Math.floor(Math.random() * canvas.width);
        const y = Math.floor(Math.random() * canvas.height);
        simulatePointerEvents(canvas, x, y, x, y);

        simulatePointerEvents(paintButton, 0, 0, 0, 0);
        const nextClickDelay = getRandomDelay(GAME_SETTINGS.minDelay, GAME_SETTINGS.maxDelay);
        isClickInProgress = false;
        setTimeout(randomClick, nextClickDelay);
      });
    } else if (buttonText === "No energy") {
      if (noEnergyTimeout === null) {
        const randomPause = getRandomDelay(GAME_SETTINGS.minPauseDuration, GAME_SETTINGS.maxPauseDuration);
        console.log(`Нет энергии. Рандомная пауза: ${randomPause} мс.`);
        noEnergyTimeout = setTimeout(() => {
          noEnergyTimeout = null;
          isClickInProgress = false;
          randomClick();
        }, randomPause);
      } else {
        isClickInProgress = false;
        setTimeout(randomClick, 1000); // Проверяем каждую секунду
      }
    } else {
      const nextClickDelay = getRandomDelay(GAME_SETTINGS.minDelay, GAME_SETTINGS.maxDelay);
      isClickInProgress = false;
      setTimeout(randomClick, nextClickDelay);
    }
  } else {
    console.log("Окно рисования не найдено. Попытка открыть окно рисования.");
    openPaintWindow();
    isClickInProgress = false;
    setTimeout(randomClick, 2000);
  }
}

// Рандомная задержка
function getRandomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Клик на кнопку "Okay, promise" и "Let’s Gooooooo!"
function clickOkayPromiseButton() {
  function tryClickOkayPromiseButton() {
    const okayPromiseButton = document.querySelector("button._button_1boq4_54");
    const letsGoButton = document.querySelector("button._button_1drph_81");

    if (okayPromiseButton && okayPromiseButton.textContent.includes("Okay, promise")) {
      triggerEvents(okayPromiseButton);
    }

    if (letsGoButton && letsGoButton.textContent.includes("Let’s Gooooooo!")) {
      triggerEvents(letsGoButton);
    }

    setTimeout(tryClickOkayPromiseButton, 3000);
  }

  tryClickOkayPromiseButton();
}

// Проверка на падение игры
function checkGameCrash() {
  const crashElement = document.querySelector("div._container_ieygs_8");
  if (crashElement) {
    console.log("Игра вылетела. Обновление страницы.");
    location.reload();
  } else {
    setTimeout(checkGameCrash, 2000);
  }
}

checkGameCrash();

// Запуск скрипта
function startScript() {
  openPaintWindow();
  setTimeout(randomClick, 2000);
}

startScript();

const GAME_SETTINGS = {
  minDelay: 1000, // 1 секунда
  maxDelay: 2000, // 2 секунды
  minPauseDuration: 60000, // 1 минута
  maxPauseDuration: 180000, // 3 минуты
  pauseUntil: null, // По умолчанию пауза не установлена
  autoClaimEnabled: false, // По умолчанию автозабор награды выключен
  autoClaimMinDelay: 120000, // 2 минуты
  autoClaimMaxDelay: 600000, // 10 минут
  autoChangeColorEnabled: false, // По умолчанию автосмена цвета выключена
  autoChangeColorMinDelay: 120000, // 2 минуты
  autoChangeColorMaxDelay: 600000, // 10 минут
};

// Автозабор награды
function autoClaimReward() {
  if (!GAME_SETTINGS.autoClaimEnabled) {
    return; // Автозабор отключен
  }

  function tryClaimReward() {
    const openRewardButton = document.querySelector("button._button_184v8_1");
    if (!openRewardButton) {
      setTimeout(tryClaimReward, 1000);
      return;
    }
    triggerEvents(openRewardButton);

    const loadingInfo = document.querySelector("div._container_3i6l4_1 > div._info_3i6l4_32");
    const claimButton = document.querySelector("button._button_3i6l4_11");

    if (loadingInfo && loadingInfo.textContent === "Loading...") {
      setTimeout(() => {
        const loadingInfoCheck = document.querySelector("div._container_3i6l4_1 > div._info_3i6l4_32");
        if (loadingInfoCheck && loadingInfoCheck.textContent === "Loading...") {
          const exitButton = document.querySelector("button._button_1cryl_1");
          if (exitButton) {
            triggerEvents(exitButton);
          }
          const nextClaimDelay = getRandomDelay(GAME_SETTINGS.autoClaimMinDelay, GAME_SETTINGS.autoClaimMaxDelay);
          console.log(`Следующая попытка получить награду через ${nextClaimDelay / 1000} секунд`);
          setTimeout(tryClaimReward, nextClaimDelay);
        } else {
          setTimeout(tryClaimReward, 1000);
        }
      }, 10000);
      return;
    }

    if (claimButton && claimButton.textContent.includes("Claim")) {
      triggerEvents(claimButton);
      console.log("Награда получена!");
    }

    const claimInInfo = document.querySelector("div._info_3i6l4_32");
    if (claimInInfo && claimInInfo.textContent.includes("CLAIM IN")) {
      const exitButton = document.querySelector("button._button_1cryl_1");
      if (exitButton) {
        triggerEvents(exitButton);
      }

      const nextClaimDelay = getRandomDelay(GAME_SETTINGS.autoClaimMinDelay, GAME_SETTINGS.autoClaimMaxDelay);
      console.log(`Следующая попытка получить награду через ${nextClaimDelay / 1000} секунд`);
      setTimeout(tryClaimReward, nextClaimDelay);
      return;
    }

    setTimeout(tryClaimReward, 1000);
  }

  tryClaimReward();
}

// Автосмена цвета
function changeColor() {
  if (!GAME_SETTINGS.autoChangeColorEnabled) {
    return; // Автосмена цвета отключена
  }

  function tryChangeColor() {
    // Проверяем состояние элемента
    const expandablePanel = document.querySelector("div._expandable_panel_layout_1v9vd_1");
    if (expandablePanel && expandablePanel.style.height !== "0px" && expandablePanel.style.opacity !== "0") {
      // Получаем список всех цветов
      const colors = document.querySelectorAll("div._color_item_epppt_22");
      if (colors.length === 0) {
        setTimeout(tryChangeColor, 1000);
        return;
      }

      // Выбираем случайный цвет из списка
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      // Нажимаем на случайный цвет
      console.log("Выбран новый цвет:", randomColor); // Логируем выбранный цвет
      setTimeout(() => triggerEvents(randomColor), 1000);

      // Применяем выбранный цвет
      setTimeout(() => triggerEvents(activeColor), 2000);
      return;
    }

    // Нажимаем на активный цвет
    const activeColor = document.evaluate(
      '//*[@id="root"]/div/div[5]/div/div[2]/div[1]',
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null,
    ).singleNodeValue;
    if (!activeColor) {
      setTimeout(tryChangeColor, 1000);
      return;
    }
    triggerEvents(activeColor);

    // Получаем список всех цветов
    const colors = document.querySelectorAll("div._color_item_epppt_22");
    if (colors.length === 0) {
      setTimeout(tryChangeColor, 1000);
      return;
    }

    // Выбираем случайный цвет из списка
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    // Нажимаем на случайный цвет
    console.log("Выбран новый цвет:", randomColor); // Логируем выбранный цвет
    setTimeout(() => triggerEvents(randomColor), 1000);

    // Применяем выбранный цвет
    setTimeout(() => triggerEvents(activeColor), 2000);
  }

  tryChangeColor();

  const nextChangeDelay = getRandomDelay(GAME_SETTINGS.autoChangeColorMinDelay, GAME_SETTINGS.autoChangeColorMaxDelay);
  console.log(`Следующая смена цвета через ${nextChangeDelay / 1000} секунд`);
  setTimeout(changeColor, nextChangeDelay);
}

// Запуск автозабора награды
function startAutoClaimReward() {
  if (GAME_SETTINGS.autoClaimEnabled) {
    console.log("Автозабор награды включен!");
    const initialDelay = getRandomDelay(GAME_SETTINGS.autoClaimMinDelay, GAME_SETTINGS.autoClaimMaxDelay);
    console.log(`Первая попытка получить награду через ${initialDelay / 1000} секунд`);
    setTimeout(autoClaimReward, initialDelay);
  }
}

// Запуск автосмены цвета
function startAutoChangeColor() {
  if (GAME_SETTINGS.autoChangeColorEnabled) {
    console.log("Автосмена цвета включена!");
    const initialDelay = getRandomDelay(GAME_SETTINGS.autoChangeColorMinDelay, GAME_SETTINGS.autoChangeColorMaxDelay);
    console.log(`Первая попытка смены цвета через ${initialDelay / 1000} секунд`);
    setTimeout(changeColor, initialDelay);
  }
}


// Флаги для управления автокликером
let isClickInProgress = false;
let isAutoclickerPaused = false;
let noEnergyTimeout = null;

// Переключение паузы
function toggleAutoclicker() {
  isAutoclickerPaused = !isAutoclickerPaused;
  updatePauseResumeButton();

  if (!isAutoclickerPaused) {
    setTimeout(randomClick, getRandomDelay(GAME_SETTINGS.minDelay, GAME_SETTINGS.maxDelay));
  }
}

// Обновление кнопки паузы
function updatePauseResumeButton() {
  pauseResumeButton.textContent = isAutoclickerPaused ? "Resume" : "Pause";
  pauseResumeButton.style.backgroundColor = isAutoclickerPaused ? "#e5c07b" : "#98c379";
}

const pauseButton = document.createElement("button");
pauseButton.className = "pause-button";
pauseButton.textContent = "⏸️";
pauseButton.onclick = () => {
  if (pauseMenu.classList.contains("show")) {
    hidePauseMenu();
  } else {
    showPauseMenu();
  }
};
document.body.appendChild(pauseButton);

const pauseMenu = document.createElement("div");
pauseMenu.className = "pause-menu";
pauseMenu.innerHTML = `
  <h3>Pause until:</h3>
  <input type="datetime-local" id="pauseDateTime">
  <button id="cancelPause">Cancel</button>
  <button id="acceptPause">Apply</button>
`;
document.body.appendChild(pauseMenu);

function showPauseMenu() {
  pauseMenu.classList.add("show");
}

function hidePauseMenu() {
  pauseMenu.classList.remove("show");
}

document.getElementById("cancelPause").addEventListener("click", () => {
  GAME_SETTINGS.pauseUntil = null;
  saveSettings();
  hidePauseMenu();
  updatePauseButton();
});

document.getElementById("acceptPause").addEventListener("click", () => {
  const pauseDateTime = document.getElementById("pauseDateTime").value;
  if (pauseDateTime) {
    GAME_SETTINGS.pauseUntil = new Date(pauseDateTime).getTime();
    saveSettings();
    hidePauseMenu();
    updatePauseButton();
  }
});

// Обновление кнопки паузы
function updatePauseButton() {
  if (GAME_SETTINGS.pauseUntil && GAME_SETTINGS.pauseUntil > Date.now()) {
    pauseButton.style.backgroundColor = "rgba(255, 0, 0, 0.8)";
    pauseButton.textContent = "▶️";
  } else {
    pauseButton.style.backgroundColor = "rgba(255, 193, 7, 0.8)";
    pauseButton.textContent = "⏸️";
  }
}

// Проверка на паузу
function checkPause() {
  if (GAME_SETTINGS.pauseUntil) {
    if (Date.now() >= GAME_SETTINGS.pauseUntil) {
      console.log("Пауза закончилась. Возобновление работы автокликера.");
      GAME_SETTINGS.pauseUntil = null;
      isAutoclickerPaused = false;
      saveSettings();
      updatePauseButton();
      updateSettingsMenu();
      updatePauseResumeButton();
      setTimeout(randomClick, getRandomDelay(GAME_SETTINGS.minDelay, GAME_SETTINGS.maxDelay));
    } else {
      isAutoclickerPaused = true;
    }
  }
  updatePauseResumeButton();
}

// Инициализация скрипта
function initializeScript() {
  startScript(); // Запуск автокликера
  startAutoClaimReward(); // Автозабор награды
  clickOkayPromiseButton(); // Нажатие на кнопки "Okay, promise" и "Let’s Gooooooo!"
  startAutoChangeColor(); // Автосмена цвета
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeScript);
} else {
  initializeScript();
}
