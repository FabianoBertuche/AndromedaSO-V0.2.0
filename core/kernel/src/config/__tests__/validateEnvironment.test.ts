import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Use vi.hoisted to avoid hoisting issues
const { mockConnect, mockEnd } = vi.hoisted(() => {
  return {
    mockConnect: vi.fn(),
    mockEnd: vi.fn(),
  };
});

// Mock pg Client - use a class to be a proper constructor
vi.mock('pg', () => {
  class MockClient {
    connect = mockConnect;
    end = mockEnd;
  }
  return { Client: MockClient };
});

// Mock pino logger to suppress output during tests
vi.mock('pino', () => ({
  default: vi.fn(() => ({
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  })),
}));

// Mock process.exit
const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {}) as () => never);

// Import after mocking
import { validateEnvironment } from '../validateEnvironment.js';

describe('validateEnvironment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    // Reset env vars
    delete process.env.PG_REQUIRED;
    delete process.env.DATABASE_URL;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should warn and not throw when PG_REQUIRED=false and DATABASE_URL is missing', async () => {
    process.env.PG_REQUIRED = 'false';

    await expect(validateEnvironment()).resolves.toBeUndefined();
    expect(mockExit).not.toHaveBeenCalled();
  });

  it('should return without error when PG_REQUIRED=false and DATABASE_URL is set', async () => {
    process.env.PG_REQUIRED = 'false';
    process.env.DATABASE_URL = 'postgresql://localhost:5432/testdb';

    await expect(validateEnvironment()).resolves.toBeUndefined();
    expect(mockExit).not.toHaveBeenCalled();
  });

  it('should exit with error when PG_REQUIRED=true and DATABASE_URL is missing', async () => {
    process.env.PG_REQUIRED = 'true';

    await validateEnvironment();
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should exit with error on connection timeout', async () => {
    process.env.PG_REQUIRED = 'true';
    process.env.DATABASE_URL = 'postgresql://localhost:5432/testdb';

    // Mock connect to never resolve (simulate slow connection)
    mockConnect.mockImplementation(() => new Promise(() => {}));

    // Start the validation in background
    const validationPromise = validateEnvironment();

    // Advance timers to trigger the 5000ms timeout
    await vi.advanceTimersByTimeAsync(5000);

    await validationPromise;
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should exit with error when database connection fails', async () => {
    process.env.PG_REQUIRED = 'true';
    process.env.DATABASE_URL = 'postgresql://localhost:5432/testdb';

    mockConnect.mockRejectedValue(new Error('Connection refused'));

    await validateEnvironment();
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should successfully connect and end when database is available', async () => {
    process.env.PG_REQUIRED = 'true';
    process.env.DATABASE_URL = 'postgresql://localhost:5432/testdb';

    mockConnect.mockResolvedValue(undefined);
    mockEnd.mockResolvedValue(undefined);

    await validateEnvironment();
    expect(mockConnect).toHaveBeenCalled();
    expect(mockEnd).toHaveBeenCalled();
    expect(mockExit).not.toHaveBeenCalled();
  });
});
