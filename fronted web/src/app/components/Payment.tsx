import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { CreditCard, Smartphone, Building2, ArrowLeft, CheckCircle, Lock, AlertCircle } from 'lucide-react';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Input } from './ui/input';
import { useAuth } from '../context/AuthContext';
import { mockMemberships } from '../context/AuthContext';
import { toast } from 'sonner';
import { apiClient } from '../services/api';

export function Payment() {
  const { membershipId } = useParams();
  const { user, processPayment } = useAuth();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState('GCASH');
  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // Form states for credit card
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardName: '',
    expiry: '',
    cvv: ''
  });

  const membership = mockMemberships.find(m => m.id === Number(membershipId));

  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Check backend status on component mount
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/v1/auth/test');
        if (response.ok) {
          setBackendStatus('online');
          console.log('✅ Backend is online');
        } else {
          setBackendStatus('offline');
          console.warn('⚠️ Backend is offline');
        }
      } catch (error) {
        setBackendStatus('offline');
        console.error('❌ Backend not reachable:', error);
      }
    };
    checkBackend();
  }, []);

  if (!user || !membership) {
    return null;
  }

  const handlePayment = async () => {
    setError(null);

    // Check backend status first
    if (backendStatus === 'offline') {
      toast.error('Backend server is not running. Please start your Spring Boot application.');
      return;
    }

    // Validate credit card if selected
    if (paymentMethod === 'Credit Card') {
      if (!cardDetails.cardNumber || !cardDetails.cardName || !cardDetails.expiry || !cardDetails.cvv) {
        toast.error('Please fill in all card details');
        return;
      }
    }

    setLoading(true);

    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout - backend not responding')), 30000);
    });

    try {
      console.log('🚀 Starting payment process...');
      console.log('📦 Payment data:', {
        membershipId: membership.id,
        amount: membership.price,
        paymentMethod
      });

      // Race between payment and timeout
      const paymentPromise = processPayment(membership.id, membership.price, paymentMethod);
      await Promise.race([paymentPromise, timeoutPromise]);

      setPaymentSuccess(true);
      toast.success('Payment successful! Your membership is now active.');

      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error: any) {
      console.error('❌ Payment error:', error);

      let errorMessage = error.message || 'Payment failed. Please try again.';

      // Specific error messages
      if (errorMessage.includes('timeout')) {
        errorMessage = 'Request timeout. Please check if backend is running.';
      } else if (errorMessage.includes('Network')) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (errorMessage.includes('401')) {
        errorMessage = 'Session expired. Please login again.';
        navigate('/');
      } else if (errorMessage.includes('403')) {
        errorMessage = 'You don\'t have permission to make this payment.';
      } else if (errorMessage.includes('500')) {
        errorMessage = 'Server error. Please try again later.';
      }

      setError(errorMessage);
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  const handleMockPayment = async () => {
    // For testing when backend is offline
    setError(null);
    setLoading(true);

    setTimeout(() => {
      setPaymentSuccess(true);
      toast.success('Mock payment successful! Your membership is now active.');
      setTimeout(() => navigate('/dashboard'), 2000);
      setLoading(false);
    }, 1500);
  };

  const paymentMethods = [
    { value: 'GCASH', label: 'GCash', icon: Smartphone, color: 'text-blue-600' },
    { value: 'Credit Card', label: 'Credit / Debit Card', icon: CreditCard, color: 'text-purple-600' },
    { value: 'Bank Transfer', label: 'Bank Transfer', icon: Building2, color: 'text-green-600' }
  ];

  // Success view
  if (paymentSuccess) {
    return (
        <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
          <Header />
          <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Card className="text-center py-12">
              <div className="flex justify-center mb-4">
                <div className="bg-green-100 rounded-full p-3">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-2xl mb-2">Payment Successful!</CardTitle>
              <CardDescription className="text-base mb-6">
                Your {membership.name} membership is now active.
              </CardDescription>
              <p className="text-sm text-gray-500 mb-4">
                Reference: {user.id}-{Date.now()}
              </p>
              <Button onClick={() => navigate('/dashboard')}>
                Go to Dashboard Now
              </Button>
            </Card>
          </main>
          <MobileNav />
        </div>
    );
  }

  return (
      <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
        <Header />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <button
              onClick={() => navigate('/memberships')}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Memberships
          </button>

          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">Complete Your Payment</h2>
            <p className="text-muted-foreground">Review your order and complete payment</p>
          </div>

          {/* Backend Status Banner */}
          {backendStatus === 'offline' && (
              <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-yellow-800">Backend Not Reachable</p>
                    <p className="text-sm text-yellow-700 mb-3">
                      Your Spring Boot backend is not running. Please start it to process real payments.
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleMockPayment}
                        className="bg-white"
                    >
                      Use Mock Payment (Demo)
                    </Button>
                  </div>
                </div>
              </div>
          )}

          {/* Error Banner */}
          {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-800">Payment Error</p>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Payment Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Payment Method Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                  <CardDescription>Select your preferred payment method</CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    <div className="space-y-3">
                      {paymentMethods.map((method) => {
                        const Icon = method.icon;
                        return (
                            <div
                                key={method.value}
                                className={`flex items-center space-x-3 border rounded-lg p-4 cursor-pointer transition-all ${
                                    paymentMethod === method.value
                                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100'
                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                                onClick={() => setPaymentMethod(method.value)}
                            >
                              <RadioGroupItem value={method.value} id={method.value} />
                              <Icon className={`w-5 h-5 ${method.color}`} />
                              <Label htmlFor={method.value} className="cursor-pointer flex-1 font-medium">
                                {method.label}
                              </Label>
                              {paymentMethod === method.value && (
                                  <span className="text-xs text-blue-600 font-medium">Selected</span>
                              )}
                            </div>
                        );
                      })}
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Payment Details based on selected method */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Details</CardTitle>
                  <CardDescription>
                    {paymentMethod === 'GCASH' && 'Pay with GCash'}
                    {paymentMethod === 'Credit Card' && 'Enter your card details'}
                    {paymentMethod === 'Bank Transfer' && 'Bank transfer instructions'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* GCash Payment */}
                  {paymentMethod === 'GCASH' && (
                      <div className="space-y-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Smartphone className="w-5 h-5 text-blue-600" />
                            <h4 className="font-semibold text-blue-800">GCash Payment</h4>
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center p-2 bg-white rounded">
                              <span className="text-sm text-gray-600">Mobile Number:</span>
                              <span className="font-mono font-bold">0917 123 4567</span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-white rounded">
                              <span className="text-sm text-gray-600">Amount:</span>
                              <span className="font-bold text-blue-600">₱{membership.price.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-white rounded">
                              <span className="text-sm text-gray-600">Reference:</span>
                              <span className="font-mono text-xs">{user.id}-{Date.now()}</span>
                            </div>
                          </div>
                          <div className="mt-4 text-sm text-blue-700">
                            <p>1. Open GCash app</p>
                            <p>2. Click "Pay QR" or "Send Money"</p>
                            <p>3. Enter the amount and reference above</p>
                            <p>4. Confirm payment</p>
                          </div>
                        </div>
                      </div>
                  )}

                  {/* Credit Card Payment */}
                  {paymentMethod === 'Credit Card' && (
                      <div className="space-y-4">
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <CreditCard className="w-5 h-5 text-purple-600" />
                            <h4 className="font-semibold text-purple-800">Card Details</h4>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <Label htmlFor="cardNumber">Card Number</Label>
                              <Input
                                  id="cardNumber"
                                  placeholder="1234 5678 9012 3456"
                                  value={cardDetails.cardNumber}
                                  onChange={(e) => setCardDetails({...cardDetails, cardNumber: e.target.value})}
                                  maxLength={19}
                                  className="mt-1"
                              />
                            </div>
                            <div>
                              <Label htmlFor="cardName">Cardholder Name</Label>
                              <Input
                                  id="cardName"
                                  placeholder="John Doe"
                                  value={cardDetails.cardName}
                                  onChange={(e) => setCardDetails({...cardDetails, cardName: e.target.value})}
                                  className="mt-1"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label htmlFor="expiry">Expiry Date</Label>
                                <Input
                                    id="expiry"
                                    placeholder="MM/YY"
                                    value={cardDetails.expiry}
                                    onChange={(e) => setCardDetails({...cardDetails, expiry: e.target.value})}
                                    maxLength={5}
                                    className="mt-1"
                                />
                              </div>
                              <div>
                                <Label htmlFor="cvv">CVV</Label>
                                <Input
                                    id="cvv"
                                    type="password"
                                    placeholder="123"
                                    value={cardDetails.cvv}
                                    onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value})}
                                    maxLength={3}
                                    className="mt-1"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 flex items-center gap-2 text-xs text-purple-700">
                            <Lock className="w-3 h-3" />
                            <span>Your payment information is secure and encrypted</span>
                          </div>
                        </div>
                      </div>
                  )}

                  {/* Bank Transfer */}
                  {paymentMethod === 'Bank Transfer' && (
                      <div className="space-y-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Building2 className="w-5 h-5 text-green-600" />
                            <h4 className="font-semibold text-green-800">Bank Transfer Details</h4>
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center p-2 bg-white rounded">
                              <span className="text-sm text-gray-600">Bank:</span>
                              <span className="font-bold">BDO</span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-white rounded">
                              <span className="text-sm text-gray-600">Account Name:</span>
                              <span className="font-bold">FitLife Gym Inc.</span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-white rounded">
                              <span className="text-sm text-gray-600">Account Number:</span>
                              <span className="font-mono font-bold">1234-5678-9012</span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-white rounded">
                              <span className="text-sm text-gray-600">Amount:</span>
                              <span className="font-bold text-green-600">₱{membership.price.toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="mt-4 text-sm text-green-700">
                            <p>1. Transfer the exact amount to the account above</p>
                            <p>2. Use your name as reference</p>
                            <p>3. Payment will be verified within 24 hours</p>
                          </div>
                        </div>
                      </div>
                  )}
                </CardContent>
              </Card>

              {/* Security Badge */}
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <Lock className="w-4 h-4" />
                <span>Secure payment powered by PayMongo</span>
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-20">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Membership Details */}
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{membership.name} Plan</p>
                      <p className="text-sm text-gray-500">{membership.duration_months} months</p>
                    </div>
                    <p className="font-bold text-lg">₱{membership.price.toLocaleString()}</p>
                  </div>

                  <div className="border-t pt-4">
                    <p className="text-sm text-gray-600 mb-2">Description:</p>
                    <p className="text-sm text-gray-500">{membership.description}</p>
                  </div>

                  {/* Price Breakdown */}
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span>₱{membership.price.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Processing Fee</span>
                      <span className="text-green-600">Free</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                      <span>Total</span>
                      <span className="text-blue-600">₱{membership.price.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3 pt-4">
                    <Button
                        onClick={handlePayment}
                        disabled={loading}
                        className="w-full py-6 text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                    >
                      {loading ? (
                          <div className="flex items-center justify-center">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Processing...
                          </div>
                      ) : (
                          'Pay Now'
                      )}
                    </Button>

                    <Button
                        variant="outline"
                        onClick={() => navigate('/memberships')}
                        className="w-full"
                        disabled={loading}
                    >
                      Cancel
                    </Button>
                  </div>

                  <p className="text-xs text-center text-gray-500">
                    By confirming, you agree to our Terms of Service and Privacy Policy
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>

        <MobileNav />
      </div>
  );
}