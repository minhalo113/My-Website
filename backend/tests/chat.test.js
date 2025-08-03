import { jest } from '@jest/globals';

let ChatMock;
let mockIo;
let connectionHandler;

beforeEach(async () => {
  ChatMock = {
    create: jest.fn(),
    find: jest.fn(),
  };

  jest.doMock('../models/chatModel.js', () => ({
    __esModule: true,
    default: ChatMock,
  }));

  connectionHandler = null;
  mockIo = {
    on: jest.fn((event, handler) => {
      if (event === 'connection') connectionHandler = handler;
    }),
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  };

  jest.doMock('socket.io', () => ({
    Server: jest.fn(() => mockIo),
  }));

  const { initSocket } = await import('../socket.js');
  initSocket({});
});

afterEach(() => {
  jest.resetModules();
});

describe('Chat socket API', () => {
  test('customer-message stores and emits chat', async () => {
    const handlers = {};
    const socket = {
      id: 's1',
      handshake: { query: { userId: 'uid', userName: 'User', userEmail: 'u@e.com' } },
      join: jest.fn(),
      on: jest.fn((evt, fn) => { handlers[evt] = fn; }),
      emit: jest.fn(),
    };

    connectionHandler(socket);
    ChatMock.create.mockResolvedValue({ message: 'Hi' });

    await handlers['customer-message']({ text: 'Hi' });

    expect(ChatMock.create).toHaveBeenCalledWith({
      userName: 'User',
      userEmail: 'u@e.com',
      userId: 'uid',
      sender: 'customer',
      message: 'Hi',
    });
    expect(mockIo.to).toHaveBeenCalledWith('admins');
    expect(socket.emit).toHaveBeenCalledWith('customer-message', { message: 'Hi' });
  });

  test('get-history returns sorted messages', async () => {
    const handlers = {};
    const socket = {
      handshake: { query: { userId: 'uid' } },
      join: jest.fn(),
      on: jest.fn((evt, fn) => { handlers[evt] = fn; }),
      emit: jest.fn(),
    };

    connectionHandler(socket);
    const history = [{ message: 'hello' }];
    ChatMock.find.mockReturnValue({ sort: jest.fn().mockResolvedValue(history) });

    const cb = jest.fn();
    await handlers['get-history']('uid', cb);

    expect(ChatMock.find).toHaveBeenCalledWith({ userId: 'uid' });
    expect(cb).toHaveBeenCalledWith(history);
  });
});