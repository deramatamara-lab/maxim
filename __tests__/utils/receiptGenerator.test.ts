/**
 * Receipt Generator Tests
 * Comprehensive tests for receipt generation and tax calculations
 */

// Mock receipt types and generator
interface ReceiptItem {
  description: string;
  amount: number;
}

interface TaxBreakdown {
  taxType: string;
  rate: number;
  amount: number;
}

interface Receipt {
  id: string;
  rideId: string;
  timestamp: string;
  items: ReceiptItem[];
  subtotal: number;
  taxes: TaxBreakdown[];
  total: number;
  currency: string;
}

// Receipt generator functions
function generateReceiptId(): string {
  return `receipt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function calculateSubtotal(items: ReceiptItem[]): number {
  return items.reduce((sum, item) => sum + item.amount, 0);
}

function calculateTax(amount: number, rate: number): number {
  return Math.round(amount * rate * 100) / 100;
}

function generateReceipt(
  rideId: string,
  basePrice: number,
  distancePrice: number,
  timePrice: number,
  surgeMultiplier: number = 1.0,
  tolls: number = 0,
  tip: number = 0,
  taxRate: number = 0.08
): Receipt {
  const items: ReceiptItem[] = [
    { description: 'Base fare', amount: basePrice },
    { description: 'Distance charge', amount: distancePrice },
    { description: 'Time charge', amount: timePrice },
  ];

  if (surgeMultiplier > 1.0) {
    const surgeAmount = (basePrice + distancePrice + timePrice) * (surgeMultiplier - 1);
    items.push({ description: 'Surge pricing', amount: Math.round(surgeAmount * 100) / 100 });
  }

  if (tolls > 0) {
    items.push({ description: 'Tolls', amount: tolls });
  }

  if (tip > 0) {
    items.push({ description: 'Tip', amount: tip });
  }

  const subtotal = calculateSubtotal(items);
  const taxAmount = calculateTax(subtotal, taxRate);

  const taxes: TaxBreakdown[] = [
    { taxType: 'Sales Tax', rate: taxRate, amount: taxAmount },
  ];

  return {
    id: generateReceiptId(),
    rideId,
    timestamp: new Date().toISOString(),
    items,
    subtotal,
    taxes,
    total: Math.round((subtotal + taxAmount) * 100) / 100,
    currency: 'USD',
  };
}

describe('Receipt Generator', () => {
  describe('Receipt ID Generation', () => {
    it('should generate unique receipt IDs', () => {
      const id1 = generateReceiptId();
      const id2 = generateReceiptId();
      
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^receipt_\d+_[a-z0-9]+$/);
    });

    it('should include timestamp in ID', () => {
      const before = Date.now();
      const id = generateReceiptId();
      const after = Date.now();
      
      const timestampStr = id.split('_')[1];
      const timestamp = parseInt(timestampStr, 10);
      
      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('Subtotal Calculation', () => {
    it('should calculate subtotal correctly', () => {
      const items: ReceiptItem[] = [
        { description: 'Base fare', amount: 5.00 },
        { description: 'Distance', amount: 10.50 },
        { description: 'Time', amount: 7.25 },
      ];
      
      expect(calculateSubtotal(items)).toBe(22.75);
    });

    it('should handle empty items array', () => {
      expect(calculateSubtotal([])).toBe(0);
    });

    it('should handle single item', () => {
      const items: ReceiptItem[] = [
        { description: 'Base fare', amount: 15.00 },
      ];
      
      expect(calculateSubtotal(items)).toBe(15.00);
    });
  });

  describe('Tax Calculation', () => {
    it('should calculate tax correctly', () => {
      expect(calculateTax(100, 0.08)).toBe(8.00);
      expect(calculateTax(50, 0.1)).toBe(5.00);
      expect(calculateTax(22.75, 0.08)).toBe(1.82);
    });

    it('should round to 2 decimal places', () => {
      const tax = calculateTax(33.33, 0.0875);
      expect(tax).toBe(2.92);
    });

    it('should handle zero tax rate', () => {
      expect(calculateTax(100, 0)).toBe(0);
    });
  });

  describe('Receipt Generation', () => {
    it('should generate complete receipt', () => {
      const receipt = generateReceipt(
        'ride_123',
        5.00,
        10.50,
        7.25
      );
      
      expect(receipt.rideId).toBe('ride_123');
      expect(receipt.items.length).toBe(3);
      expect(receipt.subtotal).toBe(22.75);
      expect(receipt.currency).toBe('USD');
    });

    it('should include surge pricing when applicable', () => {
      const receipt = generateReceipt(
        'ride_123',
        5.00,
        10.00,
        5.00,
        1.5 // 50% surge
      );
      
      const surgeItem = receipt.items.find(i => i.description === 'Surge pricing');
      expect(surgeItem).toBeDefined();
      expect(surgeItem?.amount).toBe(10.00); // 50% of $20
    });

    it('should not include surge pricing when multiplier is 1.0', () => {
      const receipt = generateReceipt(
        'ride_123',
        5.00,
        10.00,
        5.00,
        1.0
      );
      
      const surgeItem = receipt.items.find(i => i.description === 'Surge pricing');
      expect(surgeItem).toBeUndefined();
    });

    it('should include tolls when provided', () => {
      const receipt = generateReceipt(
        'ride_123',
        5.00,
        10.00,
        5.00,
        1.0,
        3.50 // tolls
      );
      
      const tollsItem = receipt.items.find(i => i.description === 'Tolls');
      expect(tollsItem).toBeDefined();
      expect(tollsItem?.amount).toBe(3.50);
    });

    it('should include tip when provided', () => {
      const receipt = generateReceipt(
        'ride_123',
        5.00,
        10.00,
        5.00,
        1.0,
        0,
        5.00 // tip
      );
      
      const tipItem = receipt.items.find(i => i.description === 'Tip');
      expect(tipItem).toBeDefined();
      expect(tipItem?.amount).toBe(5.00);
    });

    it('should calculate total with tax', () => {
      const receipt = generateReceipt(
        'ride_123',
        5.00,
        10.00,
        5.00,
        1.0,
        0,
        0,
        0.08 // 8% tax
      );
      
      const expectedSubtotal = 20.00;
      const expectedTax = 1.60;
      const expectedTotal = 21.60;
      
      expect(receipt.subtotal).toBe(expectedSubtotal);
      expect(receipt.taxes[0].amount).toBe(expectedTax);
      expect(receipt.total).toBe(expectedTotal);
    });
  });

  describe('Tax Breakdown', () => {
    it('should include tax type and rate', () => {
      const receipt = generateReceipt(
        'ride_123',
        10.00,
        10.00,
        10.00,
        1.0,
        0,
        0,
        0.0875
      );
      
      expect(receipt.taxes[0].taxType).toBe('Sales Tax');
      expect(receipt.taxes[0].rate).toBe(0.0875);
    });
  });

  describe('Compliance', () => {
    it('should include timestamp in ISO format', () => {
      const receipt = generateReceipt('ride_123', 5.00, 10.00, 5.00);
      
      // Should be valid ISO 8601 date
      const date = new Date(receipt.timestamp);
      expect(date.toISOString()).toBe(receipt.timestamp);
    });

    it('should include all required fields for compliance', () => {
      const receipt = generateReceipt('ride_123', 5.00, 10.00, 5.00);
      
      expect(receipt).toHaveProperty('id');
      expect(receipt).toHaveProperty('rideId');
      expect(receipt).toHaveProperty('timestamp');
      expect(receipt).toHaveProperty('items');
      expect(receipt).toHaveProperty('subtotal');
      expect(receipt).toHaveProperty('taxes');
      expect(receipt).toHaveProperty('total');
      expect(receipt).toHaveProperty('currency');
    });
  });
});
