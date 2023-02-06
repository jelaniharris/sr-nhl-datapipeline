import {
  Player,
  PrismaClient,
  Prisma,
  GamePlayerStat
} from "prisma/prisma-client";

export type CreateGamePlayerStatDto = {
  game_id: string;
  player_id: string;
  assists: number;
  goals: number;
  hits: number;
  misses: number;
  points: number;
  penalty_minutes: number;
};

export type UpsertGamePlayerStatDto = {
  createData: Prisma.GamePlayerStatUncheckedCreateInput;
  updateData: Prisma.GamePlayerStatUncheckedUpdateInput;
  where: Prisma.GamePlayerStatWhereUniqueInput;
};

export class GamePlayerStatService {
  constructor(private prisma: PrismaClient) {}

  async upsert(params: UpsertGamePlayerStatDto): Promise<GamePlayerStat> {
    const { createData, updateData, where } = params;
    return this.prisma.gamePlayerStat.upsert({
      update: {
        ...updateData,
        updated_at: new Date()
      },
      create: {
        ...createData,
        updated_at: new Date()
      },
      where
    });
  }
}
