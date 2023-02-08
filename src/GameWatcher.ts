import * as dotenv from "dotenv";
dotenv.config();

import { GameStatusLiveCodes } from "./GameMonitor";
import { GameProcessor } from "./GameProcessor";

const GameWatcher = class {
  gameApiId: number;
  gameProcessor: GameProcessor;

  constructor() {
    this.gameApiId = 0;
    this.gameProcessor = new GameProcessor();
  }

  /**
   * Starts the process for checking a game for updates
   * @param gameApiId number
   */
  async getGame(gameApiId: number) {
    // Assign the game api id that we're using
    this.gameApiId = gameApiId;
    console.log("Watching game: #", gameApiId);

    // Wait for the game to end
    await this.checkForUpdates();

    console.log("Completed watching game: #", gameApiId);
  }

  /**
   * Runs the game processor until the game is finished.
   */
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
          console.log(`Game ${this.gameApiId} is still live`);
          // Wait some time before trying again
          await new Promise((r) =>
            setTimeout(r, Number(process.env.NHL_API_LIVE_POLL_RATE))
          );
        } else {
          console.log(`Game ${this.gameApiId} is no longer live`);
          watchingGame = false;
        }
      } catch (e) {
        // Make sure we leave the game watch loop on an error
        console.error(e);
        watchingGame = false;
      }
    }
  }
};

export default GameWatcher;
