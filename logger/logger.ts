import Logger, { LoggerOptions } from "@ptkdev/logger";

class LoggerWithReports extends Logger {
  private logMessages: (string | number)[][] = [];
  private logCounter = 0;
  private user = "[Blank]";

  constructor(options: LoggerOptions) {
    super(options);
  }

  setUser = (user: string) => {
    this.user = user;
  };

  debug = (message: string, tag?: string) => {
    super.debug(message, tag);
    this.logCounter++;
    this.logMessages.push([this.logCounter, this.user, "DEBUG", message]);
  };

  warning = (message: string, tag?: string) => {
    super.warning(message, tag);
    this.logCounter++;
    this.logMessages.push([this.logCounter, this.user, "WARN", message]);
  };

  error = (message: string, tag?: string) => {
    super.error(message, tag);
    this.logCounter++;
    this.logMessages.push([this.logCounter, this.user, "ERROR", message]);
  };

  logsAsReport = () => {
    const logsAsString = this.logMessages.map((log) => `⚙️ <b>[${log[3]}]</b> ${log[4]}`).join("\r\n");
    this.logMessages = [];
    return logsAsString;
  };
}

const options: LoggerOptions = {
  language: "en",
  colors: true,
  debug: true,
  info: true,
  warning: true,
  error: true,
  sponsor: true,
  type: "log",
  rotate: {
    size: "10M",
    encoding: "utf8",
  },
};

export const logger = new LoggerWithReports(options);
