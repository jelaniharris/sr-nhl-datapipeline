import { Game, GameEvent, Prisma, PrismaClient } from "prisma/prisma-client";

export type CreateGameEventDto = {
  event_type: string;
  event_index: number;
  event_amount: number;
  game_id: string;
  player_id: string;
  occured_at: string | Date;
};

export type groupByParams = {
  where?: Prisma.GameEventWhereInput;
};

export type GroupByEventTypeType = {
  event_type: string;
  total: number;
  amount: number;
};

export class GameEventService {
  constructor(private prisma: PrismaClient) {}

  async create(data: any): Promise<GameEvent> {
    return this.prisma.gameEvent.create({
      data: {
        ...data,
        created_at: new Date()
      }
    });
  }

  async findOne(where: Prisma.GameEventWhereInput): Promise<GameEvent | null> {
    return this.prisma.gameEvent.findFirst({
      where
    });
  }

  async getStats(
    game_id: string,
    player_id: string
  ): Promise<GroupByEventTypeType[]> {
    const result = await this.prisma.$queryRaw<
      GroupByEventTypeType[]
    >(Prisma.sql`
      SELECT ge.event_type, COUNT(ge.id) as total, SUM(ge.event_amount) as amount 
      FROM gameevents ge
      WHERE player_id=${player_id} and game_id=${game_id}
      GROUP BY ge.event_type
      `);
    return result;
  }
}
