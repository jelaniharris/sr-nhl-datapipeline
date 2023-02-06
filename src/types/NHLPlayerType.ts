import { NHLPositionType, NHLTeamType } from "./NHLTypes";

export type NHLPlayerType = {
  id: number;
  fullName: string;
  primaryNumber: string;
  currentAge: number;
  currentTeam: NHLTeamType;
  primaryPosition: NHLPositionType;
};

export type NHLPlayersObjectType = {
  [stuff in string]: NHLPlayerType;
};
