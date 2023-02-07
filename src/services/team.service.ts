import { PrismaClient, Prisma, Team } from "prisma/prisma-client";

export type UpsertTeamDto = {
  createData: Prisma.TeamUncheckedCreateInput;
  updateData?: Prisma.TeamUncheckedUpdateInput;
  where: Prisma.TeamWhereUniqueInput;
};

export class TeamService {
  constructor(private prisma: PrismaClient) {}
  async create(data: Prisma.TeamCreateInput): Promise<Team> {
    return this.prisma.team.create({
      data: {
        ...data,
        created_at: new Date(),
        updated_at: new Date()
      }
    });
  }

  async findOneByApiId(id: number): Promise<Team | null> {
    return this.prisma.team.findFirst({
      where: {
        apiId: id
      }
    });
  }

  async firstOrCreate(params: UpsertTeamDto) {
    const { createData, where } = params;
    return this.prisma.team.upsert({
      update: {},
      create: {
        ...createData,
        updated_at: new Date(),
        created_at: new Date()
      },
      where
    });
  }
}
