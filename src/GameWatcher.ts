import { PrismaClient } from "@prisma/client";
import { GameStatusLiveCodes } from "./GameMonitor";
import { GameProcessor } from "./GameProcessor";

const GameWatcher = class {
  prisma: PrismaClient;
  gameApiId: number;
  gameProcessor: GameProcessor;

  constructor() {
    this.prisma = new PrismaClient();
    this.gameApiId = 0;

    this.gameProcessor = new GameProcessor(this.prisma);
  }

  async getGame(gameApiId: number) {
    // Assign the game api id that we're using
    this.gameApiId = gameApiId;
    console.log("Watching game: #", gameApiId);

    // Wait for the game to end
    await this.checkForUpdates();
    console.log("Completed watching game: #", gameApiId);

    return new Promise((r) => setTimeout(r, 1000));
  }

  async checkForUpdates() {
    let watchingGame = true;

    while (watchingGame) {
      try {
        let gameStatusCode = await this.gameProcessor.processLiveGame(
          this.gameApiId
        );
        console.log(
          "Completed processing live update, game status code is ",
          gameStatusCode
        );
        // If the game is still live
        if (GameStatusLiveCodes.includes(gameStatusCode)) {
          console.log("Game is still live");
          // Wait some time before trying again
          await new Promise((r) => setTimeout(r, 8000));
        } else {
          console.log("Game is no longer live");
          watchingGame = false;
        }
      } catch (e) {
        console.error(e);
        watchingGame = false;
      }
    }
  }
};

export default GameWatcher;
