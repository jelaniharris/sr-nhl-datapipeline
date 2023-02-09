import { PrismaClient } from "@prisma/client";
import { mockDeep, mockReset, DeepMockProxy } from "jest-mock-extended";

import PrismaService from "../libs/prisma";

jest.mock("../libs/prisma", () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>()
}));

beforeEach(() => {
  mockReset(prismaMock);
});

export const prismaMock =
  PrismaService as unknown as DeepMockProxy<PrismaClient>;
