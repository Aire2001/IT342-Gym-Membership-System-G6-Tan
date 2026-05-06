import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Download, CheckCircle, XCircle, Clock, Search, Filter,
  Calendar, FileText, Eye, ArrowUpDown, ChevronLeft, ChevronRight,
  Home, ArrowLeft
} from 'lucide-react';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { useAuth } from '../context/AuthContext';
import { apiClient, handleApiError, normalizeStatus } from '../services/api';
import { toast } from 'sonner';
import { Payment } from '../types';
import {
  DialogFooter,
} from './ui/dialog';

export function PaymentHistory() {
  const { user, payments: contextPayments, refreshUserData } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
    from: '',
    to: ''
  });
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Payment;
    direction: 'asc' | 'desc';
  }>({ key: 'payment_date', direction: 'desc' });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Receipt dialog state
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);

  // Status update dialog state
  const [paymentToUpdate, setPaymentToUpdate] = useState<Payment | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isAdmin] = useState(user?.role === 'ADMIN');

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    if (user.role === 'ADMIN') {
      navigate('/admin');
    }
  }, [user, navigate]);

  useEffect(() => {
    // Use context payments initially, but allow refresh
    setPayments(contextPayments);
  }, [contextPayments]);

  useEffect(() => {
    filterAndSortPayments();
  }, [payments, searchTerm, statusFilter, dateRange, sortConfig]);

  const filterAndSortPayments = () => {
    let filtered = [...payments];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(payment =>
          payment.payment_reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.membership?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.payment_method.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(payment => payment.payment_status === statusFilter);
    }

    // Apply date range filter
    if (dateRange.from && dateRange.to) {
      const from = new Date(dateRange.from);
      const to = new Date(dateRange.to);
      to.setHours(23, 59, 59, 999); // Include entire end day

      filtered = filtered.filter(payment => {
        const paymentDate = new Date(payment.payment_date);
        return paymentDate >= from && paymentDate <= to;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortConfig.key];
      let bValue: any = b[sortConfig.key];

      // Handle nested properties
      if (sortConfig.key === 'membership' && a.membership && b.membership) {
        aValue = a.membership.name;
        bValue = b.membership.name;
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredPayments(filtered);
    setCurrentPage(1); // Reset to first page on filter change
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await refreshUserData();
      // Also fetch from API directly for latest data
      const response = await apiClient.getPaymentHistory();
      if (response.success && response.data) {
        setPayments(response.data as Payment[]);
      }
      toast.success('Payment history updated');
    } catch (error) {
      const errorMessage = handleApiError(error);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = async (payment: Payment) => {
    try {
      // In a real app, this would call an API endpoint to generate PDF
      const receiptContent = generateReceiptContent(payment);

      const blob = new Blob([receiptContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${payment.payment_reference}.txt`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success('Receipt downloaded successfully');
    } catch (error) {
      toast.error('Failed to download receipt');
    }
  };

  const handleViewReceipt = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsReceiptDialogOpen(true);
  };

  const normalizeStatusLabel = (status: string) => {
    switch (status?.toString().trim().toLowerCase()) {
      case 'pending':
        return 'Pending';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      default:
        return status;
    }
  };

  const handleOpenStatusDialog = (payment: Payment) => {
    if (!isAdmin) {
      toast.error('Only admins can update payment status.');
      return;
    }

    setPaymentToUpdate(payment);
    setNewStatus(normalizeStatusLabel(payment.payment_status));
    setIsStatusDialogOpen(true);
  };

  const handleUpdatePaymentStatus = async () => {
    if (!isAdmin) {
      toast.error('Only admins can update payment status.');
      setIsStatusDialogOpen(false);
      return;
    }
    if (!paymentToUpdate || !newStatus) {
      toast.error('Invalid payment or status');
      return;
    }

    if (newStatus === paymentToUpdate.payment_status) {
      toast.info('Status is already ' + newStatus);
      setIsStatusDialogOpen(false);
      return;
    }

    setIsUpdatingStatus(true);
    try {
      const response = await apiClient.updatePaymentStatus(paymentToUpdate.id, newStatus);
      if (response.success && response.data) {
        // Update the payment in the list
        setPayments(payments.map(p => 
          p.id === paymentToUpdate.id ? (response.data as Payment) : p
        ));
        // Refresh context data to ensure consistency
        await refreshUserData(user);
        toast.success(`Payment status updated to ${newStatus}`);
        setIsStatusDialogOpen(false);
      } else {
        toast.error(response.error?.message || 'Failed to update payment status');
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      toast.error(errorMessage);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const generateReceiptContent = (payment: Payment): string => {
    return `
╔════════════════════════════════════════════════════════════╗
║                    FITLIFE GYM                             ║
║                 OFFICIAL PAYMENT RECEIPT                   ║
╠════════════════════════════════════════════════════════════╣
║                                                              ║
║  Receipt No: ${payment.payment_reference.padEnd(30)}           ║
║  Date: ${new Date(payment.payment_date).toLocaleString().padEnd(32)} ║
║                                                              ║
║  MEMBER INFORMATION:                                         ║
║  Name: ${user?.firstname} ${user?.lastname}${' '.repeat(25)} ║
║  Email: ${user?.email}${' '.repeat(28)} ║
║                                                              ║
║  PAYMENT DETAILS:                                            ║
║  Membership Plan: ${payment.membership?.name || 'N/A'}${' '.repeat(15)} ║
║  Amount: ₱${payment.amount.toLocaleString().padStart(10)}${' '.repeat(22)} ║
║  Payment Method: ${payment.payment_method}${' '.repeat(18)} ║
║  Status: ${payment.payment_status}${' '.repeat(25)} ║
║  Transaction Date: ${new Date(payment.payment_date).toLocaleDateString()}${' '.repeat(10)} ║
║                                                              ║
║  PAYMENT SUMMARY:                                            ║
║  Subtotal: ₱${payment.amount.toLocaleString().padStart(10)}${' '.repeat(22)} ║
║  Processing Fee: ₱0.00${' '.repeat(23)} ║
║  TOTAL: ₱${payment.amount.toLocaleString().padStart(10)}${' '.repeat(22)} ║
║                                                              ║
║  ────────────────────────────────────────────────────────── ║
║                                                              ║
║  This serves as an official receipt for your membership     ║
║  payment. Please keep this for your records.                ║
║                                                              ║
║  Thank you for choosing FitLife Gym!                        ║
║                                                              ║
╚════════════════════════════════════════════════════════════╝
    `;
  };

  const getStatusIcon = (status: string) => {
    const normalized = normalizeStatusLabel(status);
    switch (normalized) {
      case 'Completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'Failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'Pending':
        return <Clock className="w-4 h-4 text-orange-600" />;
      default:
        return null;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    const normalized = normalizeStatusLabel(status);
    switch (normalized) {
      case 'Completed':
        return 'default';
      case 'Failed':
        return 'destructive';
      case 'Pending':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const handleSort = (key: keyof Payment) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateRange({ from: '', to: '' });
  };

  // Pagination
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const paginatedPayments = filteredPayments.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
  );

  const getPaymentSummary = () => {
    const total = payments.reduce((sum, p) => sum + p.amount, 0);
    const completed = payments.filter(p => p.payment_status.toLowerCase() === 'completed').length;
    const pending = payments.filter(p => p.payment_status.toLowerCase() === 'pending').length;
    const failed = payments.filter(p => p.payment_status.toLowerCase() === 'failed').length;

    return { total, completed, pending, failed };
  };

  if (!user || user.role === 'ADMIN') {
    return null;
  }

  const summary = getPaymentSummary();

  return (
      <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
        <Header />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back to Dashboard Button */}
          <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Dashboard</span>
          </button>

          {/* Header with Summary */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-2">Payment History</h2>
                <p className="text-muted-foreground">View all your membership payment transactions</p>
              </div>
              <div className="flex gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Home
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={loading}
                >
                  <Clock className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  {loading ? 'Refreshing...' : 'Refresh'}
                </Button>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Total Payments</p>
                  <p className="text-2xl font-bold">{payments.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                  <p className="text-2xl font-bold">₱{summary.total.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{summary.completed}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-orange-600">{summary.pending}</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Search and Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by reference, membership, or method..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="flex-1">
                    <Label htmlFor="from" className="text-xs">From Date</Label>
                    <Input
                        id="from"
                        type="date"
                        value={dateRange.from}
                        onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                        className="mt-1"
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="to" className="text-xs">To Date</Label>
                    <Input
                        id="to"
                        type="date"
                        value={dateRange.to}
                        onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                        className="mt-1"
                    />
                  </div>
                  {(searchTerm || statusFilter !== 'all' || dateRange.from || dateRange.to) && (
                      <Button variant="ghost" size="sm" onClick={clearFilters}>
                        Clear Filters
                      </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Count */}
          <div className="mb-4 text-sm text-muted-foreground">
            Showing {paginatedPayments.length} of {filteredPayments.length} payments
          </div>

          {/* Desktop View */}
          <Card className="hidden md:block">
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>Complete list of all your payments</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredPayments.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">No payment history found</p>
                    <Button
                        variant="link"
                        onClick={() => navigate('/memberships')}
                        className="mt-2"
                    >
                      Browse Memberships
                    </Button>
                  </div>
              ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('payment_date')}>
                            <div className="flex items-center gap-1">
                              Date
                              <ArrowUpDown className="w-3 h-3" />
                            </div>
                          </TableHead>
                          <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('membership' as keyof Payment)}>
                            <div className="flex items-center gap-1">
                              Membership
                              <ArrowUpDown className="w-3 h-3" />
                            </div>
                          </TableHead>
                          <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('amount')}>
                            <div className="flex items-center gap-1">
                              Amount
                              <ArrowUpDown className="w-3 h-3" />
                            </div>
                          </TableHead>
                          <TableHead>Payment Method</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Reference</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedPayments.map((payment) => (
                            <TableRow key={payment.id}>
                              <TableCell>{new Date(payment.payment_date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}</TableCell>
                              <TableCell className="font-medium">{payment.membership?.name || 'N/A'}</TableCell>
                              <TableCell className="font-semibold">₱{payment.amount.toLocaleString()}</TableCell>
                              <TableCell>{payment.payment_method}</TableCell>
                              <TableCell>
                                <Badge variant={getStatusVariant(payment.payment_status)} className="flex items-center gap-1 w-fit">
                                  {getStatusIcon(payment.payment_status)}
                                  {payment.payment_status}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-mono text-xs">{payment.payment_reference}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleViewReceipt(payment)}
                                      title="View Receipt"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDownloadReceipt(payment)}
                                      title="Download Receipt"
                                  >
                                    <Download className="w-4 h-4" />
                                  </Button>
                                  {isAdmin && (
                                      <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleOpenStatusDialog(payment)}
                                          title="Update Status"
                                          className="text-xs"
                                      >
                                        Edit
                                      </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4">
                          <p className="text-sm text-muted-foreground">
                            Page {currentPage} of {totalPages}
                          </p>
                          <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                            >
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                    )}
                  </>
              )}
            </CardContent>
          </Card>

          {/* Mobile View */}
          <div className="md:hidden space-y-4">
            {filteredPayments.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">No payment history found</p>
                    <Button
                        variant="link"
                        onClick={() => navigate('/memberships')}
                        className="mt-2"
                    >
                      Browse Memberships
                    </Button>
                  </CardContent>
                </Card>
            ) : (
                paginatedPayments.map((payment) => (
                    <Card key={payment.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{payment.membership?.name || 'Membership Payment'}</CardTitle>
                            <CardDescription>
                              {new Date(payment.payment_date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </CardDescription>
                          </div>
                          <Badge variant={getStatusVariant(payment.payment_status)} className="flex items-center gap-1">
                            {getStatusIcon(payment.payment_status)}
                            {payment.payment_status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Amount</p>
                            <p className="font-semibold text-lg">₱{payment.amount.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Payment Method</p>
                            <p className="font-semibold">{payment.payment_method}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Reference Number</p>
                          <p className="font-mono text-sm bg-muted p-2 rounded">{payment.payment_reference}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleViewReceipt(payment)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                          <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleDownloadReceipt(payment)}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                ))
            )}

            {/* Mobile Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
                  <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
            )}
          </div>

          {/* Export Options */}
          {filteredPayments.length > 0 && (
              <div className="mt-6 flex justify-end">
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export as CSV
                </Button>
              </div>
          )}
        </main>

        {/* Receipt Dialog */}
        <Dialog open={isReceiptDialogOpen} onOpenChange={setIsReceiptDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Payment Receipt</DialogTitle>
              <DialogDescription>
                Official receipt for your membership payment
              </DialogDescription>
            </DialogHeader>

            {selectedPayment && (
                <div className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg font-mono text-xs whitespace-pre overflow-x-auto">
                    {generateReceiptContent(selectedPayment)}
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setIsReceiptDialogOpen(false)}
                    >
                      Close
                    </Button>
                    <Button
                        onClick={() => {
                          handleDownloadReceipt(selectedPayment);
                          setIsReceiptDialogOpen(false);
                        }}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Receipt
                    </Button>
                  </div>
                </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Status Update Dialog */}
        <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Update Payment Status</DialogTitle>
              <DialogDescription>
                Change the status for payment reference: {paymentToUpdate?.payment_reference}
              </DialogDescription>
            </DialogHeader>

            {paymentToUpdate && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="status-select">New Status</Label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger id="status-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setIsStatusDialogOpen(false)}
                        disabled={isUpdatingStatus}
                    >
                      Cancel
                    </Button>
                    <Button
                        onClick={handleUpdatePaymentStatus}
                        disabled={isUpdatingStatus}
                    >
                      {isUpdatingStatus ? 'Updating...' : 'Update Status'}
                    </Button>
                  </DialogFooter>
                </div>
            )}
          </DialogContent>
        </Dialog>

        <MobileNav />
      </div>
  );
}