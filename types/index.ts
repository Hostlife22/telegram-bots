import { Browser } from "puppeteer";

export type AppName = "blum" | "tapswap" | "pixel" | "electra";
// export type AppName = 'blum' | 'hamster' | 'iceberg';
export type ShuffleArrayType = "asc" | "desc" | "shuffle";

export interface TgApp {
  id: number;
  code: string;
  active: boolean;
  username: string;
  games: Record<AppName, string>;
}

export interface AdsResponse {
  code: number;
  data: {
    ws?: {
      selenium: string;
      puppeteer: string;
    };
    debug_port?: string;
    webdriver?: string;
  };
  msg: string;
}

export interface Profile {
  name: string;
  domain_name: string;
  created_time: string;
  ip: string;
  ip_country: string;
  password: string;
  fbcc_proxy_acc_id: string;
  ipchecker: string;
  fakey: string;
  sys_app_cate_id: string;
  group_id: string;
  group_name: string;
  remark: string;
  serial_number: string;
  last_open_time: string;
  user_id: string;
  username: string;
}

export interface ProfileResponseData {
  list: Profile[];
  page: number;
  page_size: number;
}
export interface ProfileResponse {
  data: ProfileResponseData;
  code: number;
  msg: string;
}

export interface GeneralProfilesResult {
  success: boolean;
  message: string | null;
  profiles: Profile[];
}

export interface AccountResults {
  Account: null | string;
  User: null | string;
  BalanceBefore: number | string;
  BalanceAfter: number | string;
  Tickets?: number | string;
}

export interface ParsedGameResult {
  game: string;
  data: AccountResults;
}

export type PlayGameFn = (browser: Browser, appUrl: string, id: number) => Promise<AccountResults>;
