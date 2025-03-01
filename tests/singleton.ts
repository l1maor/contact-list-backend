import { PrismaClient } from '@prisma/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

export type MockPrismaClient = DeepMockProxy<PrismaClient>;
const mockPrisma = mockDeep<PrismaClient>();

jest.mock('../src/prismaClient', () => ({
  __esModule: true,
  default: mockPrisma
}));

export const prismaMock = mockPrisma;
