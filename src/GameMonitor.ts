import * as dotenv from "dotenv";
import axios from "axios";
dotenv.config();
import { exec, execFile, fork, spawn } from "child_process";
import { Game, Player, PrismaClient } from "prisma/prisma-client";

import {
  NHLGameStatusType,
  NHLScheduleDateType,
  NHLScheduleGameType,
  NHLScheduleType
} from "./types/NHLScheduleTypes";
import { NHLGameFeedType, NHLGamePlayType } from "./types/NHLGameFeedType";
import { NHLPlayerType } from "./types/NHLPlayerType";
import { CreatePlayerDto, PlayerService } from "./services/player.service";
import { GameService } from "./services/game.service";
import {
  CreateGameEventDto,
  GameEventService
} from "./services/gameevent.service";
import {
  CreateGamePlayerStatDto,
  GamePlayerStatService
} from "./services/gameplayerstat.service";
import format from "date-fns/format";

const GameStatusLiveCodes = ["3", "4"];
const GameStatusFinalCodes = ["6", "7"];

const GameMonitor = class {
  monitoredGamesProcesses: [];
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

  // GET https://statsapi.web.nhl.com/api/v1/game/ID/feed/live/diffPatch?startTimecode=yyyymmdd_hhmmss
  // Returns updates (like new play events, updated stats for boxscore, etc.) for the specified game ID since the given startTimecode.

  //https://statsapi.web.nhl.com/api/v1/game/ID/boxscore
  //Returns far less detail than feed/live and is much more suitable for post-game details including goals, shots, PIMs, blocked, takeaways, giveaways and hits.

  async getPlayerStatsForSeason(
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

  async getLiveGameFeed(gameId: number): Promise<NHLGameFeedType> {
    const responseData = await axios
      .get(process.env.NHL_API_URL_BASE + `/api/v1/game/${gameId}/feed/live`)
      .then((response) => {
        if (response.data) {
          return response.data;
        }
      });
    return responseData;
  }

  async getCurrentGames(): Promise<NHLScheduleType> {
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

  async spawnGameWatcher(gameId: number) {
    // Check if the monitored game exists
    if (!this.monitoredGamesProcesses[gameId]) {
      //this.monitoredGamesProcesses[gameId] = spawn('')
    }
  }

  async checkForLiveGames() {
    const currentGames = await this.getCurrentGames();
    if (currentGames) {
      currentGames.dates.forEach((dateEntry: NHLScheduleDateType) => {
        // Then for each game in each date, check to see if it's live
        dateEntry.games.forEach((gameEntry: NHLScheduleGameType) => {
          console.log(
            "Game id is:",
            gameEntry.gamePk,
            gameEntry.status.statusCode,
            gameEntry.link
          );

          // Code 3 or 4 is considered live
          if (GameStatusLiveCodes.includes(gameEntry.status.statusCode)) {
            console.log("Game is live");
          }
          if (GameStatusFinalCodes.includes(gameEntry.status.statusCode)) {
            console.log("Game is completed");

            if (gameEntry.gamePk === 2021020799) {
              this.processLiveGame(gameEntry.gamePk);
            }
          }
        });
      });
    }
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

  async processLiveGame(apiGameId: number) {
    const data = await this.getLiveGameFeed(apiGameId);

    if (!data) {
      throw new Error(`Could not get feed for gameId: ${apiGameId}`);
    }

    // Ensure game db entry exists
    const gameData: Game = await this.findOrCreateGame(
      data.gameData.game.pk,
      data.gameData.status
    );

    // Check the status of the game
    console.log("Game status is fun :", data.gameData.status.statusCode);

    let playerListIds: string[] = [];

    // Get the list of players and ensure they are made
    const playerArray = Object.keys(data.gameData.players);
    playerArray.forEach(async (playerKey) => {
      const playerData = data.gameData.players[playerKey];
      const createdPlayer = await this.findOrCreatePlayer(playerData);
      if (createdPlayer) {
        playerListIds.push(createdPlayer.id);
      }
    });

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

  async checkLiveGame(gameId: number) {
    //https://statsapi.web.nhl.com//api/v1/game/2021040661/feed/live
  }
};

export default GameMonitor;
