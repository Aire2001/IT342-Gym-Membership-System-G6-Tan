import React, { useState, useRef, useEffect } from 'react';
import { profileAPI } from './profileApi';
import { useAuth } from '../auth/AuthContext';

/* ── tiny helpers ── */
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-5">
    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">{title}</h2>
    {children}
  </div>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="mb-4">
    <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
    {children}
  </div>
);

const inputCls =
  'w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm';

const Alert = ({ type, msg }: { type: 'success' | 'error'; msg: string }) => (
  <div
    className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${
      type === 'success'
        ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
        : 'bg-red-50 border border-red-200 text-red-600'
    }`}
  >
    {msg}
  </div>
);

/* ── main component ── */
const Profile = () => {
  const { user, updateUser, logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* profile */
  const [form, setForm] = useState({ firstname: user?.firstname ?? '', lastname: user?.lastname ?? '' });
  const [preview, setPreview] = useState<string | null>(user?.profilePicture ?? null);
  const [pendingPhotoFile, setPendingPhotoFile] = useState<File | null>(null);
  const [pendingRemovePhoto, setPendingRemovePhoto] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  /* email */
  const [emailForm, setEmailForm] = useState({ newEmail: '', password: '' });
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailMsg, setEmailMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  /* password */
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pwStrength, setPwStrength] = useState(0);

  /* set password (OAuth users only) */
  const [setpwForm, setSetpwForm] = useState({ newPassword: '', confirmPassword: '' });
  const [showSetPw, setShowSetPw] = useState({ new: false, confirm: false });
  const [savingSetPw, setSavingSetPw] = useState(false);
  const [oauthPwMsg, setOauthPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isOAuthUser, setIsOAuthUser] = useState(user?.isOAuthUser ?? false);

  /* confirm modal */
  const [confirmModal, setConfirmModal] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

  /* prefs */
  const [prefs, setPrefs] = useState({
    emailNotif: true,
    paymentReminders: true,
    membershipAlerts: true,
    twoFactor: false,
  });
  const [prefsMsg, setPrefsMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [savingPrefs, setSavingPrefs] = useState(false);

  useEffect(() => { if (!profileMsg) return; const t = setTimeout(() => setProfileMsg(null), 3000); return () => clearTimeout(t); }, [profileMsg]);
  useEffect(() => { if (!emailMsg) return; const t = setTimeout(() => setEmailMsg(null), 3000); return () => clearTimeout(t); }, [emailMsg]);
  useEffect(() => { if (!pwMsg) return; const t = setTimeout(() => setPwMsg(null), 3000); return () => clearTimeout(t); }, [pwMsg]);
  useEffect(() => { if (!prefsMsg) return; const t = setTimeout(() => setPrefsMsg(null), 3000); return () => clearTimeout(t); }, [prefsMsg]);

  useEffect(() => {
    profileAPI.getProfile().then(res => {
      const d = res.data.data;
      setForm({ firstname: d.firstname ?? '', lastname: d.lastname ?? '' });
      setPreview(d.profilePicture || null);
      setIsOAuthUser(d.isOAuthUser ?? false);
    }).catch(() => {});
    profileAPI.getPreferences().then(res => {
      const d = res.data.data;
      setPrefs(p => ({
        ...p,
        emailNotif: d.notifEmail ?? true,
        paymentReminders: d.notifPaymentReminders ?? true,
        membershipAlerts: d.notifMembershipAlerts ?? true,
      }));
    }).catch(() => {});
  }, []);

  /* password strength */
  useEffect(() => {
    const pw = pwForm.newPassword;
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    setPwStrength(score);
  }, [pwForm.newPassword]);

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][pwStrength] ?? '';
  const strengthColor = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-blue-500', 'bg-emerald-500'][pwStrength] ?? '';

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setProfileMsg({ type: 'error', text: 'Image must be under 10 MB.' });
      return;
    }
    if (!file.type.startsWith('image/')) {
      setProfileMsg({ type: 'error', text: 'Only image files are allowed.' });
      return;
    }
    setProfileMsg(null);
    setPendingPhotoFile(file);
    // Show local preview immediately
    setPreview(URL.createObjectURL(file));
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstname.trim() || !form.lastname.trim()) {
      setProfileMsg({ type: 'error', text: 'First name and last name are required.' });
      return;
    }
    setConfirmModal({ title: 'Save Profile', message: 'Are you sure you want to update your profile information?', onConfirm: doSaveProfile });
  };

  const doSaveProfile = async () => {
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      let newPhotoUrl: string | undefined;

      // Upload photo file first if one was selected
      if (pendingPhotoFile) {
        const uploadRes = await profileAPI.uploadPhoto(pendingPhotoFile);
        newPhotoUrl = uploadRes.data?.data?.profilePicture;
        setPendingPhotoFile(null);
        if (newPhotoUrl) setPreview(newPhotoUrl);
      }

      const updateBody: { firstname: string; lastname: string; profilePicture?: string } = {
        firstname: form.firstname.trim(),
        lastname: form.lastname.trim(),
      };
      if (pendingRemovePhoto) {
        updateBody.profilePicture = '';
        setPendingRemovePhoto(false);
      } else if (newPhotoUrl) {
        updateBody.profilePicture = newPhotoUrl;
      }

      await profileAPI.updateProfile(updateBody);
      updateUser({
        firstname: form.firstname.trim(),
        lastname: form.lastname.trim(),
        profilePicture: pendingRemovePhoto ? undefined : (newPhotoUrl ?? preview ?? undefined),
      });
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err?.response?.data?.error?.message ?? 'Failed to save changes. Please try again.' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangeEmail = () => {
    if (!emailForm.newEmail.trim() || !emailForm.password.trim()) {
      setEmailMsg({ type: 'error', text: 'All fields are required.' });
      return;
    }
    setConfirmModal({ title: 'Change Email', message: 'Are you sure? You will be logged out after changing your email.', onConfirm: doChangeEmail });
  };

  const doChangeEmail = async () => {
    setSavingEmail(true);
    setEmailMsg(null);
    try {
      await profileAPI.changeEmail({ newEmail: emailForm.newEmail.trim(), password: emailForm.password });
      updateUser({ email: emailForm.newEmail.trim() });
      setEmailMsg({ type: 'success', text: 'Email updated! Please log in again with your new email.' });
      setEmailForm({ newEmail: '', password: '' });
      setShowEmailForm(false);
      setTimeout(() => logout(), 3000);
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message ?? 'Failed to update email.';
      setEmailMsg({ type: 'error', text: msg });
    } finally {
      setSavingEmail(false);
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword) {
      setPwMsg({ type: 'error', text: 'All password fields are required.' });
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwMsg({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }
    setConfirmModal({ title: 'Change Password', message: 'Are you sure you want to change your password?', onConfirm: doChangePassword });
  };

  const doChangePassword = async () => {
    setSavingPw(true);
    setPwMsg(null);
    try {
      await profileAPI.changePassword(pwForm);
      setPwMsg({ type: 'success', text: 'Password changed successfully!' });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message ?? 'Failed to change password.';
      setPwMsg({ type: 'error', text: msg });
    } finally {
      setSavingPw(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setpwForm.newPassword || !setpwForm.confirmPassword) {
      setOauthPwMsg({ type: 'error', text: 'All fields are required.' });
      return;
    }
    if (setpwForm.newPassword.length < 6) {
      setOauthPwMsg({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }
    if (setpwForm.newPassword !== setpwForm.confirmPassword) {
      setOauthPwMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    setSavingSetPw(true);
    setOauthPwMsg(null);
    try {
      await profileAPI.setPassword(setpwForm);
      setOauthPwMsg({ type: 'success', text: 'Password set! You can now log in with email and password.' });
      setSetpwForm({ newPassword: '', confirmPassword: '' });
      setIsOAuthUser(false);
      updateUser({ isOAuthUser: false });
    } catch (err: any) {
      setOauthPwMsg({ type: 'error', text: err?.response?.data?.error?.message ?? 'Failed to set password.' });
    } finally {
      setSavingSetPw(false);
    }
  };

  const handleSavePrefs = async () => {
    setSavingPrefs(true);
    try {
      await profileAPI.savePreferences({
        notifEmail: prefs.emailNotif,
        notifPaymentReminders: prefs.paymentReminders,
        notifMembershipAlerts: prefs.membershipAlerts,
      });
      setPrefsMsg({ type: 'success', text: 'Preferences saved! You will receive emails at ' + (user?.email ?? 'your address') + '.' });
    } catch {
      setPrefsMsg({ type: 'error', text: 'Failed to save preferences.' });
    } finally {
      setSavingPrefs(false);
    }
  };

  const initials = `${form.firstname?.[0] ?? ''}${form.lastname?.[0] ?? ''}`.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?';

  const EyeIcon = ({ visible }: { visible: boolean }) => (
    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {visible ? (
        <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></>
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/>
      )}
    </svg>
  );

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-200'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Account Settings</h1>
          <p className="text-gray-400 text-sm mt-1">Manage your profile, security, and preferences.</p>
        </div>

        {/* ── Profile Picture & Name ── */}
        <form onSubmit={handleSaveProfile}>
          <Section title="Profile Picture">
            <div className="flex items-center gap-6">
              <div className="relative">
                {preview ? (
                  <img src={preview} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-3xl font-black shadow-md border-4 border-white">
                    {initials}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center shadow-md transition-colors"
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </div>
              <div>
                <p className="text-gray-700 font-semibold text-sm">{form.firstname || user?.firstname} {form.lastname || user?.lastname}</p>
                <p className="text-gray-400 text-xs mt-0.5">{user?.email}</p>
                <div className="flex gap-2 mt-3">
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-1.5 border border-gray-300 text-gray-600 hover:border-blue-500 hover:text-blue-600 rounded-lg text-xs font-semibold transition-all">
                    Change Photo
                  </button>
                  {preview && (
                    <button type="button" onClick={() => { setPreview(null); setPendingRemovePhoto(true); setPendingPhotoFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="px-4 py-1.5 border border-gray-300 text-red-500 hover:border-red-400 rounded-lg text-xs font-semibold transition-all">
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-gray-400 text-xs mt-2">JPG, PNG or GIF · Max 10 MB</p>
              </div>
            </div>
          </Section>

          <Section title="Personal Information">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Field label="First Name">
                <input type="text" value={form.firstname} onChange={e => setForm({ ...form, firstname: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Last Name">
                <input type="text" value={form.lastname} onChange={e => setForm({ ...form, lastname: e.target.value })} className={inputCls} />
              </Field>
            </div>

            {/* Email */}
            <Field label="Email Address">
              <div className="flex items-center gap-3">
                <input type="email" value={user?.email ?? ''} disabled className="flex-1 px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 text-sm cursor-not-allowed" />
                {!isOAuthUser && (
                  <button type="button" onClick={() => { setShowEmailForm(v => !v); setEmailMsg(null); }} className="px-4 py-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-600 rounded-xl text-xs font-bold transition-all whitespace-nowrap">
                    {showEmailForm ? 'Cancel' : 'Change Email'}
                  </button>
                )}
                {isOAuthUser && (
                  <span className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-500 font-medium whitespace-nowrap">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    Managed by Google
                  </span>
                )}
              </div>
            </Field>

            {showEmailForm && !isOAuthUser && (
              <div className="mt-1 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                <p className="text-xs text-blue-700 font-semibold mb-3">You will be logged out after changing your email.</p>
                {emailMsg && <Alert type={emailMsg.type} msg={emailMsg.text} />}
                <div className="space-y-3">
                  <Field label="New Email Address">
                    <input type="email" value={emailForm.newEmail} onChange={e => setEmailForm({ ...emailForm, newEmail: e.target.value })} placeholder="newaddress@example.com" className={inputCls} />
                  </Field>
                  <Field label="Confirm with Password">
                    <input type="password" value={emailForm.password} onChange={e => setEmailForm({ ...emailForm, password: e.target.value })} placeholder="Your current password" className={inputCls} />
                  </Field>
                  <button type="button" onClick={handleChangeEmail} disabled={savingEmail} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl text-sm transition-all">
                    {savingEmail ? 'Saving…' : 'Update Email'}
                  </button>
                </div>
              </div>
            )}
          </Section>

          {profileMsg && <Alert type={profileMsg.type} msg={profileMsg.text} />}
          <button type="submit" disabled={savingProfile} className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl transition-all text-sm shadow-sm mb-5">
            {savingProfile ? 'Saving…' : 'Save Profile'}
          </button>
        </form>

        {/* ── Password Section ── */}
        {isOAuthUser ? (
          <Section title="Set a Password">
            <div className="flex items-center gap-3 mb-4 p-3 bg-blue-50 border border-blue-100 rounded-xl">
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              <p className="text-xs text-blue-700 font-medium">You signed in with Google. Set a password to also log in with your email and password.</p>
            </div>
            {oauthPwMsg && <Alert type={oauthPwMsg.type} msg={oauthPwMsg.text} />}
            <form onSubmit={handleSetPassword} className="space-y-1">
              <Field label="New Password">
                <div className="relative">
                  <input type={showSetPw.new ? 'text' : 'password'} value={setpwForm.newPassword} onChange={e => setSetpwForm(p => ({ ...p, newPassword: e.target.value }))} placeholder="At least 6 characters" className={inputCls + ' pr-10'} />
                  <button type="button" onClick={() => setShowSetPw(p => ({ ...p, new: !p.new }))} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <EyeIcon visible={showSetPw.new} />
                  </button>
                </div>
              </Field>
              <Field label="Confirm Password">
                <div className="relative">
                  <input type={showSetPw.confirm ? 'text' : 'password'} value={setpwForm.confirmPassword} onChange={e => setSetpwForm(p => ({ ...p, confirmPassword: e.target.value }))} placeholder="Re-enter password" className={inputCls + ' pr-10'} />
                  <button type="button" onClick={() => setShowSetPw(p => ({ ...p, confirm: !p.confirm }))} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <EyeIcon visible={showSetPw.confirm} />
                  </button>
                </div>
                {setpwForm.confirmPassword && setpwForm.newPassword !== setpwForm.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                )}
              </Field>
              <button type="submit" disabled={savingSetPw} className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl transition-all text-sm mt-2">
                {savingSetPw ? 'Setting…' : 'Set Password'}
              </button>
            </form>
          </Section>
        ) : (
          <Section title="Change Password">
            <form onSubmit={handleChangePassword} className="space-y-1">
              {pwMsg && <Alert type={pwMsg.type} msg={pwMsg.text} />}

              <Field label="Current Password">
                <div className="relative">
                  <input type={showPw.current ? 'text' : 'password'} value={pwForm.currentPassword} onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })} placeholder="Enter current password" className={inputCls + ' pr-10'} />
                  <button type="button" onClick={() => setShowPw(p => ({ ...p, current: !p.current }))} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <EyeIcon visible={showPw.current} />
                  </button>
                </div>
              </Field>

              <Field label="New Password">
                <div className="relative">
                  <input type={showPw.new ? 'text' : 'password'} value={pwForm.newPassword} onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })} placeholder="At least 6 characters" className={inputCls + ' pr-10'} />
                  <button type="button" onClick={() => setShowPw(p => ({ ...p, new: !p.new }))} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <EyeIcon visible={showPw.new} />
                  </button>
                </div>
                {pwForm.newPassword && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= pwStrength ? strengthColor : 'bg-gray-200'}`} />
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">Strength: <span className="font-semibold">{strengthLabel}</span></p>
                  </div>
                )}
              </Field>

              <Field label="Confirm New Password">
                <div className="relative">
                  <input type={showPw.confirm ? 'text' : 'password'} value={pwForm.confirmPassword} onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })} placeholder="Re-enter new password" className={inputCls + ' pr-10'} />
                  <button type="button" onClick={() => setShowPw(p => ({ ...p, confirm: !p.confirm }))} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <EyeIcon visible={showPw.confirm} />
                  </button>
                </div>
                {pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                )}
              </Field>

              <button type="submit" disabled={savingPw} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl transition-all text-sm mt-2">
                {savingPw ? 'Updating…' : 'Update Password'}
              </button>
            </form>
          </Section>
        )}

        {/* ── Notification Preferences ── */}
        <Section title="Notification Preferences">
          {prefsMsg && <Alert type={prefsMsg.type} msg={prefsMsg.text} />}
          <div className="space-y-4">
            {([
              { key: 'emailNotif', label: 'Email Notifications', desc: 'Receive updates and announcements via email' },
              { key: 'paymentReminders', label: 'Payment Reminders', desc: 'Get reminders before your membership renews' },
              { key: 'membershipAlerts', label: 'Membership Alerts', desc: 'Notifications when your membership expires or changes' },
            ] as const).map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                </div>
                <Toggle checked={prefs[key]} onChange={() => setPrefs(p => ({ ...p, [key]: !p[key] }))} />
              </div>
            ))}
          </div>
          <button type="button" onClick={handleSavePrefs} disabled={savingPrefs} className="mt-5 w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl text-sm transition-all">
            {savingPrefs ? 'Saving…' : 'Save Preferences'}
          </button>
        </Section>

        {/* ── Security ── */}
        <Section title="Security">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-800">Two-Factor Authentication</p>
                <p className="text-xs text-gray-400 mt-0.5">Add an extra layer of security to your account</p>
              </div>
              <Toggle checked={prefs.twoFactor} onChange={() => setPrefs(p => ({ ...p, twoFactor: !p.twoFactor }))} />
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div>
                <p className="text-sm font-semibold text-gray-800">Active Sessions</p>
                <p className="text-xs text-gray-400 mt-0.5">You are logged in on 1 device</p>
              </div>
              <button type="button" onClick={() => setConfirmModal({ title: 'Sign Out All', message: 'Are you sure you want to sign out of all devices?', onConfirm: () => logout() })} className="px-4 py-2 border border-red-200 text-red-500 hover:bg-red-50 rounded-xl text-xs font-bold transition-all">
                Sign Out All
              </button>
            </div>
          </div>
        </Section>

        {/* ── Account Info ── */}
        <Section title="Account Information">
          <div className="space-y-3">
            {[
              { label: 'Account ID', value: `#${user?.userId ?? '—'}` },
              { label: 'Role', value: user?.role ?? '—' },
              { label: 'Email', value: user?.email ?? '—' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500">{label}</span>
                <span className="text-sm font-semibold text-gray-800">{value}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Danger Zone ── */}
        <div className="bg-white border border-red-100 rounded-2xl p-6 shadow-sm mb-5">
          <h2 className="text-xs font-bold text-red-400 uppercase tracking-widest mb-4">Danger Zone</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-800">Sign Out</p>
              <p className="text-xs text-gray-400 mt-0.5">Log out of your account on this device</p>
            </div>
            <button type="button" onClick={() => setConfirmModal({ title: 'Sign Out', message: 'Are you sure you want to log out of FitLife Gym?', onConfirm: () => logout() })} className="px-5 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl text-sm font-bold transition-all">
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Confirm modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-7">
            <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h2 className="text-xl font-black text-gray-900 text-center mb-1">{confirmModal.title}</h2>
            <p className="text-gray-400 text-sm text-center mb-6">{confirmModal.message}</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmModal(null)} className="flex-1 py-3 border border-gray-300 hover:border-gray-400 text-gray-600 font-semibold rounded-xl text-sm transition-all">
                Cancel
              </button>
              <button onClick={() => { confirmModal.onConfirm(); setConfirmModal(null); }} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-sm">
                Yes, Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
