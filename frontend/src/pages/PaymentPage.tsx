/**
 * Payment Page Component
 * @fileoverview Payment page component for CV Builder frontend
 * @author Vicky
 * @version 1.0.0
 * @since 2025-01-19
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Lock, Check, X, Loader2, Shield, Download } from 'lucide-react';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';

interface PaymentForm {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
  amount: number;
}

interface PaymentPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
  popular?: boolean;
}

const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<PaymentPlan | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentForm, setPaymentForm] = useState<PaymentForm>({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    amount: 0,
  });

  const plans: PaymentPlan[] = [
    {
      id: 'basic',
      name: 'Basic Plan',
      price: 499,
      features: [
        'Up to 5 CVs',
        'Basic templates',
        'PDF downloads',
        'Email support',
      ],
    },
    {
      id: 'premium',
      name: 'Premium Plan',
      price: 999,
      features: [
        'Unlimited CVs',
        'All templates',
        'PDF & DOCX downloads',
        'Priority support',
        'Advanced analytics',
      ],
      popular: true,
    },
    {
      id: 'pro',
      name: 'Pro Plan',
      price: 1999,
      features: [
        'Unlimited CVs',
        'All templates',
        'All download formats',
        '24/7 support',
        'Advanced analytics',
        'Custom branding',
        'API access',
      ],
    },
  ];

  const formatCardNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    // Limit to 16 digits
    const limited = digits.slice(0, 16);
    // Add spaces every 4 digits
    return limited.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatExpiryDate = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    // Limit to 4 digits
    const limited = digits.slice(0, 4);
    // Add slash after 2 digits
    if (limited.length >= 2) {
      return limited.slice(0, 2) + '/' + limited.slice(2);
    }
    return limited;
  };

  const validateCardNumber = (cardNumber: string): boolean => {
    // Remove spaces and check if it's 16 digits
    const digits = cardNumber.replace(/\s/g, '');
    return digits.length === 16 && /^\d+$/.test(digits);
  };

  const validateExpiryDate = (expiryDate: string): boolean => {
    const digits = expiryDate.replace(/\D/g, '');
    if (digits.length !== 4) return false;
    
    const month = parseInt(digits.slice(0, 2));
    const year = parseInt(digits.slice(2, 4));
    
    if (month < 1 || month > 12) return false;
    
    const currentYear = new Date().getFullYear() % 100;
    const currentMonth = new Date().getMonth() + 1;
    
    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      return false;
    }
    
    return true;
  };

  const validateCVV = (cvv: string): boolean => {
    return cvv.length === 3 && /^\d+$/.test(cvv);
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setPaymentForm(prev => ({ ...prev, cardNumber: formatted }));
  };

  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiryDate(e.target.value);
    setPaymentForm(prev => ({ ...prev, expiryDate: formatted }));
  };

  const handleCVVChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 3);
    setPaymentForm(prev => ({ ...prev, cvv: value }));
  };

  const handlePlanSelect = (plan: PaymentPlan) => {
    setSelectedPlan(plan);
    setPaymentForm(prev => ({ ...prev, amount: plan.price }));
  };

  const generateBillingPDF = (paymentData: any) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    doc.setLineHeightFactor(1.2);

    // Header band
    doc.setFillColor(243, 244, 246); // secondary-100 like
    doc.rect(0, 0, pageWidth, 40, 'F');

    // Brand + Invoice tag
    doc.setFontSize(22);
    doc.setTextColor(59, 130, 246);
    doc.text('CV Builder', margin, 25);

    doc.setFontSize(12);
    doc.setTextColor(31, 41, 55);
    doc.text('INVOICE', pageWidth - 20, 18, { align: 'right' });

    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text(`Invoice # ${paymentData.transaction_id}`, pageWidth - 20, 28, { align: 'right' });
    doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 20, 34, { align: 'right' });

    // From / Bill To blocks
    const blockTop = 50;
    // From (Company)
    doc.setFontSize(11);
    doc.setTextColor(17, 24, 39);
    doc.text('From', margin, blockTop);
    doc.setFontSize(10);
    doc.setTextColor(55, 65, 81);
    doc.text('CV Builder Pvt. Ltd.', margin, blockTop + 8);
    doc.text('Mumbai, Maharashtra, IN', margin, blockTop + 14);
    doc.text('support@cvbuilder.com', margin, blockTop + 20);

    // Bill To (Customer)
    const billToX = pageWidth / 2 + 10;
    doc.setFontSize(11);
    doc.setTextColor(17, 24, 39);
    doc.text('Bill To', billToX, blockTop);
    doc.setFontSize(10);
    doc.setTextColor(55, 65, 81);
    doc.text(String(paymentData.metadata.cardholder_name || 'Customer'), billToX, blockTop + 8);
    doc.text(`Payment: ${String(paymentData.payment_method || '').toUpperCase()}`, billToX, blockTop + 14);
    doc.text(`Card: **** **** **** ${String(paymentData.metadata.card_last_four || '****')}`, billToX, blockTop + 20);

    // Items table
    const tableTop = blockTop + 42;
    const colX = { desc: margin, qty: pageWidth - 110, price: pageWidth - 70, amount: pageWidth - margin };

    // Table header
    doc.setFillColor(243, 244, 246);
    doc.setDrawColor(229, 231, 235);
    const headerHeight = 12;
    doc.rect(margin, tableTop, pageWidth - margin * 2, headerHeight, 'FD');
    doc.setFontSize(10);
    doc.setTextColor(17, 24, 39);
    doc.text('Description', colX.desc, tableTop + 8);
    doc.text('Qty', colX.qty, tableTop + 8);
    doc.text('Price', colX.price, tableTop + 8);
    doc.text('Amount', colX.amount, tableTop + 8, { align: 'right' });

    // Single line item (plan)
    const rowHeight = 14;
    const rowY = tableTop + headerHeight + rowHeight - 4;
    doc.setDrawColor(229, 231, 235);
    doc.line(margin, rowY - rowHeight, pageWidth - margin, rowY - rowHeight);
    doc.setFontSize(10);
    doc.setTextColor(55, 65, 81);
    const planName = String(paymentData.metadata.plan_name || 'Selected Plan');
    const currency = String(paymentData.currency || 'INR');
    const price = Number(paymentData.amount || 0);
    doc.text(`${planName} Subscription`, colX.desc, rowY);
    doc.text('1', colX.qty, rowY);
    doc.text(`${currency === 'INR' ? '₹' : ''}${price.toFixed(2)}`, colX.price, rowY);
    doc.text(`${currency === 'INR' ? '₹' : ''}${price.toFixed(2)}`, colX.amount, rowY, { align: 'right' });

    // Totals box
    const tableBottom = tableTop + headerHeight + rowHeight + 6;
    const totalsTop = tableBottom + 12;
    const totalsLeft = pageWidth - 120;
    const totalsWidth = 100;
    const lineHeight = 8;

    doc.setDrawColor(229, 231, 235);
    doc.rect(totalsLeft, totalsTop, totalsWidth, 40);

    const subtotal = price;
    const tax = Math.round(subtotal * 0.18 * 100) / 100; // 18% GST
    const grandTotal = Math.round((subtotal + tax) * 100) / 100;

    doc.setFontSize(10);
    doc.setTextColor(55, 65, 81);
    doc.text('Subtotal', totalsLeft + 6, totalsTop + lineHeight);
    doc.text(`${currency === 'INR' ? '₹' : ''}${subtotal.toFixed(2)}`, totalsLeft + totalsWidth - 6, totalsTop + lineHeight, { align: 'right' });

    doc.text('Tax (18% GST)', totalsLeft + 6, totalsTop + lineHeight * 2);
    doc.text(`${currency === 'INR' ? '₹' : ''}${tax.toFixed(2)}`, totalsLeft + totalsWidth - 6, totalsTop + lineHeight * 2, { align: 'right' });

    doc.setDrawColor(229, 231, 235);
    doc.line(totalsLeft, totalsTop + lineHeight * 2.5, totalsLeft + totalsWidth, totalsTop + lineHeight * 2.5);

    doc.setFontSize(12);
    doc.setTextColor(17, 24, 39);
    doc.text('Total', totalsLeft + 6, totalsTop + lineHeight * 4);
    doc.text(`${currency === 'INR' ? '₹' : ''}${grandTotal.toFixed(2)}`, totalsLeft + totalsWidth - 6, totalsTop + lineHeight * 4, { align: 'right' });

    // Notes
    const notesTop = totalsTop + 56;
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.text('Thank you for your purchase. This is a system generated invoice and does not require a signature.', 20, notesTop, { maxWidth: pageWidth - 40 });

    // Footer with tagline
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('Crafted by Neosoft, Developed by Vicky Assignment', pageWidth / 2, pageHeight - 18, { align: 'center' });
    doc.text('© 2025 CV Builder. All rights reserved.', pageWidth / 2, pageHeight - 10, { align: 'center' });

    // Save
    doc.save(`billing-invoice-${paymentData.transaction_id}.pdf`);
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPlan) {
      toast.error('Please select a plan');
      return;
    }

    // Validate form
    if (!validateCardNumber(paymentForm.cardNumber)) {
      toast.error('Please enter a valid 16-digit card number');
      return;
    }

    if (!validateExpiryDate(paymentForm.expiryDate)) {
      toast.error('Please enter a valid expiry date');
      return;
    }

    if (!validateCVV(paymentForm.cvv)) {
      toast.error('Please enter a valid 3-digit CVV');
      return;
    }

    if (!paymentForm.cardholderName.trim()) {
      toast.error('Please enter cardholder name');
      return;
    }

    try {
      setIsProcessing(true);
      
      // Create payment transaction
      const paymentData = {
        amount: selectedPlan.price,
        currency: 'INR',
        payment_method: 'card',
        transaction_id: `TXN_${Date.now()}`,
        status: 'completed',
        action_type: 'premium_upgrade',
        metadata: {
          plan_id: selectedPlan.id,
          plan_name: selectedPlan.name,
          card_last_four: paymentForm.cardNumber.slice(-4),
          cardholder_name: paymentForm.cardholderName,
        },
      };

      const response = await apiService.processPayment(paymentData);
      
      if (response.success) {
        toast.success('Payment processed successfully!');
        
        // Generate billing PDF
        generateBillingPDF(paymentData);
        
        navigate('/dashboard');
      } else {
        toast.error(response.message || 'Payment failed');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-secondary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link
                to="/dashboard"
                className="flex items-center space-x-2 text-secondary-600 hover:text-secondary-800 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Dashboard</span>
              </Link>
              <div className="h-6 w-px bg-secondary-300"></div>
              <h1 className="text-xl font-semibold text-secondary-900">Payment & Billing</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-secondary-900 mb-2">
            Choose Your Plan
          </h2>
          <p className="text-secondary-600">
            Select a plan that fits your needs and unlock premium features
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-lg shadow-sm border-2 p-6 cursor-pointer transition-all ${
                selectedPlan?.id === plan.id
                  ? 'border-primary-500 ring-2 ring-primary-200'
                  : plan.popular
                  ? 'border-primary-300'
                  : 'border-secondary-200'
              }`}
              onClick={() => handlePlanSelect(plan)}
            >
              {plan.popular && (
                <div className="bg-primary-600 text-white text-xs font-semibold px-3 py-1 rounded-full inline-block mb-4">
                  Most Popular
                </div>
              )}
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                {plan.name}
              </h3>
              <div className="mb-4">
                <span className="text-3xl font-bold text-primary-600">₹{plan.price}</span>
                <span className="text-secondary-600">/month</span>
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-secondary-600">{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                  selectedPlan?.id === plan.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                }`}
              >
                {selectedPlan?.id === plan.id ? 'Selected' : 'Select Plan'}
              </button>
            </div>
          ))}
        </div>

        {/* Payment Form */}
        {selectedPlan && (
          <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <CreditCard className="h-6 w-6 text-primary-600" />
              <h3 className="text-lg font-semibold text-secondary-900">
                Payment Information
              </h3>
            </div>

            <form onSubmit={handlePayment} className="space-y-6">
              {/* Card Number */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Card Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={paymentForm.cardNumber}
                    onChange={handleCardNumberChange}
                    className="w-full px-3 py-2 pr-10 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    required
                  />
                  <CreditCard className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                </div>
                {paymentForm.cardNumber && !validateCardNumber(paymentForm.cardNumber) && (
                  <p className="text-red-600 text-xs mt-1">Please enter a valid 16-digit card number</p>
                )}
              </div>

              {/* Cardholder Name */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  value={paymentForm.cardholderName}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, cardholderName: e.target.value }))}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="John Doe"
                  required
                />
              </div>

              {/* Expiry Date and CVV */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    value={paymentForm.expiryDate}
                    onChange={handleExpiryDateChange}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="MM/YY"
                    maxLength={5}
                    required
                  />
                  {paymentForm.expiryDate && !validateExpiryDate(paymentForm.expiryDate) && (
                    <p className="text-red-600 text-xs mt-1">Please enter a valid expiry date</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    CVV
                  </label>
                  <input
                    type="text"
                    value={paymentForm.cvv}
                    onChange={handleCVVChange}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="123"
                    maxLength={3}
                    required
                  />
                  {paymentForm.cvv && !validateCVV(paymentForm.cvv) && (
                    <p className="text-red-600 text-xs mt-1">Please enter a valid 3-digit CVV</p>
                  )}
                </div>
              </div>

              {/* Security Notice */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    Secure Payment
                  </span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  Your payment information is encrypted and secure. We use industry-standard security measures.
                </p>
              </div>

              {/* Payment Summary */}
              <div className="bg-secondary-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold text-secondary-900">Payment Summary</h4>
                  <button
                    onClick={() => {
                      const paymentData = {
                        amount: selectedPlan.price,
                        currency: 'INR',
                        payment_method: 'card',
                        transaction_id: `TXN_${Date.now()}`,
                        status: 'pending',
                        action_type: 'premium_upgrade',
                        metadata: {
                          plan_id: selectedPlan.id,
                          plan_name: selectedPlan.name,
                          card_last_four: paymentForm.cardNumber.slice(-4) || '****',
                          cardholder_name: paymentForm.cardholderName || 'Customer',
                        },
                      };
                      generateBillingPDF(paymentData);
                    }}
                    className="flex items-center space-x-1 text-primary-600 hover:text-primary-700 text-sm"
                  >
                    <Download className="h-4 w-4" />
                    <span>Preview Invoice</span>
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-secondary-600">{selectedPlan.name}</span>
                  <span className="font-semibold text-secondary-900">₹{selectedPlan.price}/month</span>
                </div>
                <div className="border-t border-secondary-200 mt-2 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-secondary-900">Total</span>
                    <span className="text-xl font-bold text-primary-600">₹{selectedPlan.price}</span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-5 w-5" />
                    <span>Pay ₹{selectedPlan.price}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentPage;
