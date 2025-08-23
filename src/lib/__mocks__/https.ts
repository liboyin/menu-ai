const mockResponse = {
  on: jest.fn((event, callback) => {
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
  end: jest.fn(() => {
    // Immediately invoke the response callback to simulate receiving a response
    const responseCallback = (global as any).mockResponseCallback;
    if (responseCallback) {
      responseCallback(mockResponse);
    }
  }),
};

export const request = jest.fn((options, callback) => {
  (global as any).mockResponseCallback = callback;
  return mockRequest;
});