/**
 * Receipt & Tax Compliance Types
 * Comprehensive receipt structure for tax compliance
 */

export interface TaxBreakdown {
  type: 'vat' | 'sales_tax' | 'service_tax' | 'gst' | 'hst' | 'pst';
  rate: number; // Percentage (e.g., 20 for 20%)
  amount: number;
  jurisdiction: string;
  taxId?: string;
}

export interface FareLineItem {
  type: 'base_fare' | 'distance' | 'time' | 'surge' | 'toll' | 'service_fee' | 'booking_fee' | 'tip' | 'discount' | 'promo';
  label: string;
  amount: number;
  quantity?: number;
  unitPrice?: number;
  unit?: string;
}

export interface ComplianceReceipt {
  // Core identifiers
  id: string;
  receiptNumber: string; // Sequential for tax compliance
  rideId: string;
  transactionId: string;
  
  // Parties
  rider: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    taxId?: string; // For business travelers
  };
  driver: {
    id: string;
    name: string;
    licenseNumber?: string;
    taxId?: string;
  };
  company: {
    name: string;
    address: string;
    taxId: string;
    registrationNumber: string;
  };
  
  // Trip details
  trip: {
    pickupAddress: string;
    dropoffAddress: string;
    pickupTime: string;
    dropoffTime: string;
    distance: number; // km
    duration: number; // minutes
    vehicleType: string;
    licensePlate: string;
  };
  
  // Fare breakdown
  fare: {
    lineItems: FareLineItem[];
    subtotal: number;
    taxes: TaxBreakdown[];
    totalTax: number;
    total: number;
    currency: string;
  };
  
  // Payment
  payment: {
    method: 'cash' | 'credit_card' | 'debit_card' | 'digital_wallet';
    last4?: string;
    brand?: string;
    transactionRef: string;
    processedAt: string;
    status: 'paid' | 'pending' | 'refunded';
  };
  
  // Compliance metadata
  compliance: {
    generatedAt: string;
    version: string;
    locale: string;
    timezone: string;
    legalDisclaimer?: string;
    termsUrl?: string;
    supportEmail?: string;
    supportPhone?: string;
  };
  
  // Export options
  urls?: {
    pdf?: string;
    html?: string;
    json?: string;
  };
}

/**
 * Calculate fare breakdown with all components
 */
export function calculateFareBreakdown(params: {
  baseFare: number;
  distance: number;
  distanceRate: number;
  duration: number;
  timeRate: number;
  surgeMultiplier: number;
  tolls?: number;
  serviceFee?: number;
  bookingFee?: number;
  tip?: number;
  promoDiscount?: number;
  taxRates: Array<{ type: TaxBreakdown['type']; rate: number; jurisdiction: string }>;
  currency: string;
}): ComplianceReceipt['fare'] {
  const lineItems: FareLineItem[] = [];
  
  // Base fare
  lineItems.push({
    type: 'base_fare',
    label: 'Base Fare',
    amount: params.baseFare,
  });
  
  // Distance charge
  const distanceAmount = params.distance * params.distanceRate;
  lineItems.push({
    type: 'distance',
    label: 'Distance',
    amount: distanceAmount,
    quantity: params.distance,
    unitPrice: params.distanceRate,
    unit: 'km',
  });
  
  // Time charge
  const timeAmount = params.duration * params.timeRate;
  lineItems.push({
    type: 'time',
    label: 'Time',
    amount: timeAmount,
    quantity: params.duration,
    unitPrice: params.timeRate,
    unit: 'min',
  });
  
  // Surge pricing
  if (params.surgeMultiplier > 1) {
    const baseTotal = params.baseFare + distanceAmount + timeAmount;
    const surgeAmount = baseTotal * (params.surgeMultiplier - 1);
    lineItems.push({
      type: 'surge',
      label: `Surge (${params.surgeMultiplier}x)`,
      amount: surgeAmount,
    });
  }
  
  // Tolls
  if (params.tolls && params.tolls > 0) {
    lineItems.push({
      type: 'toll',
      label: 'Tolls',
      amount: params.tolls,
    });
  }
  
  // Service fee
  if (params.serviceFee && params.serviceFee > 0) {
    lineItems.push({
      type: 'service_fee',
      label: 'Service Fee',
      amount: params.serviceFee,
    });
  }
  
  // Booking fee
  if (params.bookingFee && params.bookingFee > 0) {
    lineItems.push({
      type: 'booking_fee',
      label: 'Booking Fee',
      amount: params.bookingFee,
    });
  }
  
  // Promo discount
  if (params.promoDiscount && params.promoDiscount > 0) {
    lineItems.push({
      type: 'promo',
      label: 'Promotional Discount',
      amount: -params.promoDiscount,
    });
  }
  
  // Calculate subtotal (before tax and tip)
  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  
  // Calculate taxes
  const taxes: TaxBreakdown[] = params.taxRates.map(tax => ({
    type: tax.type,
    rate: tax.rate,
    amount: Math.round(subtotal * (tax.rate / 100) * 100) / 100,
    jurisdiction: tax.jurisdiction,
  }));
  
  const totalTax = taxes.reduce((sum, tax) => sum + tax.amount, 0);
  
  // Tip (added after tax)
  if (params.tip && params.tip > 0) {
    lineItems.push({
      type: 'tip',
      label: 'Tip',
      amount: params.tip,
    });
  }
  
  const total = subtotal + totalTax + (params.tip || 0);
  
  return {
    lineItems,
    subtotal: Math.round(subtotal * 100) / 100,
    taxes,
    totalTax: Math.round(totalTax * 100) / 100,
    total: Math.round(total * 100) / 100,
    currency: params.currency,
  };
}

/**
 * Generate receipt number for tax compliance
 */
export function generateReceiptNumber(prefix: string = 'AURA'): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${year}${month}${day}-${random}`;
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency: string, locale: string = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}
