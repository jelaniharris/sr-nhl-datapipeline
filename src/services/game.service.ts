import { PrismaClient, Prisma, Game } from "prisma/prisma-client";

export class UpdateGameDto implements Prisma.GameUpdateInput {
  apiId?: number;
  statusCode?: string;
}

export class GameService {
  constructor(private prisma: PrismaClient) {}
  async create(data: Prisma.GameUncheckedCreateInput): Promise<Game> {
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

  async update(params: {
    where: Prisma.GameWhereUniqueInput;
    data: UpdateGameDto;
  }) {
    const { where, data } = params;
    return this.prisma.game.update({
      data: {
        ...data,
        updated_at: new Date()
      },
      where
    });
  }
}
