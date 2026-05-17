const mockResponse = {
  on: jest.fn((event: string, callback: (chunk?: Buffer) => void) => {
    if (event === 'data') {
      const chunk = Buffer.from(JSON.stringify({
        status: 'OK',
        data: [
          {
            url: 'https://example.com/test-image.jpg',
          },
        ],
      }));
      callback(chunk);
    }
    if (event === 'end') {
      callback();
    }
  }),
};

const mockRequest = {
  on: jest.fn(),
  setTimeout: jest.fn(),
  destroy: jest.fn(),
  end: jest.fn(() => {
    const responseCallback = (global as { mockResponseCallback?: (res: typeof mockResponse) => void }).mockResponseCallback;
    if (responseCallback) {
      responseCallback(mockResponse);
    }
  }),
};

export const request = jest.fn((options: unknown, callback: (res: typeof mockResponse) => void) => {
  (global as { mockResponseCallback?: (res: typeof mockResponse) => void }).mockResponseCallback = callback;
  return mockRequest;
});