/**
 * Global App Constants
 * Shared across screens and components
 */

export const propertyTypes = [
    'All Types',
    'Agricultural Land',
    'Plot',
    'Farm House',
    'Warehouse',
    'Property Land',
    'Industrial',
    'Residential',
];

export const priceRanges = [
    { label: 'All Prices', min: 0, max: Infinity },
    { label: 'Under ₹25 Lakh', min: 0, max: 2500000 },
    { label: '₹25 - 50 Lakh', min: 2500000, max: 5000000 },
    { label: '₹50 Lakh - 1 Cr', min: 5000000, max: 10000000 },
    { label: '₹1 - 2 Cr', min: 10000000, max: 20000000 },
    { label: 'Above ₹2 Cr', min: 20000000, max: Infinity },
];

export const RAZORPAY_KEY = 'rzp_test_XXXXXXXXXXXXXX'; // Replace with actual key
export const LISTING_FEE_PAISE = 2000; // ₹20 in paise
