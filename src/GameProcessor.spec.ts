import { when } from "jest-when";
import { Game, Player, Team } from "prisma/prisma-client";
import { PlayerStatType } from "./GamePlayerStatCalculator";
import { GameProcessor } from "./GameProcessor";
import { PlayerService } from "./services/player.service";
import { NHLGameFeedType } from "./types/NHLGameFeedType";
import { NHLApi } from "./util/nhlApi";

jest.mock("./util/nhlApi");
jest.mock("./services/game.service");

const mockApiGetLiveGameFeed = NHLApi.getLiveGameFeed as jest.MockedFunction<
  typeof NHLApi.getLiveGameFeed
>;

describe("GameProcessor", () => {
  beforeEach(() => jest.resetModules());

  it("should be creatable", async () => {
    const processor = new GameProcessor();
    expect(processor).not.toBeNull();
  });

  const game: Game = {
    id: "111-111-111",
    apiId: 2099999999,
    away_team_id: "XX",
    statusCode: "4",
    home_team_id: "XX",
    created_at: new Date(),
    updated_at: new Date()
  };

  const player1: Player = {
    id: "PPP-PPP",
    apiId: 1,
    age: 99,
    name: "Old Man Pete",
    number: "04",
    position: "All of them",
    current_team_id: "XXXXX",
    created_at: new Date(),
    updated_at: new Date()
  };

  const player2: Player = {
    id: "QQQ-QQQ",
    apiId: 2,
    age: 45,
    name: "Someguy Trevor",
    number: "03",
    position: "Most of them",
    current_team_id: "YYYY",
    created_at: new Date(),
    updated_at: new Date()
  };

  const player3: Player = {
    id: "OOO-OOO",
    apiId: 3,
    age: 26,
    name: "Ima Helping",
    number: "11",
    position: "None of THem",
    current_team_id: "XXXXX",
    created_at: new Date(),
    updated_at: new Date()
  };

  const team1: Team = {
    id: "LLL-LLL",
    apiId: 1,
    name: "Right Twix",
    created_at: new Date(),
    updated_at: new Date()
  };

  const team2: Team = {
    id: "MMM-MMM",
    apiId: 2,
    name: "Left Twix",
    created_at: new Date(),
    updated_at: new Date()
  };

  const simpleLiveFeed: NHLGameFeedType = {
    gameData: {
      game: {
        pk: 2099999999,
        season: "20993000"
      },
      teams: {
        away: { id: team1.apiId, name: team1.name },
        home: { id: team2.apiId, name: team2.name }
      },
      status: { statusCode: "4", detailedState: "Live" },
      players: {
        IDXXXX: {
          id: player1.apiId,
          fullName: player1.name,
          primaryNumber: player1.number,
          currentAge: player1.age,
          currentTeam: {
            id: team1.apiId,
            name: team1.name
          },
          primaryPosition: {
            name: player1.position
          }
        },
        IDYYYY: {
          id: player2.apiId,
          fullName: player2.name,
          primaryNumber: player2.number,
          currentAge: player2.age,
          currentTeam: {
            id: team2.apiId,
            name: team2.name
          },
          primaryPosition: {
            name: player2.position
          }
        }
      }
    },
    liveData: {
      plays: {
        allPlays: [
          {
            players: [
              {
                player: {
                  id: player1.apiId,
                  fullName: player1.name
                },
                playerType: "PenaltyOn"
              },
              {
                player: {
                  id: player2.apiId,
                  fullName: player2.name
                },
                playerType: "DrewBy"
              }
            ],
            result: {
              eventTypeId: "PENALTY",
              penaltyMinutes: 2,
              penaltySeverity: ""
            },
            about: {
              eventIdx: 0,
              dateTime: "2023-02-01T01:13:45Z"
            }
          },
          {
            players: [
              {
                player: {
                  id: player1.apiId,
                  fullName: player1.name
                },
                playerType: "Scorer"
              },
              {
                player: {
                  id: player3.apiId,
                  fullName: player3.name
                },
                playerType: "Assist"
              }
            ],
            result: {
              eventTypeId: "GOAL",
              penaltyMinutes: 0,
              penaltySeverity: ""
            },
            about: {
              eventIdx: 0,
              dateTime: "2023-02-01T01:13:45Z"
            }
          }
        ]
      }
    }
  };

  // Player 2 didn't do anything so doesn't appear in the stats? Hmm..
  const mappedPlayerStats = new Map<number, PlayerStatType>();
  mappedPlayerStats.set(player1.apiId, {
    hits: 0,
    misses: 0,
    assists: 0,
    goals: 1,
    points: 1,
    penalty_minutes: 2
  });
  mappedPlayerStats.set(player3.apiId, {
    hits: 0,
    misses: 0,
    assists: 1,
    goals: 0,
    points: 1,
    penalty_minutes: 0
  });

  describe("processLiveGame()", () => {
    const findOneByApiIdSpy = jest.spyOn(
      PlayerService.prototype,
      "findOneByApiId"
    );

    // When database uses the playerService to find players by id
    // we can just hand these over instead
    when(findOneByApiIdSpy).calledWith(1).mockResolvedValue(player1);
    when(findOneByApiIdSpy).calledWith(2).mockResolvedValue(player2);
    when(findOneByApiIdSpy).calledWith(3).mockResolvedValue(player3);

    const processor = new GameProcessor();

    // Return a created game
    const ensureGameExistsSpy = jest
      .spyOn(processor, "ensureGameExists")
      .mockResolvedValue(game);

    // Return the two teams we made
    const ensureTeamExistsSpy = jest
      .spyOn(processor, "ensureTeamExists")
      .mockResolvedValueOnce(team1)
      .mockResolvedValueOnce(team2);

    // Return our list of players
    const ensurePlayersExistsSpy = jest
      .spyOn(processor, "ensurePlayersExists")
      .mockResolvedValue([player1, player2, player3]);
    // Make our generaate stat data function do nothing - no db access
    const generateGamePlayerStatDataSpy = jest
      .spyOn(processor, "generateGamePlayerStatData")
      .mockResolvedValue();

    it("attempts to get the live gamefeed of a given gameid", async () => {
      mockApiGetLiveGameFeed.mockResolvedValue(simpleLiveFeed);
      await processor.processLiveGame(2099999999);
      expect(mockApiGetLiveGameFeed).toBeCalledWith(2099999999);
    });
    it("attempts to generate player stat data", async () => {
      expect(generateGamePlayerStatDataSpy).toBeCalledTimes(2);
    });
    it("attempts to store correct player stat data", async () => {
      expect(generateGamePlayerStatDataSpy.mock.calls).toEqual([
        [
          game.id,
          player1,
          mappedPlayerStats.get(player1.apiId),
          { awayTeamData: team1, homeTeamData: team2 }
        ],
        [
          game.id,
          player3,
          mappedPlayerStats.get(player3.apiId),
          { awayTeamData: team1, homeTeamData: team2 }
        ]
      ]);
    });
  });
});
