import React, { useState } from 'react';
import { Shield, KeyRound, AlertCircle, CheckCircle2, Lock, Info, BookOpen } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { account } from '../../lib/appwtite';
import { PasswordField } from './ProfileUtils';

const getPasswordStrength = (pwd) => {
  if (!pwd) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const map = [
    { score: 0, label: '', color: '' },
    { score: 1, label: 'Very Weak', color: '#ef4444' },
    { score: 2, label: 'Weak', color: '#f97316' },
    { score: 3, label: 'Fair', color: '#eab308' },
    { score: 4, label: 'Strong', color: '#22c55e' },
    { score: 5, label: 'Very Strong', color: '#16a34a' },
  ];
  return map[Math.min(score, 5)];
};

const TabSecurity = ({ user, handleLogout }) => {
  const { addToast } = useToast();
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, newPw: false, confirm: false });
  const [pwLoading, setPwLoading] = useState(false);
  const strength = getPasswordStrength(pwForm.newPw);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!pwForm.current || !pwForm.newPw || !pwForm.confirm) {
      addToast('Please fill all password fields.', 'error'); return;
    }
    if (pwForm.newPw !== pwForm.confirm) {
      addToast('New passwords do not match.', 'error'); return;
    }
    if (pwForm.newPw.length < 8) {
      addToast('Password must be at least 8 characters.', 'error'); return;
    }
    try {
      setPwLoading(true);
      await account.updatePassword(pwForm.newPw, pwForm.current);
      setPwForm({ current: '', newPw: '', confirm: '' });
      addToast('Password changed successfully!', 'success');
    } catch (err) {
      const msg = err?.message || 'Failed to change password.';
      addToast(msg.includes('Invalid credentials') ? 'Current password is incorrect.' : msg, 'error');
    } finally { setPwLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Security</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Keep your account safe with a strong password.</p>
      </div>

      <div className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm space-y-5">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-lg">
          <KeyRound className="w-5 h-5 text-primary" /> Change Password
        </h3>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <PasswordField label="Current Password" value={pwForm.current} show={showPw.current}
            onToggle={() => setShowPw(s => ({ ...s, current: !s.current }))}
            onChange={v => setPwForm(s => ({ ...s, current: v }))} placeholder="Enter current password" />

          <PasswordField label="New Password" value={pwForm.newPw} show={showPw.newPw}
            onToggle={() => setShowPw(s => ({ ...s, newPw: !s.newPw }))}
            onChange={v => setPwForm(s => ({ ...s, newPw: v }))} placeholder="Enter new password" />

          {pwForm.newPw && (
            <div className="space-y-1">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-1.5 flex-1 rounded-full transition-all duration-300"
                    style={{ backgroundColor: i <= strength.score ? strength.color : '#e5e7eb' }} />
                ))}
              </div>
              <p className="text-xs font-medium" style={{ color: strength.color }}>{strength.label}</p>
            </div>
          )}

          <PasswordField label="Confirm New Password" value={pwForm.confirm} show={showPw.confirm}
            onToggle={() => setShowPw(s => ({ ...s, confirm: !s.confirm }))}
            onChange={v => setPwForm(s => ({ ...s, confirm: v }))} placeholder="Confirm new password" />

          {pwForm.confirm && pwForm.newPw !== pwForm.confirm && (
            <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Passwords do not match</p>
          )}
          {pwForm.confirm && pwForm.newPw === pwForm.confirm && pwForm.confirm.length >= 8 && (
            <p className="text-xs text-green-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Passwords match</p>
          )}

          <button type="submit" disabled={pwLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition font-semibold shadow disabled:opacity-60">
            {pwLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Lock className="w-4 h-4" />}
            {pwLoading ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>

      <div className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-lg mb-4">
          <BookOpen className="w-5 h-5 text-primary" /> Password Rules & Best Practices
        </h3>
        <ul className="space-y-2">
          {[
            { rule: 'Minimum 8 characters long', tip: false },
            { rule: 'At least one uppercase letter (A–Z)', tip: false },
            { rule: 'At least one number (0–9)', tip: false },
            { rule: 'At least one special character (e.g. @, #, !)', tip: false },
            { rule: 'Do not reuse your last 3 passwords', tip: true },
            { rule: 'Never share your password with anyone', tip: true },
            { rule: 'Use a password manager for stronger unique passwords', tip: true },
          ].map(({ rule, tip }) => (
            <li key={rule} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
              {tip
                ? <Info className="w-4 h-4 text-blue-500  shrink-0 mt-0.5" />
                : <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
              }
              {rule}
            </li>
          ))}
        </ul>
      </div>

      <div className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-lg mb-4">
          <Shield className="w-5 h-5 text-primary" /> Active Session
        </h3>
        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl">
          <div>
            <p className="text-sm font-semibold text-green-700 dark:text-green-400">Current Session — Active</p>
            <p className="text-xs text-green-600 dark:text-green-300 mt-0.5">Signed in as {user.email}</p>
          </div>
          <button onClick={handleLogout} className="text-xs text-red-500 hover:underline font-semibold">Sign out</button>
        </div>
      </div>
    </div>
  );
};

export default TabSecurity;
