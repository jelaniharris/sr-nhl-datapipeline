import {
  NHLGameFeedTeamsType,
  NHLGameFeedType,
  NHLGameStatusType,
  NHLGameTeamType
} from "./types/NHLGameFeedType";
import { NHLPlayersObjectType, NHLPlayerType } from "./types/NHLPlayerType";
import { PlayerService } from "./services/player.service";
import { GameService } from "./services/game.service";
import {
  CreateGamePlayerStatDto,
  GamePlayerStatService
} from "./services/gameplayerstat.service";
import { Game, Player, Team } from "@prisma/client";
import { NHLApi } from "./util/nhlApi";
import { NHLTeamType } from "./types/NHLTypes";
import { TeamService } from "./services/team.service";
import {
  GamePlayerStatCalculator,
  PlayerStatType
} from "./GamePlayerStatCalculator";
import PrismaService from "./libs/prisma";

export class GameProcessor {
  playerService: PlayerService;
  gameService: GameService;
  gamePlayerStatService: GamePlayerStatService;
  teamService: TeamService;
  gamePlayerStatCalculator: GamePlayerStatCalculator;

  constructor() {
    this.playerService = new PlayerService(PrismaService);
    this.gameService = new GameService(PrismaService);
    this.teamService = new TeamService(PrismaService);
    this.gamePlayerStatService = new GamePlayerStatService(PrismaService);

    this.gamePlayerStatCalculator = new GamePlayerStatCalculator();
  }

  /**
   * Finds or creates a new game. Also ensures teams exist in db as well.
   * @param gamePk string
   * @param status NHLGameStatusType
   * @param teams NHLGameFeedTeamsType
   * @returns Promise<Game>
   */
  async findOrCreateGame(
    gamePk: number,
    status: NHLGameStatusType,
    teams: NHLGameFeedTeamsType
  ): Promise<Game> {
    const foundGameData = await this.gameService.findOneByApiId(gamePk);
    if (foundGameData) {
      return foundGameData;
    }

    console.log("Creating new game entry: ", gamePk);

    // Ensure away team exists
    const awayTeam = await this.ensureTeamExists(teams.away);
    if (!awayTeam) {
      throw new Error(`Could not find or create away team: ${teams.away}`);
    }

    // Ensure home team exists
    const homeTeam = await this.ensureTeamExists(teams.home);
    if (!homeTeam) {
      throw new Error(`Could not find or create home team: ${teams.home}`);
    }

    return this.gameService.create({
      apiId: gamePk,
      statusCode: status.statusCode,
      home_team_id: homeTeam.id,
      away_team_id: awayTeam.id
    });
  }

  /**
   * Finds or Creates a Team
   * @param teamData NHLGameTeamType
   * @returns Promise<Team>
   */
  async findOrCreateTeam(teamData: NHLGameTeamType): Promise<Team> {
    return this.teamService.firstOrCreate({
      createData: {
        apiId: teamData.id,
        name: teamData.name
      },
      where: {
        apiId: teamData.id
      }
    });
  }

  /**
   * Finds a player in the database or creates it, returns the player found or made.
   * @param playerData NHLPlayerType
   * @returns Promise<Player>
   */
  async findOrCreatePlayer(playerData: NHLPlayerType): Promise<Player> {
    const foundPlayerData = await this.playerService.findOneByApiId(
      playerData.id
    );
    if (foundPlayerData) {
      return foundPlayerData;
    }

    console.log("Creating new player: ", playerData.id);

    const currentTeam = await this.ensureTeamExists(playerData.currentTeam);
    if (!currentTeam) {
      throw new Error(
        `Could not find or create team ${playerData.currentTeam}`
      );
    }

    return this.playerService.create({
      apiId: playerData.id,
      name: playerData.fullName,
      age: playerData.currentAge,
      number: playerData.primaryNumber,
      current_team_id: currentTeam.id,
      position: playerData.primaryPosition.name
    });
  }

