import * as dotenv from "dotenv";
dotenv.config();
import { ChildProcess, exec, execFile, fork, spawn } from "child_process";
import { Game, Player, PrismaClient } from "prisma/prisma-client";

import {
  NHLGameStatusType,
  NHLScheduleDateType,
  NHLScheduleGameType,
  NHLScheduleType
} from "./types/NHLScheduleTypes";
import { NHLGameFeedType, NHLGamePlayType } from "./types/NHLGameFeedType";
import { NHLPlayerType } from "./types/NHLPlayerType";
import { PlayerService } from "./services/player.service";
import { GameService } from "./services/game.service";
import {
  CreateGameEventDto,
  GameEventService
} from "./services/gameevent.service";
import {
  CreateGamePlayerStatDto,
  GamePlayerStatService
} from "./services/gameplayerstat.service";
import { NHLApi } from "./util/nhlApi";
import path from "path";

export const GameStatusLiveCodes = ["3", "4"];
export const GameStatusScheduledCodes = ["1"];
export const GameStatusFinalCodes = ["6", "7"];

const GameMonitor = class {
  monitoredGamesProcesses: ChildProcess[];
  prisma: PrismaClient;
  playerService: PlayerService;
  gameService: GameService;
  gameEventService: GameEventService;
  gamePlayerStatService: GamePlayerStatService;

  constructor() {
    this.monitoredGamesProcesses = [];
    this.prisma = new PrismaClient();

    this.playerService = new PlayerService(this.prisma);
    this.gameService = new GameService(this.prisma);
    this.gameEventService = new GameEventService(this.prisma);
    this.gamePlayerStatService = new GamePlayerStatService(this.prisma);
  }

  async spawnGameWatcher(gameId: number) {
    // Check if the monitored game does not exist
    if (!this.monitoredGamesProcesses[gameId]) {
      console.log("Spawning process for: ", gameId);
      let GameProcessPath = path.resolve(__dirname + "/live.ts");
      let child = fork(GameProcessPath, [`${gameId}`], {
        stdio: ["inherit", "inherit", "inherit", "ipc"],
        execArgv: ["-r", "ts-node/register"]
      });

      // On process exit, remove the process from our list of monitored games
      child.on("exit", (exit) => {
        console.log("Child is done");
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
            "Games:",
            gameEntry.gamePk,
            gameEntry.status.detailedState,
            gameEntry.link
          );

          // Code 3 or 4 is considered live
          if (GameStatusLiveCodes.includes(gameEntry.status.statusCode)) {
            this.spawnGameWatcher(gameEntry.gamePk);
          }

          /*if (GameStatusFinalCodes.includes(gameEntry.status.statusCode)) {
            console.log("Game is completed");

            if (gameEntry.gamePk === 2022020807) {
              this.processLiveGame(gameEntry.gamePk);
            }
          }
          if (GameStatusScheduledCodes.includes(gameEntry.status.statusCode)) {
            console.log("Game is scheduled.");
            if (gameEntry.gamePk === 2022020807) {
              this.spawnGameWatcher(gameEntry.gamePk);
              //this.processLiveGame(gameEntry.gamePk);
            }
          }*/
        });
      });
    }
  }
};

export default GameMonitor;
