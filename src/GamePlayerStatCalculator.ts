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

  async findPlayersByPlayerType(
    play: NHLGamePlayType,
    desiredPlayerType: string
  ): Promise<Player[] | null> {
    const foundPlayers = play.players?.filter(
      (player) => player.playerType === desiredPlayerType
    );

    if (foundPlayers && foundPlayers.length > 0) {
      let playerDatas = [];

      for (const foundPlayer of foundPlayers) {
        const playerData = await this.playerService.findOneByApiId(
          foundPlayer.player.id
        );
        if (playerData) {
          playerDatas.push(playerData);
        }
      }

      return playerDatas;
    }

    return null;
  }

  async increaseValue(
    eventType: string,
    playerType: string,
    playerApiId: number,
    amount: number
  ) {
    // Player status does not exist in map
    if (!this.playerStats.has(playerApiId)) {
      // Reset the entry
      this.playerStats.set(playerApiId, {
        hits: 0,
        misses: 0,
        assists: 0,
        goals: 0,
        points: 0,
        penalty_minutes: 0
      });
    }

    let stats = <PlayerStatType>this.playerStats.get(playerApiId);
    switch (eventType) {
      case "HIT":
        stats.hits = stats.hits + amount;
        break;
      case "MISSED_SHOT":
        stats.misses = stats.misses + amount;
        break;
      case "GOAL":
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
    this.playerStats.set(playerApiId, stats);
  }

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
          await this.increaseValue(
            eventType,
            playerType,
            playerData.apiId,
            amount
          );
        }
      }
    }
  }

  async getPlayerStats(plays: NHLGamePlayType[]) {
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