  /**
   * Creates or updates a player stat entry using the event table data
   * @param gameId string(uuid)
   * @param playerId string(uuid)
   */
  async generateGamePlayerStatData(
    gameId: string,
    playerData: Player,
    stat: PlayerStatType,
    teams: { awayTeamData: Team | null; homeTeamData: Team | null }
  ) {
    let playerTeamId: string = "";
    let opponentTeamId: string = "";

    // Check that we have valid away team data
    if (!teams.awayTeamData) {
      throw new Error(
        `Cannot make game player stat with unknown away team data`
      );
    }

    // Check that we have valid home team data
    if (!teams.homeTeamData) {
      throw new Error(
        `Cannot make game player stat with unknown home team data`
      );
    }

    // Determine team - it's a bit crunchy
    if (playerData.current_team_id == teams.awayTeamData?.id) {
      playerTeamId = teams.awayTeamData?.id;
      opponentTeamId = teams.homeTeamData?.id;
    } else {
      playerTeamId = teams.homeTeamData?.id;
      opponentTeamId = teams.awayTeamData?.id;
    }

    let newStat: CreateGamePlayerStatDto = {
      game_id: gameId,
      player_id: playerData.id,
      assists: stat.assists,
      goals: stat.goals,
      hits: stat.hits,
      misses: stat.misses,
      points: stat.points,
      penalty_minutes: stat.penalty_minutes,
      player_team_id: playerTeamId,
      opponent_team_id: opponentTeamId
    };

    // Create or update the aggregate stat in the database
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
          player_id: playerData.id
        }
      }
    });
  }

  /**
   * Ensures that a game exists in the database by finding or making it
   * @param data NHLGameFeedType
   * @returns Promise<Game | null>
   */
  async ensureGameExists(data: NHLGameFeedType): Promise<Game | null> {
    // Ensure game db entry exists
    return this.findOrCreateGame(
      data.gameData.game.pk,
      data.gameData.status,
      data.gameData.teams
    );
  }

  /**
   * Ensures that a team exists by finding or making it
   * @param data NHLTeamType
   * @returns Promise<Team | null>
   */
  async ensureTeamExists(data: NHLTeamType): Promise<Team | null> {
    // Ensures a team entry exists
    return this.findOrCreateTeam(data);
  }

  /**
   * Ensures that a player exists for finding it or making it
   * @param playersData NHLPlayersObjectType
   * @returns Promise<Player[]>
   */
  async ensurePlayersExists(
    playersData: NHLPlayersObjectType
  ): Promise<Player[]> {
    let playerList: Player[] = [];

    // Get the list of players from the player data
    // It's in an odd format in which  it's not in an array, but an object.
    // The key to index each player data isn't a type but a hash of the ID
    // e.g. [{"ID8482093": {id,name,currentAge,...}, {"ID8481481": ...}}]
    const playerArray = Object.keys(playersData);

    for (const playerKey of playerArray) {
      // Use key to get the value of the data
      const playerData = playersData[playerKey];
      const createdPlayer = await this.findOrCreatePlayer(playerData);
      if (createdPlayer) {
        playerList.push(createdPlayer);
      }
    }
    return playerList;
  }

  /**
   * Given a game id, processes the data from the api feed.
   * Also updates the game db with the current game status at the end
   * @param apiGameId
   * @returns Promise<string>
   */
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

    // Ensure team db entry exists
    let teamData = {
      awayTeamData: await this.ensureTeamExists(data.gameData.teams.away),
      homeTeamData: await this.ensureTeamExists(data.gameData.teams.home)
    };

    // Get the list of players and ensure they are made or exist in db
    let playerList: Player[] = await this.ensurePlayersExists(
      data.gameData.players
    );

    // If this game has plays
    if (data.liveData.plays.allPlays) {
      // Go through all of the players and gather data about the stats per player
      const playerStats: Map<number, PlayerStatType> =
        await this.gamePlayerStatCalculator.getPlayerStats(
          data.liveData.plays.allPlays
        );

      // Go through all of the stats
      // This could probably be parallel with Promise.all
      for (const [playerId, stat] of playerStats) {
        // Find apiId in our list of players in this game
        const playerData = playerList.find((pl) => pl.apiId === playerId);
        if (playerData) {
          // Generate the entry for this player in this game
          await this.generateGamePlayerStatData(
            gameData.id,
            playerData,
            stat,
            teamData
          );
        }
      }
    }

    // Update game data entry with retrieved status code
    await this.gameService.update({
      data: { statusCode: data.gameData.status.statusCode },
      where: { id: gameData.id }
    });

    // Return the current status of this game
    return data.gameData.status.statusCode;
  }
}
