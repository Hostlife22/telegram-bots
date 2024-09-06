import axios from 'axios';

import { logger } from '../logger/logger';
import { delay } from '../utils/delay';
import { GeneralProfilesResult, ProfileResponse } from '../types';

const ADS_API_URL = 'http://local.adspower.net:50325/api';
const ADS_API_VERSION = 'v1';

export const adsOpenBrowser = async (userId: string) => {
  try {
    const response = await axios(`${ADS_API_URL}/${ADS_API_VERSION}/browser/start?user_id=${userId}`);
    const data = response.data;
    if (!data || !data.data || !data.data.ws || !data.data.ws.puppeteer) {
      throw new Error('Invalid response structure: ws.puppeteer URL not found');
    }

    return data;
  } catch (e) {
    logger.error(`Error in adsOpenBrowser: ${e.message}`);
    return null;
  }
};

export const adsCloseBrowser = async (userId: string) => {
  try {
    const response = await axios(`${ADS_API_URL}/${ADS_API_VERSION}/browser/stop?user_id=${userId}`);
    const data = response.data;

    if (!data || data.code !== 0) {
      throw new Error('Browser closing failed');
    }

    return data;
  } catch (e) {
    logger.error(`Error in adsOpenBrowser: ${e.message}`);
    return null;
  }
};

export const getGeneralProfiles = async (): Promise<GeneralProfilesResult> => {
  const result: GeneralProfilesResult = {
    success: true,
    message: null,
    profiles: [],
  };
  const pageSize = 100;
  let page = 1;
  let hasMoreData = true;

  while (hasMoreData) {
    const options = {
      method: 'GET',
      url: `${ADS_API_URL}/${ADS_API_VERSION}/user/list?page=${page}&page_size=${pageSize}&user_sort=	{"serial_number":"asc"}`,
    };

    try {
      const { data } = await axios.get<ProfileResponse>(options.url);

      const list = data.data?.list || [];
      result.profiles = [...result.profiles, ...list];

      if (list.length < pageSize) {
        hasMoreData = false;
      } else {
        await delay(1000);
        page += 1;
      }
    } catch (e) {
      result.success = false;
      result.message = 'Error in fetching profiles ' + e;
      return result;
    }
  }

  if (!result.profiles.length) {
    result.success = false;
    result.message = 'No profiles found';
  } else {
    result.message = 'Profiles fetched successfully';
  }

  return result;
};
