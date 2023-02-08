import * as dotenv from "dotenv";
import axios from "axios";
import { NHLGameFeedType } from "../types/NHLGameFeedType";
import { NHLScheduleType } from "../types/NHLScheduleTypes";

dotenv.config();

export const NHLApi = class {
  static async getPlayerStatsForSeason(
    personId: number,
    season: string
  ): Promise<NHLGameFeedType> {
    return axios
      .get(
        process.env.NHL_API_URL_BASE +
          `/api/v1/people/${personId}/?stats=gameLog&season=${season}`
      )
      .then((response) => {
        if (response.data) {
          return response.data;
        }
      });
  }

  static async getLiveGameFeed(gameId: number): Promise<NHLGameFeedType> {
    return axios
      .get(process.env.NHL_API_URL_BASE + `/api/v1/game/${gameId}/feed/live`)
      .then((response) => {
        if (response.data) {
          return response.data;
        }
      });
  }

  static async getCurrentGames(): Promise<NHLScheduleType> {
    return axios
      .get(process.env.NHL_API_URL_BASE + `/api/v1/schedule`)
      .then((response) => {
        if (response.data) {
          return response.data;
        }
      });
  }
};
