import { sampleProcessedMenu } from '../test-helpers/menu-data';
import * as testee from './menu-client';

describe('processMenuRequest', () => {
  const file = new File(['x'], 'menu.jpg', { type: 'image/jpeg' });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns the parsed menu when the API responds with items', async () => {
    // The happy path must surface the structured menu to the caller.
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => sampleProcessedMenu,
    }) as jest.Mock;

    await expect(testee.processMenuRequest([file])).resolves.toEqual(sampleProcessedMenu);
  });

  it('throws when the response is not ok', async () => {
    // A failed upload must not be silently swallowed into an empty menu.
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({}),
    }) as jest.Mock;

    await expect(testee.processMenuRequest([file])).rejects.toThrow(
      'Failed to process menu images'
    );
  });

  it('throws a guidance message when the response has no items field', async () => {
    // A malformed/empty body must be treated as "nothing recognized".
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    }) as jest.Mock;

    await expect(testee.processMenuRequest([file])).rejects.toThrow(
      'Could not identify any menu items'
    );
  });

  it('throws a guidance message when no items are recognized', async () => {
    // An unreadable photo returns 200 with an empty list; the diner must be told.
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ items: [] }),
    }) as jest.Mock;

    await expect(testee.processMenuRequest([file])).rejects.toThrow(
      'Could not identify any menu items'
    );
  });
});
