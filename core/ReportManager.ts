import { AppName } from "../types";
import { TelegramNotifier } from "./TelegramNotifier";

const baseHeaders = ["Number", "Account", "User", "BalanceBefore", "BalanceAfter"];

const reportHeaders: Record<AppName, { headers: string[] }> = {
  blum: {
    headers: [...baseHeaders, "Tickets"],
  },
  tapswap: {
    headers: [...baseHeaders, "Tickets"],
  },
  electra: {
    headers: [...baseHeaders, "Tickets"],
  },
};

interface ReportData {
  [key: string]: string | number;
}

export class ReportManager {
  private telegramNotifier: TelegramNotifier;

  constructor(telegramNotifier: TelegramNotifier) {
    this.telegramNotifier = telegramNotifier;
  }

  private generateReport = (gameType: AppName, data: ReportData[]) => {
    const { headers } = reportHeaders[gameType];
    const csvContent = this.jsonToCSV(data, headers);
    return Buffer.from(csvContent, "utf8");
  };

  private jsonToCSV(jsonArray: ReportData[], columns: string[]): string {
    const csvRows = [];

    csvRows.push(columns.join(","));

    jsonArray.forEach((item) => {
      const row = columns.map((column) => {
        const cell = String(item[column] || "").replace(/"/g, '""');
        return `"${cell}"`;
      });
      csvRows.push(row.join(","));
    });

    return csvRows.join("\n");
  }

  async sendGameReports(groupedGames: Record<string, any[]>) {
    for (const [game, data] of Object.entries(groupedGames)) {
      const report = this.generateReport(game as AppName, data);
      await this.telegramNotifier.sendCSVDocument(report, game);
    }
  }
}
