import { GameProcessor } from "./GameProcessor";
import PrismaService from "./libs/prisma";
import { NHLApi } from "./util/nhlApi";

jest.mock("./util/nhlApi");
jest.mock("./libs/prisma");
jest.mock("./GameProcessor");

const mockApiGetLiveGameFeed = NHLApi.getLiveGameFeed as jest.MockedFunction<
  typeof NHLApi.getLiveGameFeed
>;

describe("GameProcessor", () => {
  it("should be creatable", async () => {
    const processor = new GameProcessor();
    expect(processor).not.toBeNull();
  });
});
