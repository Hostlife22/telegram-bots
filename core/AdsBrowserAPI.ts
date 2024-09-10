import axios from "axios";

import { logger } from "./Logger";
import { delay } from "../utils/delay";
import { AdsResponse, GeneralProfilesResult, ProfileResponse } from "../types";

const ADS_API_URL = "http://local.adspower.net:50325/api";
const ADS_API_VERSION = "v1";

export class AdsBrowserAPI {
  private apiUrl: string;
  private apiVersion: string;

  constructor(apiUrl: string = ADS_API_URL, apiVersion: string = ADS_API_VERSION) {
    this.apiUrl = apiUrl;
    this.apiVersion = apiVersion;
  }

  async openBrowser(userId: string) {
    try {
      const response = await axios<AdsResponse>(`${this.apiUrl}/${this.apiVersion}/browser/start?user_id=${userId}`);
      const data = response.data;
      if (!data || !data.data || !data.data.ws || !data.data.ws.puppeteer) {
        throw new Error("Invalid response structure: ws.puppeteer URL not found");
      }

      return data;
    } catch (e: any) {
      logger.error(`Error in openBrowser: ${e.message}`);
      return null;
    }
  }

  async closeBrowser(userId: string) {
    try {
      const response = await axios(`${this.apiUrl}/${this.apiVersion}/browser/stop?user_id=${userId}`);
      const data = response.data;

      if (!data || data.code !== 0) {
        throw new Error("Browser closing failed");
      }
      return data;
    } catch (e: any) {
      logger.error(`Error in closeBrowser: ${e.message}`);
      return null;
    }
  }

  async getGeneralProfiles(): Promise<GeneralProfilesResult> {
    const result: GeneralProfilesResult = {
      success: true,
      message: null,
      profiles: [],
    };
    const pageSize = 100;
    let page = 1;
    let hasMoreData = true;

    while (hasMoreData) {
      const url = `${this.apiUrl}/${this.apiVersion}/user/list?page=${page}&page_size=${pageSize}&user_sort={"serial_number":"asc"}`;

      try {
        const { data } = await axios.get<ProfileResponse>(url);

        const list = data.data?.list || [];
        result.profiles = [...result.profiles, ...list];

        if (list.length < pageSize) {
          hasMoreData = false;
        } else {
          await delay(1000);
          page += 1;
        }
      } catch (e: any) {
        result.success = false;
        result.message = "Error in fetching profiles: " + e.message;
        return result;
      }
    }

    if (!result.profiles.length) {
      result.success = false;
      result.message = "No profiles found";
    } else {
      result.message = "Profiles fetched successfully";
    }

    return result;
  }
}
