import * as dotenv from "dotenv";
import axios from "axios";
import { NHLGameFeedType } from "../types/NHLGameFeedType";
import { NHLScheduleType } from "../types/NHLScheduleTypes";
import format from "date-fns/format";

dotenv.config();

export const NHLApi = class {
  // GET https://statsapi.web.nhl.com/api/v1/game/ID/feed/live/diffPatch?startTimecode=yyyymmdd_hhmmss
  // Returns updates (like new play events, updated stats for boxscore, etc.) for the specified game ID since the given startTimecode.

  //https://statsapi.web.nhl.com/api/v1/game/ID/boxscore
  //Returns far less detail than feed/live and is much more suitable for post-game details including goals, shots, PIMs, blocked, takeaways, giveaways and hits.

  static async getPlayerStatsForSeason(
    personId: number,
    season: string
  ): Promise<NHLGameFeedType> {
    const responseData = await axios
      .get(
        process.env.NHL_API_URL_BASE +
          `/api/v1/people/${personId}/?stats=gameLog&season=${season}`
      )
      .then((response) => {
        if (response.data) {
          return response.data;
        }
      });
    return responseData;
  }

  static async getLiveGameFeed(gameId: number): Promise<NHLGameFeedType> {
    const responseData = await axios
      .get(process.env.NHL_API_URL_BASE + `/api/v1/game/${gameId}/feed/live`)
      .then((response) => {
        if (response.data) {
          return response.data;
        }
      });
    return responseData;
  }

  static async getCurrentGames(): Promise<NHLScheduleType> {
    const currentDate = format(new Date(), "yyyy-MM-dd");
    //"/api/v1/schedule?startDate=2022-02-01&endDate=2022-02-03"

    // Append the current date to get pre-season games
    const responseData = await axios
      .get(
        process.env.NHL_API_URL_BASE + `/api/v1/schedule?date=${currentDate}`
      )
      .then((response) => {
        if (response.data) {
          return response.data;
        }
      });
    return responseData;
  }
};
