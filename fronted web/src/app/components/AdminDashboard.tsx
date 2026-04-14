import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Users, CreditCard, TrendingUp, DollarSign, LayoutDashboard,
  Package, UserCircle, Search, Filter, Plus, Edit, Trash2,
  Eye, Download, X, CheckCircle, XCircle, Clock, RefreshCw,
  Save, AlertCircle
} from 'lucide-react';
import { Header } from './Header';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { useAuth } from '../context/AuthContext';
import { apiClient, handleApiError } from '../services/api';
import { toast } from 'sonner';
import { Membership, User, Payment } from '../types';

interface DashboardStats {
  totalMembers: number;
  activeMemberships: number;
  monthlyRevenue: number;
  pendingPayments: number;
}

interface AdminUser extends User {
  membership?: string;
  membershipStatus?: 'Active' | 'Expired' | 'Pending';
  joinDate: string;
}

export function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Dialog states
  const [isMembershipDialogOpen, setIsMembershipDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit' | 'view'>('add');

  // Form states
  const [membershipForm, setMembershipForm] = useState({
    name: '',
    duration_months: 1,
    price: 0,
    description: ''
  });

  const [userForm, setUserForm] = useState({
    firstname: '',
    lastname: '',
    email: '',
    role: 'USER',
    membership: 'None',
    status: 'Pending'
  });

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    if (user.role !== 'ADMIN') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch all data in parallel
      const [membershipsRes, usersRes, paymentsRes] = await Promise.all([
        apiClient.getMemberships(),
        apiClient.getAdminUsers(),
        apiClient.getAdminPayments()
      ]);

      if (membershipsRes.success) {
        setMemberships(membershipsRes.data as Membership[]);
      }

      if (usersRes.success) {
        // Transform user data to AdminUser format
        const adminUsers = (usersRes.data as any[]).map(u => ({
          id: u.id,
          email: u.email,
          firstname: u.firstname,
          lastname: u.lastname,
          role: u.role,
          membership: u.membership || 'None',
          membershipStatus: u.membershipStatus || 'Pending',
          joinDate: u.joinDate || new Date().toISOString()
        }));
        setUsers(adminUsers);
      }

      if (paymentsRes.success) {
        setPayments(paymentsRes.data as Payment[]);
      }

      // Calculate stats
      calculateStats(usersRes.data || [], paymentsRes.data || []);

    } catch (error) {
      const errorMessage = handleApiError(error);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (usersData: any[], paymentsData: any[]) => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const activeUsers = usersData.filter(u => u.membershipStatus === 'Active').length;
    const monthlyPayments = paymentsData.filter(p =>
        new Date(p.payment_date) >= firstDayOfMonth &&
        p.payment_status === 'Completed'
    );
    const monthlyRevenue = monthlyPayments.reduce((sum, p) => sum + p.amount, 0);
    const pendingCount = paymentsData.filter(p => p.payment_status === 'Pending').length;

    setStats({
      totalMembers: usersData.length,
      activeMemberships: activeUsers,
      monthlyRevenue,
      pendingPayments: pendingCount
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
    toast.success('Dashboard refreshed');
  };

  // ================ Membership CRUD Operations ================

  const handleAddMembership = () => {
    setDialogMode('add');
    setMembershipForm({
      name: '',
      duration_months: 1,
      price: 0,
      description: ''
    });
    setIsMembershipDialogOpen(true);
  };

  const handleEditMembership = (membership: Membership) => {
    setDialogMode('edit');
    setSelectedItem(membership);
    setMembershipForm({
      name: membership.name,
      duration_months: membership.duration_months,
      price: membership.price,
      description: membership.description
    });
    setIsMembershipDialogOpen(true);
  };

  const handleViewMembership = (membership: Membership) => {
    setDialogMode('view');
    setSelectedItem(membership);
    setMembershipForm({
      name: membership.name,
      duration_months: membership.duration_months,
      price: membership.price,
      description: membership.description
    });
    setIsMembershipDialogOpen(true);
  };

  const handleDeleteClick = (item: any, type: string) => {
    setSelectedItem({ ...item, type });
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedItem) return;

    try {
      if (selectedItem.type === 'membership') {
        const response = await apiClient.deleteMembership(selectedItem.id);
        if (response.success) {
          toast.success('Membership deleted successfully');
          fetchDashboardData();
        }
      } else if (selectedItem.type === 'user') {
        const response = await apiClient.deleteUser(selectedItem.id);
        if (response.success) {
          toast.success('User deleted successfully');
          fetchDashboardData();
        }
      }
      setIsDeleteDialogOpen(false);
    } catch (error) {
      const errorMessage = handleApiError(error);
      toast.error(errorMessage);
    }
  };

  const handleSaveMembership = async () => {
    try {
      if (dialogMode === 'add') {
        const response = await apiClient.createMembership(membershipForm);
        if (response.success) {
          toast.success('Membership created successfully');
        }
      } else if (dialogMode === 'edit' && selectedItem) {
        const response = await apiClient.updateMembership(selectedItem.id, membershipForm);
        if (response.success) {
          toast.success('Membership updated successfully');
        }
      }
      setIsMembershipDialogOpen(false);
      fetchDashboardData();
    } catch (error) {
      const errorMessage = handleApiError(error);
      toast.error(errorMessage);
    }
  };

  // ================ User CRUD Operations ================

  const handleViewUser = (user: AdminUser) => {
    setDialogMode('view');
    setSelectedItem(user);
    setUserForm({
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      role: user.role,
      membership: user.membership || 'None',
      status: user.membershipStatus || 'Pending'
    });
    setIsUserDialogOpen(true);
  };

  const handleEditUser = (user: AdminUser) => {
    setDialogMode('edit');
    setSelectedItem(user);
    setUserForm({
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      role: user.role,
      membership: user.membership || 'None',
      status: user.membershipStatus || 'Pending'
    });
    setIsUserDialogOpen(true);
  };

  const handleSaveUser = async () => {
    try {
      if (selectedItem && dialogMode === 'edit') {
        const response = await apiClient.updateUserRole(selectedItem.id, userForm.role);
        if (response.success) {
          toast.success('User role updated successfully');
        }
      }
      setIsUserDialogOpen(false);
      fetchDashboardData();
    } catch (error) {
      const errorMessage = handleApiError(error);
      toast.error(errorMessage);
    }
  };

  // ================ Payment Operations ================

  const handleViewPayment = (payment: Payment) => {
    setSelectedItem(payment);
    setIsPaymentDialogOpen(true);
  };

  // Filter functions
  const getFilteredUsers = () => {
    return users.filter(user => {
      const matchesSearch =
          user.firstname.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.lastname.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || user.membershipStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  };

  const getFilteredPayments = () => {
    return payments.filter(payment => {
      const matchesSearch =
          payment.payment_reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.membership?.name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || payment.payment_status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active':
      case 'Completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'Expired':
      case 'Failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'Pending':
        return <Clock className="w-4 h-4 text-orange-600" />;
      default:
        return null;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'Active':
      case 'Completed':
        return 'default';
      case 'Expired':
      case 'Failed':
        return 'destructive';
      case 'Pending':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  const filteredUsers = getFilteredUsers();
  const filteredPayments = getFilteredPayments();

  return (
      <div className="min-h-screen bg-gray-50">
        <Header />

        <div className="flex">
          {/* Sidebar - Desktop */}
          <aside className="hidden lg:block w-64 bg-white border-r min-h-[calc(100vh-4rem)] sticky top-16">
            <nav className="p-4 space-y-2">
              <Button
                  variant={activeTab === 'overview' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('overview')}
              >
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <Button
                  variant={activeTab === 'memberships' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('memberships')}
              >
                <Package className="w-4 h-4 mr-2" />
                Membership Plans
              </Button>
              <Button
                  variant={activeTab === 'users' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('users')}
              >
                <UserCircle className="w-4 h-4 mr-2" />
                Manage Users
              </Button>
              <Button
                  variant={activeTab === 'payments' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('payments')}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                View Payments
              </Button>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            {/* Header with Refresh */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
                <p className="text-muted-foreground">Manage your gym's memberships and payments</p>
              </div>
              <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>

            {/* Mobile Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="lg:hidden mb-6">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="memberships">Plans</TabsTrigger>
                <TabsTrigger value="users">Users</TabsTrigger>
                <TabsTrigger value="payments">Payments</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Loading State */}
            {loading && (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="mt-2 text-muted-foreground">Loading dashboard data...</p>
                </div>
            )}

            {/* Overview Tab */}
            {!loading && activeTab === 'overview' && stats && (
                <div className="space-y-6">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.totalMembers}</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Memberships</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.activeMemberships}</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">₱{stats.monthlyRevenue.toLocaleString()}</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.pendingPayments}</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recent Activity */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Payments</CardTitle>
                      <CardDescription>Latest membership payment transactions</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Reference</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {payments.slice(0, 5).map((payment) => (
                              <TableRow key={payment.id}>
                                <TableCell className="font-mono text-sm">{payment.payment_reference}</TableCell>
                                <TableCell className="font-medium">
                                  {users.find(u => u.id === payment.user_id)?.firstname || 'Unknown'}
                                </TableCell>
                                <TableCell>₱{payment.amount.toLocaleString()}</TableCell>
                                <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                                <TableCell>
                                  <Badge variant={getStatusVariant(payment.payment_status)} className="flex items-center gap-1 w-fit">
                                    {getStatusIcon(payment.payment_status)}
                                    {payment.payment_status}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
            )}

            {/* Membership Plans Tab */}
            {!loading && activeTab === 'memberships' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-bold mb-2">Membership Plans</h2>
                      <p className="text-muted-foreground">Manage your gym membership offerings</p>
                    </div>
                    <Button onClick={handleAddMembership}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add New Plan
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {memberships.map((membership) => (
                        <Card key={membership.id}>
                          <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                              {membership.name}
                              <Badge variant="outline">{membership.duration_months} months</Badge>
                            </CardTitle>
                            <CardDescription>{membership.description}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div>
                                <p className="text-3xl font-bold">₱{membership.price.toLocaleString()}</p>
                                <p className="text-sm text-muted-foreground">
                                  ₱{Math.round(membership.price / membership.duration_months)} per month
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => handleViewMembership(membership)}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  View
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => handleEditMembership(membership)}
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => handleDeleteClick(membership, 'membership')}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                    ))}
                  </div>
                </div>
            )}

            {/* Users Tab */}
            {!loading && activeTab === 'users' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold mb-2">Manage Members</h2>
                    <p className="text-muted-foreground">View and manage all gym members</p>
                  </div>

                  {/* Search and Filter */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                          placeholder="Search members by name or email..."
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
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Expired">Expired</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Card>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Membership</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Join Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredUsers.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                  No members found
                                </TableCell>
                              </TableRow>
                          ) : (
                              filteredUsers.map((user) => (
                                  <TableRow key={user.id}>
                                    <TableCell className="font-medium">
                                      {user.firstname} {user.lastname}
                                    </TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>{user.membership}</TableCell>
                                    <TableCell>
                                      <Badge variant={getStatusVariant(user.membershipStatus || 'Pending')} className="flex items-center gap-1 w-fit">
                                        {getStatusIcon(user.membershipStatus || 'Pending')}
                                        {user.membershipStatus}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>{new Date(user.joinDate).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex items-center justify-end gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => handleViewUser(user)}>
                                          <Eye className="w-4 h-4 mr-2" />
                                          View
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)}>
                                          <Edit className="w-4 h-4 mr-2" />
                                          Edit
                                        </Button>
                                        <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDeleteClick(user, 'user')}>
                                          <Trash2 className="w-4 h-4 mr-2" />
                                          Delete
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                              ))
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
            )}

            {/* Payments Tab */}
            {!loading && activeTab === 'payments' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold mb-2">Payment Transactions</h2>
                    <p className="text-muted-foreground">Monitor all membership payment transactions</p>
                  </div>

                  {/* Search and Filters */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                          placeholder="Search by reference or membership..."
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

                  <Card>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Reference</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Membership</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredPayments.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                  No payments found
                                </TableCell>
                              </TableRow>
                          ) : (
                              filteredPayments.map((payment) => (
                                  <TableRow key={payment.id}>
                                    <TableCell className="font-mono text-sm">{payment.payment_reference}</TableCell>
                                    <TableCell className="font-medium">
                                      {users.find(u => u.id === payment.user_id)?.firstname || 'Unknown'}
                                    </TableCell>
                                    <TableCell>{payment.membership?.name || 'N/A'}</TableCell>
                                    <TableCell>₱{payment.amount.toLocaleString()}</TableCell>
                                    <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                                    <TableCell>{payment.payment_method}</TableCell>
                                    <TableCell>
                                      <Badge variant={getStatusVariant(payment.payment_status)} className="flex items-center gap-1 w-fit">
                                        {getStatusIcon(payment.payment_status)}
                                        {payment.payment_status}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Button variant="ghost" size="sm" onClick={() => handleViewPayment(payment)}>
                                        <Eye className="w-4 h-4 mr-2" />
                                        Details
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                              ))
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
            )}
          </main>
        </div>

        {/* Membership Form Dialog */}
        <Dialog open={isMembershipDialogOpen} onOpenChange={setIsMembershipDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {dialogMode === 'add' && 'Add New Membership Plan'}
                {dialogMode === 'edit' && 'Edit Membership Plan'}
                {dialogMode === 'view' && 'View Membership Plan'}
              </DialogTitle>
              <DialogDescription>
                {dialogMode === 'add' && 'Fill in the details to create a new membership plan.'}
                {dialogMode === 'edit' && 'Update the membership plan details below.'}
                {dialogMode === 'view' && 'View membership plan details.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Plan Name</Label>
                <Input
                    id="name"
                    value={membershipForm.name}
                    onChange={(e) => setMembershipForm({ ...membershipForm, name: e.target.value })}
                    placeholder="e.g., Premium"
                    disabled={dialogMode === 'view'}
                    readOnly={dialogMode === 'view'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    value={membershipForm.description}
                    onChange={(e) => setMembershipForm({ ...membershipForm, description: e.target.value })}
                    placeholder="Brief description of the plan"
                    disabled={dialogMode === 'view'}
                    readOnly={dialogMode === 'view'}
                    rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (months)</Label>
                  <Input
                      id="duration"
                      type="number"
                      min="1"
                      value={membershipForm.duration_months}
                      onChange={(e) => setMembershipForm({ ...membershipForm, duration_months: parseInt(e.target.value) })}
                      disabled={dialogMode === 'view'}
                      readOnly={dialogMode === 'view'}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Price (₱)</Label>
                  <Input
                      id="price"
                      type="number"
                      min="0"
                      value={membershipForm.price}
                      onChange={(e) => setMembershipForm({ ...membershipForm, price: parseInt(e.target.value) })}
                      disabled={dialogMode === 'view'}
                      readOnly={dialogMode === 'view'}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              {dialogMode !== 'view' ? (
                  <>
                    <Button variant="outline" onClick={() => setIsMembershipDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveMembership}>
                      <Save className="w-4 h-4 mr-2" />
                      {dialogMode === 'add' ? 'Create Plan' : 'Save Changes'}
                    </Button>
                  </>
              ) : (
                  <Button onClick={() => setIsMembershipDialogOpen(false)}>
                    Close
                  </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* User Form Dialog */}
        <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {dialogMode === 'view' ? 'View User Details' : 'Edit User'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input value={userForm.firstname} readOnly={dialogMode === 'view'} />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input value={userForm.lastname} readOnly={dialogMode === 'view'} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={userForm.email} readOnly={dialogMode === 'view'} />
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                {dialogMode === 'view' ? (
                    <Input value={userForm.role} readOnly />
                ) : (
                    <Select value={userForm.role} onValueChange={(v) => setUserForm({...userForm, role: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USER">User</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label>Membership Status</Label>
                {dialogMode === 'view' ? (
                    <Input value={userForm.status} readOnly />
                ) : (
                    <Select value={userForm.status} onValueChange={(v) => setUserForm({...userForm, status: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Expired">Expired</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                )}
              </div>
            </div>

            <DialogFooter>
              {dialogMode !== 'view' ? (
                  <>
                    <Button variant="outline" onClick={() => setIsUserDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveUser}>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                  </>
              ) : (
                  <Button onClick={() => setIsUserDialogOpen(false)}>
                    Close
                  </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Payment Details Dialog */}
        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Payment Details</DialogTitle>
            </DialogHeader>

            {selectedItem && (
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">Reference</Label>
                      <p className="font-mono">{selectedItem.payment_reference}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Amount</Label>
                      <p className="font-bold">₱{selectedItem.amount.toLocaleString()}</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm text-muted-foreground">Status</Label>
                    <Badge variant={getStatusVariant(selectedItem.payment_status)} className="mt-1">
                      {getStatusIcon(selectedItem.payment_status)}
                      {selectedItem.payment_status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">Method</Label>
                      <p>{selectedItem.payment_method}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Date</Label>
                      <p>{new Date(selectedItem.payment_date).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm text-muted-foreground">Membership</Label>
                    <p>{selectedItem.membership?.name || 'N/A'}</p>
                  </div>

                  <div>
                    <Label className="text-sm text-muted-foreground">User</Label>
                    <p>{users.find(u => u.id === selectedItem.user_id)?.firstname} {users.find(u => u.id === selectedItem.user_id)?.lastname}</p>
                  </div>
                </div>
            )}

            <DialogFooter>
              <Button onClick={() => setIsPaymentDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                {selectedItem?.type === 'membership' ? ' membership plan' : ' user'}
                and remove all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
  );
}