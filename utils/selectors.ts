export const commonSelectors = {
  backButton: "div._BrowserHeader_m63td_55 > button:nth-child(1)",
  launchBotButton: "div.new-message-bot-commands-view",
  authLoginPage: "div.tabs-container.auth-pages__container",
};

export const blumBotSelectors = {
  backButton: "div._BrowserHeader_m63td_55 > button:nth-child(1)",
  balanceLabel: "div.profile-with-balance > div.balance > div",
  boostSelector: "div.popup.popup-peer.popup-boost.active > div > div.popup-buttons > button:nth-child(2)",
  buttonSelector: "div.kit-fixed-wrapper.no-layout-tabs > button",
  claimButton: "div.kit-fixed-wrapper > div.index-farming-button > button.kit-button",
  claimButtons: " div.tasks-list button.is-status-ready-for-claim",
  closeBotButton: "div._BrowserHeader_m63td_55 > button:nth-child(1)",
  closeWalletSelector: "#tc-widget-root > tc-root > div > div > div > button",
  continueButton: "div.kit-fixed-wrapper > button",
  continueButtonPrimary: "button.kit-button.is-large.is-primary",
  earnButton: "#app > div.layout-tabs.tabs > a:nth-child(2)",
  earnTitleSelector: "div.tasks-page.page .title",
  homeButton: "div.layout-tabs.tabs > a:nth-child(1)",
  inputSelector: "div.kit-input.input > div > label > input",
  listTasks: " div.tasks-list button.is-status-not-started",
  lists: "div.kit-tabs.is-inline label.kit-tab.is-inline",
  playButton: "div.pages-index-drop.drop-zone > div > a",
  ticketLabel: "div.title-with-balance > div.pass",
  verifyTasks: " div.tasks-list button.is-status-ready-for-verify",
  weeklyTasksDone: "div.pages-tasks-card.is-short div.done-icon",
  weeklyTasks: "div.pages-tasks-card.is-short button.is-status-not-started",
  weeklyTasksList: "div.nested-tasks > div.pages-tasks-list-item-label button.is-status-not-started",
  weeklyTasksListClaim: "div.nested-tasks > div.pages-tasks-list-item-label button.is-status-ready-for-claim",
  weeklyTasksListClose: "div.kit-bottom-sheet > dialog > div.header > div.right-slot > button.close-btn",
};

export const tapswapBotSelectors = {
  backButton: " div._BrowserHeader_m63td_55 > button:nth-child(1)",
  checkButton: "div._listContainer_1519s_1 > div > div > button._button_fffa0_1",
  claimButton: "div._actionContent_1v85a_75 > button._button_fffa0_1",
  claimPriceButton: "div._actionContent_1v85a_75 > button._button_fffa0_1._primary_fffa0_13._large_fffa0_49._fullWidth_fffa0_37",
  claimTaskButton: "button._button_fffa0_1",
  finishMission: "button._button_fffa0_1._secondary_fffa0_21._large_fffa0_49",
  nameOfTask: "h3._h3_1a2e0_1",
  startMission: "button._button_fffa0_1._secondary_fffa0_21._large_fffa0_49",
  submitButton: "div._answer_box_l4h9d_35 > button._button_fffa0_1",
  successClaimMission2M: "div._desc_1gncg_40 > p._body1_ytgu1_1",
  totalText: "p._body3_xgldm_1",
  videoBaseListItem: "div._container_jn9s0_1 > div._tabsContainer_1pooj_1 > div._listContainer_1519s_1 > button:nth-child",
  videoContainer: "div._listContainer_1519s_1",
  videoCount: "div._balance_1cln7_20 > p._body3_xgldm_1",
  videoTabButton: "div._wrapper_1z04b_1 > button:nth-child(2)",
  watchButton: "a._link_l4h9d_25 > button._button_fffa0_1._secondary_fffa0_21._small_fffa0_41",
};

export const pixelGameSelectors = {
  promiseButton: "div._layout_1boq4_1 div._button_container_1boq4_54 > button._button_1boq4_54",
  goButton: "div._button_container_1drph_81 > button._button_1drph_81",
  crashGame: "div._container_ieygs_8",
  balanceLabel: "div._buttons_container_tksty_1 > div._group_tksty_8._middle_tksty_21 > button > div > div._number_jcaqa_1",
  balanceNavigate: "div._buttons_container_tksty_1 > div._group_tksty_8._middle_tksty_21 > button._button_tksty_1",
  claimSelector: "div._content_q8u4d_22 > div._container_3i6l4_1 > button._button_3i6l4_11",
  waitClaimSelector: "div._container_3i6l4_1 > div._info_3i6l4_32",
  boostsSelector: "div._panel_1mia4_1 > div:nth-child(2)",
  tasksSelector: "div._panel_1mia4_1 > div:nth-child(1)",
  boostPaintRewardsSelector: "div._info_layout_bt2qf_1 > div > div._group_v8prs_7 > div:nth-child(1)",
  boostRechargingSelector: "div._info_layout_bt2qf_1 > div > div._group_v8prs_7 > div:nth-child(2)",
  boostEnergyLimitSelector: "div._info_layout_bt2qf_1 > div > div._group_v8prs_7 > div:nth-child(3)",
  buyBoost: "div._buttons_container_nvulu_59 > button._button_nvulu_59",
  boostPrice:
    "div._group_v8prs_7 > div:nth-child(1) > div._content_container_8sbvi_21 > div > div._item_reward_container_8sbvi_40 > span._price_text_8sbvi_45",

  tasks: [
    // Special tasks:
    // "#telegramPremium",
    "#leagueBonusSilver",
    "#leagueBonusGold",
    "#leagueBonusPlatinum",
    // "#spendStars",

    // Quick start:
    "#pain20pixels",
    // "#joinSquad",
    // "#invite3Frens",

    // Browser
    // "#notPixelChannel",
    // "#notPixelX",
    // "#notCoinChannel",
    // "#notCoinX",
  ],
  joinChannel: "div.chat-info-container > div.chat-utils > button.btn-primary.btn-color-primary.chat-join.rp",
};

export const getBoostPriceSelector = (index: number) =>
  `div._group_v8prs_7 > div:nth-child(${index}) > div._content_container_8sbvi_21 > div > div._item_reward_container_8sbvi_40 > span._price_text_8sbvi_45`;
