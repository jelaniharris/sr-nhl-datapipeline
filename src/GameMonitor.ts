import * as dotenv from "dotenv";
dotenv.config();
import { ChildProcess, fork } from "child_process";

import {
  NHLScheduleDateType,
  NHLScheduleGameType
} from "./types/NHLScheduleTypes";
import { NHLApi } from "./util/nhlApi";
import path from "path";

export const GameStatusLiveCodes = ["3", "4"];
export const GameStatusScheduledCodes = ["1"];
export const GameStatusFinalCodes = ["6", "7"];

const GameMonitor = class {
  monitoredGamesProcesses: ChildProcess[];

  constructor() {
    this.monitoredGamesProcesses = [];
  }

  private async _spawnGameWatcher(gameId: number) {
    // Check if the monitored game does not exist
    if (!this.monitoredGamesProcesses[gameId]) {
      console.log("Spawning subprocess for: ", gameId);
      let GameProcessPath = path.resolve(__dirname + "/live.ts");
      let child = fork(GameProcessPath, [`${gameId}`], {
        stdio: ["inherit", "inherit", "inherit", "ipc"],
        execArgv: ["-r", "ts-node/register"]
      });

      // On process exit, remove the process from our list of monitored games
      child.on("exit", (exit) => {
        console.log("Subprocess is completed");
        delete this.monitoredGamesProcesses[gameId];
      });

      this.monitoredGamesProcesses[gameId] = child;
    } else {
      console.log("Process already exists for game: ", gameId);
    }
  }

  async checkForLiveGames() {
    const currentGames = await NHLApi.getCurrentGames();
    if (currentGames) {
      currentGames.dates.forEach((dateEntry: NHLScheduleDateType) => {
        // Then for each game in each date, check to see if it's live
        dateEntry.games.forEach((gameEntry: NHLScheduleGameType) => {
          console.log(
            "Games #",
            gameEntry.gamePk,
            gameEntry.status.detailedState,
            gameEntry.link
          );

          // Code 3 or 4 is considered live
          if (GameStatusLiveCodes.includes(gameEntry.status.statusCode)) {
            this._spawnGameWatcher(gameEntry.gamePk);
          }
        });
      });
    }
  }
};

export default GameMonitor;
