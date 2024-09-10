import TelegramBot from "node-telegram-bot-api";

import { formatTime } from "../utils/datetime";

export class TelegramNotifier {
  private bot: TelegramBot;
  private receiverId: string;
  private isPolling = false;

  constructor() {
    this.bot = new TelegramBot(process.env.TG_TOKEN);
    this.receiverId = process.env.TG_RECEIVER_ID;
  }

  async sendMessage(message: string, mode: TelegramBot.SendAnimationOptions["parse_mode"] = "HTML"): Promise<void> {
    const MAX_LENGTH = 4096;

    if (message.length <= MAX_LENGTH) {
      await this.bot.sendMessage(this.receiverId, message, { parse_mode: mode });
    } else {
      let currentIndex = 0;
      let partIndex = 1;
      const totalParts = Math.ceil(message.length / MAX_LENGTH);

      while (currentIndex < message.length) {
        const nextChunk = message.substring(currentIndex, currentIndex + MAX_LENGTH);
        const partMessage = `Part ${partIndex} of ${totalParts}\n\n${nextChunk}`;
        await this.bot.sendMessage(this.receiverId, partMessage, { parse_mode: mode });
        currentIndex += MAX_LENGTH;
        partIndex++;
      }
    }
  }

  async sendAndPinMessage(message: string, mode: TelegramBot.SendAnimationOptions["parse_mode"] = "HTML"): Promise<void> {
    const sentMessage = await this.bot.sendMessage(this.receiverId, message, {
      parse_mode: mode,
    });
    if (sentMessage.message_id) {
      this.bot.pinChatMessage(this.receiverId, sentMessage.message_id, {
        disable_notification: false,
      });
    }
  }

  async sendCSVDocument(buffer: Buffer, game: string): Promise<TelegramBot.Message> {
    const now = new Date();
    const time = String(now.getHours()).padStart(2, "0") + "-" + String(now.getMinutes()).padStart(2, "0");
    const response = await this.bot.sendDocument(
      this.receiverId,
      buffer,
      { disable_notification: true },
      {
        filename: `${game}-report-${time}.csv`,
        contentType: "text/csv",
      },
    );

    return response;
  }

  async notifySchedule(taskTime: Date): Promise<void> {
    await this.sendAndPinMessage(`🕒 NEXT FIRE ON <b>${formatTime(taskTime)}</b> 🕒`);
  }

  async sendSummary(processedAccounts: Set<string>): Promise<void> {
    const summaryText = `🎮 Game Results Summary:\n\n- Processed accounts (${processedAccounts.size}): ${[...processedAccounts].join(" | ")}\n\n- 📂 Detailed reports are being sent as CSV files.`;
    await this.sendMessage(summaryText.trim());
  }

  async notifyError(error: Error): Promise<void> {
    await this.sendMessage(`😫 ${error}`);
  }

  async startPolling(): Promise<void> {
    if (!this.isPolling) {
      await this.bot.startPolling();
      this.isPolling = true;
    }
  }

  async stopPolling(): Promise<void> {
    if (this.isPolling) {
      await this.bot.stopPolling();
      this.isPolling = false;
    }
  }
}
