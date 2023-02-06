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
import { Game, Player, PrismaClient } from "@prisma/client";
import { NHLApi } from "./util/nhlApi";
import { GameStatusLiveCodes } from "./GameMonitor";

export class GameProcessor {
  prisma: PrismaClient;
  playerService: PlayerService;
  gameService: GameService;
  gameEventService: GameEventService;
  gamePlayerStatService: GamePlayerStatService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.playerService = new PlayerService(this.prisma);
    this.gameService = new GameService(this.prisma);
    this.gameEventService = new GameEventService(this.prisma);
    this.gamePlayerStatService = new GamePlayerStatService(this.prisma);
  }

  async findOrCreateGame(gamePk: number, status: NHLGameStatusType) {
    const foundGameData = await this.gameService.findOneByApiId(gamePk);
    if (foundGameData) {
      console.log("Found game entry");
      return foundGameData;
    }
    console.log("Creating game entry");
    return this.gameService.create({
      apiId: gamePk,
      statusCode: status.statusCode
    });
  }

  async findOrCreatePlayer(playerData: NHLPlayerType) {
    const foundPlayerData = await this.playerService.findOneByApiId(
      playerData.id
    );
    if (foundPlayerData) {
      return foundPlayerData;
    }
    console.log("Creating player: ", playerData.id);
    return this.playerService.create({
      apiId: playerData.id,
      name: playerData.fullName,
      age: playerData.currentAge,
      number: playerData.primaryNumber,
      position: playerData.primaryPosition.name
    });
  }

  /**
   * Creates or updates a player stat entry using the event table data
   * @param gameId string(uuid)
   * @param playerId string(uuid)
   */
  async generateGamePlayerStatLiveData(gameId: string, playerId: string) {
    const livePlayerStat = await this.gameEventService.getStats(
      gameId,
      playerId
    );

    let newStat: CreateGamePlayerStatDto = {
      game_id: gameId,
      player_id: playerId,
      assists: 0,
      goals: 0,
      hits: 0,
      misses: 0,
      points: 0,
      penalty_minutes: 0
    };

    for (const playerStat in livePlayerStat) {
      const gamePlayerStat = livePlayerStat[playerStat];

      // aggregate data from groups when using a raw query in prisma
      // returns numeric values as a bigint. This is weird.
      // e.g. {event_type: "HIT", total: 2n, amount: 0n}
      switch (gamePlayerStat.event_type) {
        case "HIT":
          newStat.hits = Number(gamePlayerStat.total);
          break;
        case "MISS":
          newStat.misses = Number(gamePlayerStat.total);
          break;
        case "GOAL":
          newStat.goals = Number(gamePlayerStat.total);
          break;
        case "ASSIST":
          newStat.assists = Number(gamePlayerStat.total);
          break;
        case "PENALTY":
          newStat.penalty_minutes = Number(gamePlayerStat.amount);
          break;
      }
    }

    // Get a point total from goals and assists
    newStat.points = newStat.goals + newStat.assists;

    await this.gamePlayerStatService.upsert({
      createData: {
        ...newStat
      },
      updateData: {
        ...newStat
      },
      where: {
        game_id_player_id: {
          game_id: gameId,
          player_id: playerId
        }
      }
    });
  }

  async parseGameEvents(play: NHLGamePlayType, gameId: string) {
    const findPlayerType = async (
      desiredPlayerType: string
    ): Promise<Player | null> => {
      const foundPlayer = play.players?.find(
        (player) => player.playerType === desiredPlayerType
      );

      if (foundPlayer) {
        return this.playerService.findOneByApiId(foundPlayer.player.id);
      }

      return null;
    };

    let parsedEvents: CreateGameEventDto[] = [];

    let newEvent: CreateGameEventDto = {
      event_type: "UNKNOWN",
      event_index: play.about.eventIdx,
      event_amount: 0,
      player_id: "",
      game_id: gameId,
      occured_at: new Date(play.about.dateTime)
    };
    switch (play.result.eventTypeId) {
      case "MISSED_SHOT":
        newEvent = {
          ...newEvent,
          event_type: "MISS"
        };
        const shootingPlayer = await findPlayerType("Shooter");
        if (shootingPlayer) {
          newEvent.player_id = shootingPlayer.id;
          parsedEvents.push(newEvent);
        }
        //Shooter
        //Unknown?
        break;
      case "HIT":
        newEvent = {
          ...newEvent,
          event_type: "HIT"
        };
        const hitPlayer = await findPlayerType("Hitter");
        if (hitPlayer) {
          newEvent.player_id = hitPlayer.id;
          parsedEvents.push(newEvent);
        }
        break;
      case "GOAL":
        // Give credit to scorer
        const scoreEvent = {
          ...newEvent,
          event_type: "GOAL"
        };
        const scoringPlayer = await findPlayerType("Scorer");
        if (scoringPlayer) {
          scoreEvent.player_id = scoringPlayer.id;
          parsedEvents.push(scoreEvent);
        }

        // Then give assits to all of the other players with assists
        if (play.players) {
          for (const player of play.players) {
            if (player.playerType === "Assist") {
              const assistEvent = {
                ...newEvent,
                event_type: "ASSIST"
              };
              const assistPlayer = await this.playerService.findOneByApiId(
                player.player.id
              );
              if (assistPlayer) {
                assistEvent.player_id = assistPlayer.id;
                parsedEvents.push(assistEvent);
              }
            }
          }
        }
        break;
      case "PENALTY":
        newEvent = {
          ...newEvent,
          event_type: "PENALTY"
        };
        const penaltyOnPlayer = await findPlayerType("PenaltyOn");
        if (penaltyOnPlayer) {
          newEvent.player_id = penaltyOnPlayer.id;
          newEvent.event_amount = play.result.penaltyMinutes;
          parsedEvents.push(newEvent);
        }
        break;
    }
    return parsedEvents;
  }

  async ensureGameExists(data: NHLGameFeedType): Promise<Game | null> {
    // Ensure game db entry exists
    return this.findOrCreateGame(data.gameData.game.pk, data.gameData.status);
  }

  async processLiveGame(apiGameId: number): Promise<string> {
    const data = await NHLApi.getLiveGameFeed(apiGameId);

    if (!data) {
      throw new Error(`Could not get feed for gameId: ${apiGameId}`);
    }

    // Ensure game db entry exists
    const gameData: Game | null = await this.ensureGameExists(data);
    if (!gameData) {
      throw new Error(`Could not find or create game ${apiGameId}`);
    }

    let playerListIds: string[] = [];

    // Get the list of players and ensure they are made
    const playerArray = Object.keys(data.gameData.players);
    for (const playerKey in playerArray) {
      const playerData = data.gameData.players[playerKey];
      const createdPlayer = await this.findOrCreatePlayer(playerData);
      if (createdPlayer) {
        playerListIds.push(createdPlayer.id);
      }
    }

    // Go through all of the plays
    const plays: NHLGamePlayType[] = data.liveData.plays.allPlays;
    for (const play in plays) {
      const newGameEvents = await this.parseGameEvents(
        plays[play],
        gameData.id
      );
      for (const newEvent in newGameEvents) {
        const gameEvent = newGameEvents[newEvent];

        // Check to see if this event already exists
        const foundEvent = await this.gameEventService.findOne({
          game_id: gameEvent.game_id,
          player_id: gameEvent.player_id,
          event_index: gameEvent.event_index
        });

        // Even not found, then create it
        if (!foundEvent) {
          await this.gameEventService.create(gameEvent);
        }
      }
    }

    // Update each player's aggregate stats
    for (const id in playerListIds) {
      await this.generateGamePlayerStatLiveData(gameData.id, playerListIds[id]);
    }

    // Update game data entry with retrieved status code
    await this.gameService.update({
      data: { statusCode: data.gameData.status.statusCode },
      where: { id: gameData.id }
    });

    return data.gameData.status.statusCode;
  }
}
