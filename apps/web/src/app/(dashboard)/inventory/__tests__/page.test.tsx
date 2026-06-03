import InventoryPage from '@/app/(dashboard)/inventory/page';

jest.mock('@/lib/hooks', () => ({
  useInventoryItems: jest.fn(() => ({
    data: {
      data: [
        { id: 'ii1', sku: 'SKU001', quantity: 100, location: 'Warehouse A' },
      ],
    },
    isLoading: false,
  })),
}));

jest.mock('@/lib/api', () => ({
  api: {},
}));

describe('Inventory Page', () => {
  it('exports a page component', () => {
    expect(InventoryPage).toBeDefined();
  });
});
