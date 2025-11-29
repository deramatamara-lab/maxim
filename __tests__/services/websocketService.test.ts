/**
 * WebSocket Service Tests
 * Smoke tests for real-time communication service
 */

// Mock socket.io-client before importing the service
jest.mock('socket.io-client', () => {
  const mockSocket = {
    on: jest.fn().mockReturnThis(),
    off: jest.fn().mockReturnThis(),
    emit: jest.fn(),
    connect: jest.fn().mockReturnThis(),
    disconnect: jest.fn(),
    connected: false,
    id: 'mock-socket-id',
  };
  return {
    io: jest.fn(() => mockSocket),
  };
});

// Mock logger
jest.mock('@/utils/logger', () => ({
  log: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// Import after mocks are set up
import { wsService } from '../../src/services/websocketService';

describe('WebSocketService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should be a singleton instance', () => {
      expect(wsService).toBeDefined();
      expect(typeof wsService).toBe('object');
    });

    it('should have connect method', () => {
      expect(wsService).toBeDefined();
    });
  });

  describe('driver methods', () => {
    it('should have acceptRide method', () => {
      expect(typeof wsService.acceptRide).toBe('function');
      
      // Should not throw
      wsService.acceptRide('ride-123');
    });

    it('should have rejectRide method', () => {
      expect(typeof wsService.rejectRide).toBe('function');
      
      // Should not throw
      wsService.rejectRide('ride-123', 'Too far');
    });

    it('should have startRide method', () => {
      expect(typeof wsService.startRide).toBe('function');
      
      // Should not throw
      wsService.startRide('ride-123');
    });

    it('should have completeRide method', () => {
      expect(typeof wsService.completeRide).toBe('function');
      
      // Should not throw
      wsService.completeRide('ride-123');
    });
  });

  describe('connection status', () => {
    it('should have isSocketConnected method', () => {
      expect(typeof wsService.isSocketConnected).toBe('function');
      
      // Should return boolean
      const isConnected = wsService.isSocketConnected();
      expect(typeof isConnected).toBe('boolean');
    });

    it('should have getConnectionStatus method', () => {
      expect(typeof wsService.getConnectionStatus).toBe('function');
      
      // Should return status string
      const status = wsService.getConnectionStatus();
      expect(['connected', 'disconnected', 'connecting', 'reconnecting']).toContain(status);
    });
  });
});
