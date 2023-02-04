import * as dotenv from "dotenv";
import axios from "axios";

dotenv.config();

export type NHLScheduleType = {
  dates: Array<NHLScheduleDateType>;
};

export type NHLScheduleDateType = {
  games: Array<NHLScheduleGameType>;
};

export type NHLScheduleGameType = {
  gamePk: number;
  status: NHLScheduleGameStatusType;
};

export type NHLScheduleGameStatusType = {
  statusCode: string;
};

const GameStatusLiveCodes = ["3", "4"];
const GameStatusFinalCodes = ["6", "7"];

const getCurrentGames = async (): Promise<NHLScheduleType> => {
  const responseData = await axios
    .get(
      process.env.NHL_API_URL_BASE +
        "/api/v1/schedule?startDate=2022-02-01&endDate=2022-02-03"
    )
    .then((response) => {
      if (response.data) {
        console.log(response.data);
        return response.data;
      }
    });
  return responseData;
};

const checkForLiveGames = async () => {
  const currentGames = await getCurrentGames();
  if (currentGames) {
    currentGames.dates.forEach((dateEntry: NHLScheduleDateType) => {
      // Then for each game in each date, check to see if it's live
      dateEntry.games.forEach((gameEntry: NHLScheduleGameType) => {
        console.log("Game id:", gameEntry.gamePk, gameEntry.status.statusCode);

        // Code 3 or 4 is considered live
        if (GameStatusLiveCodes.includes(gameEntry.status.statusCode)) {
          console.log("Game is live");
        }
        if (GameStatusFinalCodes.includes(gameEntry.status.statusCode)) {
          console.log("Game is completed");
        }
      });
    });
  }
};

checkForLiveGames();
