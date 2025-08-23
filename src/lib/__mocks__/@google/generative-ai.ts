export const GoogleGenerativeAI = jest.fn().mockImplementation(() => ({
  getGenerativeModel: jest.fn().mockReturnValue({
    generateContent: jest.fn().mockResolvedValue({
      response: {
        text: () => JSON.stringify([
          {
            id: '1',
            name: 'Fatto Tiramisu',
            price: '7',
            description: 'Coffee liqueur soaked sponge, mascarpone, chocolate',
            ingredients: ['coffee liqueur', 'sponge', 'mascarpone', 'chocolate'],
          },
          {
            id: '2',
            name: 'Affogato',
            price: '6',
            description: 'Vanilla gelato, espresso',
            ingredients: ['vanilla gelato', 'espresso'],
          },
        ]),
      },
    }),
  }),
}));