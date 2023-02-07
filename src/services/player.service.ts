import { Player, PrismaClient, Prisma } from "prisma/prisma-client";

export type CreatePlayerDto = {
  player_id?: string;
  eventType: string;
  eventIndex: number;
  eventAmount: number;
  occuredAt: string | Date;
};

export class PlayerService {
  constructor(private prisma: PrismaClient) {}

  async create(data: Prisma.PlayerUncheckedCreateInput): Promise<Player> {
    return this.prisma.player.create({
      data: {
        ...data,
        created_at: new Date(),
        updated_at: new Date()
      }
    });
  }

  async findOne(id: string): Promise<Player | null> {
    return this.prisma.player.findFirst({
      where: {
        id: id
      }
    });
  }

  async findOneByApiId(id: number): Promise<Player | null> {
    return this.prisma.player.findFirst({
      where: {
        apiId: id
      }
    });
  }
}
