export type NHLScheduleType = {
  dates: Array<NHLScheduleDateType>;
};

export type NHLScheduleDateType = {
  games: Array<NHLScheduleGameType>;
};

export type NHLScheduleGameType = {
  gamePk: number;
  status: NHLGameStatusType;
  link: string;
};

export type NHLGameStatusType = {
  statusCode: string;
};
