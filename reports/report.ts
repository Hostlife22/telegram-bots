import { AppName } from "../types";

const baseHeaders = ["Number", "Account", "User", "BalanceBefore", "BalanceAfter"];

const reportHeaders = {
  blum: {
    headers: [...baseHeaders, "Tickets"],
  },
  tapswap: {
    headers: [...baseHeaders, "Tickets"],
  },
};

export default class ReportGenerator {
  // @ts-ignore
  generateReport = (gameType: AppName, data) => {
    const { headers } = reportHeaders[gameType];
    const csvContent = this.jsonToCSV(data, headers);
    return Buffer.from(csvContent, "utf8");
  };

  // @ts-ignore
  jsonToCSV(jsonArray, columns) {
    const csvRows = [];

    csvRows.push(columns.join(","));

    // @ts-ignore
    jsonArray.forEach((item) => {
      // @ts-ignore
      const row = columns.map((column) => {
        const cell = String(item[column] || "").replace(/"/g, '""');
        return `"${cell}"`;
      });
      csvRows.push(row.join(","));
    });

    return csvRows.join("\n");
  }
}
