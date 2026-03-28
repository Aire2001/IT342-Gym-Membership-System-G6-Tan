import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
    User, Mail, Phone, Calendar, MapPin, Camera,
    Lock, Bell, Moon, Sun, Globe, Save,
    Eye, EyeOff, CheckCircle, XCircle, AlertCircle,
    LogOut, Trash2, ArrowLeft,
    Edit, HelpCircle
} from 'lucide-react';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { Button } from './ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from './ui/dialog';
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

interface ProfileFormData {
    firstname: string;
    lastname: string;
    email: string;
    phone: string;
    birthDate: string;
    address: string;
    city: string;
    country: string;
    zipCode: string;
}

interface PasswordFormData {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

interface NotificationSettings {
    emailNotifications: boolean;
    smsNotifications: boolean;
    paymentAlerts: boolean;
    membershipReminders: boolean;
    promotionalEmails: boolean;
    newsletter: boolean;
}

export function Profile() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');

    // Profile form state
    const [profileForm, setProfileForm] = useState<ProfileFormData>({
        firstname: user?.firstname || '',
        lastname: user?.lastname || '',
        email: user?.email || '',
        phone: '+63 912 345 6789',
        birthDate: '1990-01-01',
        address: '123 Fitness Street',
        city: 'Makati City',
        country: 'Philippines',
        zipCode: '1200'
    });

