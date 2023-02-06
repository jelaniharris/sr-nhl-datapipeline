import { PrismaClient, Prisma, Game } from "prisma/prisma-client";

export type CreateGameDto = {};

export class GameService {
  constructor(private prisma: PrismaClient) {}
  async create(data: any): Promise<Game> {
    return this.prisma.game.create({
      data: {
        ...data,
        created_at: new Date(),
        updated_at: new Date()
      }
    });
  }

  async findOneByApiId(id: number): Promise<Game | null> {
    return this.prisma.game.findFirst({
      where: {
        apiId: id
      }
    });
  }
}
