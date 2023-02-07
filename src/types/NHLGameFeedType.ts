import { NHLPlayersObjectType, NHLPlayerType } from "./NHLPlayerType";
import { NHLGameStatusType } from "./NHLScheduleTypes";

export type NHLGamePlayPlayerType = {
  player: {
    id: number;
    fullName: string;
  };
  playerType: string;
};

export type NHLGamePlayType = {
  players?: [NHLGamePlayPlayerType];
  result: {
    eventTypeId: string;
    penaltySeverity: string;
    penaltyMinutes: number;
  };
  about: {
    eventIdx: number;
    dateTime: string;
  };
};

export type NHLGameTeamType = {
  id: number;
  name: string;
};

export type NHLGameFeedTeamsType = {
  away: NHLGameTeamType;
  home: NHLGameTeamType;
};

export type NHLGameFeedType = {
  gameData: {
    game: {
      pk: number;
      season: string;
    };
    teams: NHLGameFeedTeamsType;
    status: NHLGameStatusType;
    players: NHLPlayersObjectType;
  };
  liveData: {
    plays: {
      allPlays: NHLGamePlayType[];
    };
  };
};