    // Password form state
    const [passwordForm, setPasswordForm] = useState<PasswordFormData>({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Password visibility states
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Notification settings
    const [notifications, setNotifications] = useState<NotificationSettings>({
        emailNotifications: true,
        smsNotifications: false,
        paymentAlerts: true,
        membershipReminders: true,
        promotionalEmails: false,
        newsletter: true
    });

    // Theme preference
    const [darkMode, setDarkMode] = useState(false);

    // Dialog states
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
    const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Password strength indicators
    const [passwordStrength, setPasswordStrength] = useState({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false
    });

    useEffect(() => {
        if (!user) {
            navigate('/');
        }
    }, [user, navigate]);

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // API call to update profile
            // await apiClient.updateProfile(profileForm);

            // Update local storage
            const updatedUser = { ...user, ...profileForm };
            localStorage.setItem('user', JSON.stringify(updatedUser));

            setSuccessMessage('Profile updated successfully!');
            setIsSuccessDialogOpen(true);
            setIsEditMode(false);
            toast.success('Profile updated successfully');
        } catch (error) {
            const errorMessage = handleApiError(error);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate passwords
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }

        if (passwordForm.newPassword.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }

        if (!checkPasswordStrength(passwordForm.newPassword)) {
            toast.error('Password is too weak. Include uppercase, lowercase, numbers, and special characters.');
            return;
        }

        setLoading(true);

        try {
            // API call to change password
            // await apiClient.changePassword({
            //   currentPassword: passwordForm.currentPassword,
            //   newPassword: passwordForm.newPassword
            // });

            setSuccessMessage('Password changed successfully!');
            setIsSuccessDialogOpen(true);
            setIsPasswordDialogOpen(false);
            setPasswordForm({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
            toast.success('Password changed successfully');
        } catch (error) {
            const errorMessage = handleApiError(error);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        try {
            // API call to delete account
            // await apiClient.deleteAccount();

            toast.success('Account deleted successfully');
            logout();
            navigate('/');
        } catch (error) {
            const errorMessage = handleApiError(error);
            toast.error(errorMessage);
        }
    };

    const checkPasswordStrength = (password: string) => {
        const strength = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[!@#$%^&*]/.test(password)
        };
        setPasswordStrength(strength);
        return Object.values(strength).every(Boolean);
    };

    const getPasswordStrengthColor = () => {
        const score = Object.values(passwordStrength).filter(Boolean).length;
        if (score <= 2) return 'bg-red-500';
        if (score <= 4) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const getInitials = () => {
        return `${user?.firstname?.[0] || ''}${user?.lastname?.[0] || ''}`.toUpperCase();
    };

    const handleLogout = () => {
        logout();
        toast.success('Logged out successfully');
        navigate('/');
    };

    const handleGoBack = () => {
        navigate(-1);
    };

    const handleEditProfile = () => {
        setIsEditMode(true);
    };

    const handleCancelEdit = () => {
        setIsEditMode(false);
        setProfileForm({
            firstname: user?.firstname || '',
            lastname: user?.lastname || '',
            email: user?.email || '',
            phone: '+63 912 345 6789',
            birthDate: '1990-01-01',
            address: '123 Fitness Street',
            city: 'Makati City',
            country: 'Philippines',
            zipCode: '1200'
        });
    };

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
            <Header />

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Back Button */}
                <button
                    onClick={handleGoBack}
                    className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    <span>Back</span>
                </button>

                {/* Page Title */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
                    <p className="text-gray-500 mt-1">Manage your profile and preferences</p>
                </div>

                {/* Profile Overview Card */}
                <Card className="mb-8 border-none shadow-sm">
                    <CardContent className="pt-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                            <div className="relative group">
                                <Avatar className="w-20 h-20 border-4 border-white shadow-md">
                                    <AvatarImage src={`https://ui-avatars.com/api/?name=${user.firstname}+${user.lastname}&background=3b82f6&color=fff&size=80`} />
                                    <AvatarFallback className="bg-blue-500 text-white text-xl">
                                        {getInitials()}
                                    </AvatarFallback>
                                </Avatar>
                                <button className="absolute -bottom-1 -right-1 p-1.5 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors border">
                                    <Camera className="w-4 h-4 text-gray-600" />
                                </button>
                            </div>
                            <div className="flex-1">
                                <h2 className="text-xl font-semibold text-gray-900">
                                    {user.firstname} {user.lastname}
                                </h2>
                                <p className="text-gray-500 text-sm">{user.email}</p>
                                <div className="flex flex-wrap gap-2 mt-3">
                                    <Badge variant="secondary" className="px-3 py-1">
                                        {user.role}
                                    </Badge>
                                    <Badge variant="outline" className="px-3 py-1">
                                        Member since 2026
                                    </Badge>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                onClick={handleEditProfile}
                                className="sm:self-center"
                            >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Profile
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Settings Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid grid-cols-4 w-full bg-white border p-1">
                        <TabsTrigger value="profile">Profile</TabsTrigger>
                        <TabsTrigger value="security">Security</TabsTrigger>
                        <TabsTrigger value="notifications">Notifications</TabsTrigger>
                        <TabsTrigger value="preferences">Preferences</TabsTrigger>
                    </TabsList>

                    {/* Profile Tab */}
                    <TabsContent value="profile">
                        <Card className="border-none shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-xl">Personal Information</CardTitle>
                                <CardDescription>Update your personal details</CardDescription>
                            </CardHeader>
                            <form onSubmit={handleProfileUpdate}>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="firstname">First Name</Label>
                                            <Input
                                                id="firstname"
                                                value={profileForm.firstname}
                                                onChange={(e) => setProfileForm({ ...profileForm, firstname: e.target.value })}
                                                disabled={!isEditMode}
                                                className={!isEditMode ? 'bg-gray-50' : ''}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="lastname">Last Name</Label>
                                            <Input
                                                id="lastname"
                                                value={profileForm.lastname}
                                                onChange={(e) => setProfileForm({ ...profileForm, lastname: e.target.value })}
                                                disabled={!isEditMode}
                                                className={!isEditMode ? 'bg-gray-50' : ''}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={profileForm.email}
                                            onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                                            disabled={!isEditMode}
                                            className={!isEditMode ? 'bg-gray-50' : ''}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone Number</Label>
                                        <Input
                                            id="phone"
                                            value={profileForm.phone}
                                            onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                                            disabled={!isEditMode}
                                            className={!isEditMode ? 'bg-gray-50' : ''}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="birthDate">Birth Date</Label>
                                        <Input
                                            id="birthDate"
                                            type="date"
                                            value={profileForm.birthDate}
                                            onChange={(e) => setProfileForm({ ...profileForm, birthDate: e.target.value })}
                                            disabled={!isEditMode}
                                            className={!isEditMode ? 'bg-gray-50' : ''}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="address">Address</Label>
                                        <Input
                                            id="address"
                                            value={profileForm.address}
                                            onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                                            disabled={!isEditMode}
                                            className={!isEditMode ? 'bg-gray-50' : ''}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="city">City</Label>
                                            <Input
                                                id="city"
                                                value={profileForm.city}
                                                onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                                                disabled={!isEditMode}
                                                className={!isEditMode ? 'bg-gray-50' : ''}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="country">Country</Label>
                                            <Input
                                                id="country"
                                                value={profileForm.country}
                                                onChange={(e) => setProfileForm({ ...profileForm, country: e.target.value })}
                                                disabled={!isEditMode}
                                                className={!isEditMode ? 'bg-gray-50' : ''}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="zipCode">Zip Code</Label>
                                            <Input
                                                id="zipCode"
                                                value={profileForm.zipCode}
                                                onChange={(e) => setProfileForm({ ...profileForm, zipCode: e.target.value })}
                                                disabled={!isEditMode}
                                                className={!isEditMode ? 'bg-gray-50' : ''}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                                {isEditMode && (
                                    <CardFooter className="flex justify-end gap-3 border-t pt-6">
                                        <Button variant="outline" type="button" onClick={handleCancelEdit}>
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={loading}>
                                            {loading ? 'Saving...' : 'Save Changes'}
                                            {!loading && <Save className="w-4 h-4 ml-2" />}
                                        </Button>
                                    </CardFooter>
                                )}
                            </form>
                        </Card>
                    </TabsContent>

                    {/* Security Tab */}
                    <TabsContent value="security">
                        <Card className="border-none shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-xl">Security Settings</CardTitle>
                                <CardDescription>Manage your password and account security</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Password Section */}
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div>
                                        <h3 className="font-medium">Password</h3>
                                        <p className="text-sm text-gray-500">Last changed 30 days ago</p>
                                    </div>
                                    <Button onClick={() => setIsPasswordDialogOpen(true)} variant="outline">
                                        <Lock className="w-4 h-4 mr-2" />
                                        Change
                                    </Button>
                                </div>

                                <Separator />

                                {/* Two-Factor Authentication */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-medium">Two-Factor Authentication</h3>
                                        <p className="text-sm text-gray-500">Add an extra layer of security</p>
                                    </div>
                                    <Switch />
                                </div>

                                <Separator />

                                {/* Danger Zone */}
                                <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-medium text-red-700">Delete Account</h3>
                                            <p className="text-sm text-red-600">Permanently delete your account</p>
                                        </div>
                                        <Button
                                            variant="destructive"
                                            onClick={() => setIsDeleteDialogOpen(true)}
                                            size="sm"
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Notifications Tab */}
                    <TabsContent value="notifications">
                        <Card className="border-none shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-xl">Notification Preferences</CardTitle>
                                <CardDescription>Choose how you want to be notified</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Email Notifications</p>
                                        <p className="text-sm text-gray-500">Receive updates via email</p>
                                    </div>
                                    <Switch
                                        checked={notifications.emailNotifications}
                                        onCheckedChange={(checked) =>
                                            setNotifications({ ...notifications, emailNotifications: checked })
                                        }
                                    />
                                </div>

                                <Separator />

                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">SMS Notifications</p>
                                        <p className="text-sm text-gray-500">Receive updates via text</p>
                                    </div>
                                    <Switch
                                        checked={notifications.smsNotifications}
                                        onCheckedChange={(checked) =>
                                            setNotifications({ ...notifications, smsNotifications: checked })
                                        }
                                    />
                                </div>

                                <Separator />

                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Payment Alerts</p>
                                        <p className="text-sm text-gray-500">Get notified about payments</p>
                                    </div>
                                    <Switch
                                        checked={notifications.paymentAlerts}
                                        onCheckedChange={(checked) =>
                                            setNotifications({ ...notifications, paymentAlerts: checked })
                                        }
                                    />
                                </div>

                                <Separator />

                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Membership Reminders</p>
                                        <p className="text-sm text-gray-500">Reminders about expiration</p>
                                    </div>
                                    <Switch
                                        checked={notifications.membershipReminders}
                                        onCheckedChange={(checked) =>
                                            setNotifications({ ...notifications, membershipReminders: checked })
                                        }
                                    />
                                </div>
                            </CardContent>
                            <CardFooter className="border-t pt-6">
                                <Button className="ml-auto">Save Preferences</Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>

                    {/* Preferences Tab */}
                    <TabsContent value="preferences">
                        <Card className="border-none shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-xl">App Preferences</CardTitle>
                                <CardDescription>Customize your experience</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                                        <div>
                                            <p className="font-medium">Dark Mode</p>
                                            <p className="text-sm text-gray-500">Switch theme</p>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={darkMode}
                                        onCheckedChange={setDarkMode}
                                    />
                                </div>

                                <Separator />

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Globe className="w-5 h-5" />
                                        <div>
                                            <p className="font-medium">Language</p>
                                            <p className="text-sm text-gray-500">Choose your language</p>
                                        </div>
                                    </div>
                                    <select className="border rounded-md px-3 py-1.5 text-sm">
                                        <option>English</option>
                                        <option>Tagalog</option>
                                        <option>Cebuano</option>
                                    </select>
                                </div>

                                <Separator />

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Bell className="w-5 h-5" />
                                        <div>
                                            <p className="font-medium">Sound Effects</p>
                                            <p className="text-sm text-gray-500">Play notification sounds</p>
                                        </div>
                                    </div>
                                    <Switch defaultChecked />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Help Section */}
                <div className="mt-8 bg-blue-50 rounded-xl p-6 border border-blue-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <HelpCircle className="w-5 h-5 text-blue-600" />
                            <div>
                                <h3 className="font-medium text-blue-900">Need assistance?</h3>
                                <p className="text-sm text-blue-700">Our support team is here to help</p>
                            </div>
                        </div>
                        <Button variant="ghost" className="text-blue-700 hover:text-blue-800 hover:bg-blue-100">
                            Contact Support
                        </Button>
                    </div>
                </div>
            </main>

            {/* Change Password Dialog */}
            <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Change Password</DialogTitle>
                        <DialogDescription>
                            Enter your current password and choose a new one
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handlePasswordChange}>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Current Password</Label>
                                <div className="relative">
                                    <Input
                                        type={showCurrentPassword ? "text" : "password"}
                                        value={passwordForm.currentPassword}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2"
                                    >
                                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>New Password</Label>
                                <div className="relative">
                                    <Input
                                        type={showNewPassword ? "text" : "password"}
                                        value={passwordForm.newPassword}
                                        onChange={(e) => {
                                            setPasswordForm({ ...passwordForm, newPassword: e.target.value });
                                            checkPasswordStrength(e.target.value);
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2"
                                    >
                                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>

                                {passwordForm.newPassword && (
                                    <div className="mt-2">
                                        <div className="flex gap-1 mb-2">
                                            <div className={`h-1 flex-1 rounded ${passwordStrength.length ? 'bg-green-500' : 'bg-gray-200'}`} />
                                            <div className={`h-1 flex-1 rounded ${passwordStrength.uppercase ? 'bg-green-500' : 'bg-gray-200'}`} />
                                            <div className={`h-1 flex-1 rounded ${passwordStrength.lowercase ? 'bg-green-500' : 'bg-gray-200'}`} />
                                            <div className={`h-1 flex-1 rounded ${passwordStrength.number ? 'bg-green-500' : 'bg-gray-200'}`} />
                                            <div className={`h-1 flex-1 rounded ${passwordStrength.special ? 'bg-green-500' : 'bg-gray-200'}`} />
                                        </div>
                                        <p className="text-xs text-gray-500">Use 8+ characters with mix of letters, numbers & symbols</p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>Confirm Password</Label>
                                <div className="relative">
                                    <Input
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={passwordForm.confirmPassword}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2"
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Changing...' : 'Change Password'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Account Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Account</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your account
                            and remove all your data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-700">
                            Delete Account
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Logout Dialog */}
            <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Logout</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to logout?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleLogout}>
                            Logout
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Success Dialog */}
            <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Success</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="flex items-center gap-3 text-green-600">
                            <CheckCircle className="w-5 h-5" />
                            <p>{successMessage}</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setIsSuccessDialogOpen(false)}>
                            OK
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <MobileNav />
        </div>
    );
}