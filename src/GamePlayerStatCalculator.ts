import { Player } from "prisma/prisma-client";
import PrismaService from "./libs/prisma";
import { PlayerService } from "./services/player.service";
import { NHLGamePlayType } from "./types/NHLGameFeedType";

export type PlayerStatType = {
  hits: number;
  misses: number;
  goals: number;
  assists: number;
  penalty_minutes: number;
  points: number;
};

export class GamePlayerStatCalculator {
  playerService: any;
  playerStats: Map<number, PlayerStatType>;

  constructor() {
    this.playerStats = new Map<number, PlayerStatType>();
    this.playerService = new PlayerService(PrismaService);
  }

  /**
   * Find all players in a live play event listing that matches the given playerType.
   * Like get all of the players who got an "assist" on a goal event
   * @param play NHLGamePlayType
   * @param desiredPlayerType string
   * @returns Promise<Player[] | null>
   */
  async findPlayersByPlayerType(
    play: NHLGamePlayType,
    desiredPlayerType: string
  ): Promise<Player[] | null> {
    // Filter players by desired play type
    const foundPlayers = play.players?.filter(
      (player) => player.playerType === desiredPlayerType
    );

    if (foundPlayers && foundPlayers.length > 0) {
      let playerDatas = [];

      for (const foundPlayer of foundPlayers) {
        // Find each player in the database by their appid
        const playerData = await this.playerService.findOneByApiId(
          foundPlayer.player.id
        );
        // Add to list if it exists
        if (playerData) {
          playerDatas.push(playerData);
        }
      }

      return playerDatas;
    }

    // No players were found with the playerType so return nothing
    return null;
  }

  /**
   * Increases a stat by the amount in the playerStats map
   * @param eventType string
   * @param playerType string
   * @param playerApiId number
   * @param amount amount
   */
  private async _increaseValue(
    eventType: string,
    playerType: string,
    playerApiId: number,
    amount: number
  ) {
    // Player status does not exist in map
    if (!this.playerStats.has(playerApiId)) {
      // Reset the entry with empty numbers
      this.playerStats.set(playerApiId, {
        hits: 0,
        misses: 0,
        assists: 0,
        goals: 0,
        points: 0,
        penalty_minutes: 0
      });
    }

    // Get the current stat
    let stats = <PlayerStatType>this.playerStats.get(playerApiId);

    // Based off of the event, increase the stats by the amount
    switch (eventType) {
      case "HIT":
        stats.hits = stats.hits + amount;
        break;
      case "MISSED_SHOT":
        stats.misses = stats.misses + amount;
        break;
      case "GOAL":
        // Points = Goals + Assists
        if (playerType === "Scorer") {
          stats.goals = stats.goals + amount;
          stats.points = stats.points + amount;
        } else if (playerType === "Assist") {
          stats.assists = stats.assists + amount;
          stats.points = stats.points + amount;
        }
        break;
      case "PENALTY":
        stats.penalty_minutes = stats.penalty_minutes + amount;
        break;
      default:
    }

    // Assign new updated stats
    this.playerStats.set(playerApiId, stats);
  }

  /**
   * Given a live event play, increase the corresponding player's stat by the amount
   * @param play NHLGamePlayType
   * @param playerType string
   * @param eventType string
   * @param amount number
   */
  async findPlayersIncreaseValue(
    play: NHLGamePlayType,
    playerType: string,
    eventType: string,
    amount: number
  ) {
    const playersData = await this.findPlayersByPlayerType(play, playerType);
    if (playersData) {
      for (const playerData of playersData) {
        if (playerData) {
          await this._increaseValue(
            eventType,
            playerType,
            playerData.apiId,
            amount
          );
        }
      }
    }
  }

  /**
   * Loops through the list of plays and increases a player's stat based off of the
   * event type, and the player type. e.g. A GOAL event raises stats for the scoring
   * players and the ones with an assist
   * @param plays
   * @returns Promise<Map<number, PlayerStatType>>
   */
  async getPlayerStats(
    plays: NHLGamePlayType[]
  ): Promise<Map<number, PlayerStatType>> {
    // Empty out the old stats
    this.playerStats.clear();

    for (const play of plays) {
      switch (play.result.eventTypeId) {
        case "HIT":
          await this.findPlayersIncreaseValue(
            play,
            "Hitter",
            play.result.eventTypeId,
            1
          );
          break;
        case "GOAL":
          await this.findPlayersIncreaseValue(
            play,
            "Scorer",
            play.result.eventTypeId,
            1
          );
          await this.findPlayersIncreaseValue(
            play,
            "Assist",
            play.result.eventTypeId,
            1
          );
          break;
        case "MISSED_SHOT":
          await this.findPlayersIncreaseValue(
            play,
            "Shooter",
            play.result.eventTypeId,
            1
          );
          break;

        case "PENALTY":
          await this.findPlayersIncreaseValue(
            play,
            "PenaltyOn",
            play.result.eventTypeId,
            play.result.penaltyMinutes
          );
          break;
      }
    }

    return this.playerStats;
  }
}
