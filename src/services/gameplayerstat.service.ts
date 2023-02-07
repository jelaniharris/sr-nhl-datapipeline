import {
  Player,
  PrismaClient,
  Prisma,
  GamePlayerStat
} from "prisma/prisma-client";

export class CreateGamePlayerStatDto
  implements Prisma.GamePlayerStatUncheckedCreateInput
{
  game_id!: string;
  player_id!: string;
  player_team_id!: string;
  opponent_team_id!: string;
  assists?: number | undefined;
  goals?: number | undefined;
  hits?: number | undefined;
  misses?: number | undefined;
  points?: number | undefined;
  penalty_minutes?: number | undefined;
  updated_at?: string | Date | undefined;
}

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
