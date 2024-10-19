## Usage Guide

Run the command to create and populate the `.env` file:

```bash
yarn copy:env
```

Then, start the project by running:

```bash
yarn start
```

## Filtering Applications by ID

The `executeTask` function now supports filtering applications based on `startId` and `finishId` parameters. These parameters can be passed via console arguments or environment variables.

You can set the `START_ID` and `FINISH_ID` in your `.env` file:

```bash
yarn start 22 25
```

```bash
npm run start 22 25
```

## Environment Variables

To ensure the proper functioning of the project, you need to configure the `.env` file. Here are the required variables:

- `TG_TOKEN=`: Token to access your Telegram bot. To obtain it, create a bot via [@BotFather](https://t.me/BotFather) and copy the token, which will look something like `7543300009:AAEHDdRZHcвыXwNcBIt3wKFdxmJPlRAhgX9Q`.

- `TG_RECEIVER_ID=`: The ID of the recipient for sending messages. You can get it using [@raw_info_bot](https://t.me/raw_info_bot).

- `INIT_RUN=`: Set to `"true"` for immediate farming or `"false"` for delayed farming, which will start after a certain period.

- `NTBA_FIX_350="true"`: Fix for the `node-telegram-bot-api` library.

- `ACCOUNTS_JSON_PATH="./data/ads.json"`: Path to the JSON file containing information about accounts (ID, code, active status, and a link to the Telegram bot).

- `GAME=tapswap`: Specify a particular game or leave it empty for the bot to play all games stored in the JSON file.

- `PARALLEL_LIMIT=2`: The number of profiles that will run simultaneously.

- `CLAIM_BLUM_TASKS="false"`: Option to execute tasks in Blum.

- `BASE_TASK_TIME=60`: Variable to set a stable period of time to start tasks, without it a random time period will be selected.

- `ORDER=asc`: Launch profiles in `asc`/`desc` or random (`shuffle`) order. Default is `asc`.

## Example JSON Data

You need to create a JSON file in the `data` folder with the following structure:

```json
{
  "id": 1,
  "code": "ji97e6a",
  "active": true,
  "username": "@john_doe",
  "games": {
    "blum": "https://web.telegram.org/k/#@BlumCryptoBot",
    "tapswap": "https://web.telegram.org/k/#@tapswap_bot"
  }
}
```

### Add new Game to profile json

1. npm run add -- gameKey gameUrl jsonPath 1-10 (1,2,3, ..., 10)
2. npm run add -- gameKey gameUrl jsonPath 1 10 45 (1, 10, 45)
3. yarn add -- gameKey gameUrl jsonPath

### Add game by referral link

- Replace `org/a` by `org/k`
  Example: `npm run add register https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3Dnotpixel%26appname%3Dapp%26startapp%3Df1257871143 path`

1. npm run add -- register gameUrl jsonPath
2. yarn add -- register gameUrl jsonPath
