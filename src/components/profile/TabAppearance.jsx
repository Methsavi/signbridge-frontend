import React, { useState, useRef } from 'react';
import { Camera, Check, X, Trash2, Info } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { authService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { account } from '../../lib/appwtite';
import ImageCropModal from './ImageCropModal';

const TabAppearance = ({ user, setUser }) => {
  const { addToast } = useToast();
  const [avatarPreview, setAvatarPreview] = useState(null);
  const avatarInputRef = useRef(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarLoading, setAvatarLoading] = useState(false);

  // Raw image src fed into the crop modal
  const [cropSrc, setCropSrc] = useState(null);
  // Keep the original File so Re-crop reopens the full image, not the cropped blob
  const [originalFile, setOriginalFile] = useState(null);

  const handleAvatarSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { addToast('Max 5 MB allowed.', 'error'); return; }
    setOriginalFile(file);
    setCropSrc(URL.createObjectURL(file));
    if (avatarInputRef.current) avatarInputRef.current.value = '';
  };

  const handleCropDone = (blob, previewUrl) => {
    setAvatarFile(blob);
    setAvatarPreview(previewUrl);
    setCropSrc(null);
  };

  const handleCropCancel = () => {
    setCropSrc(null);
    // Only clear everything if user hasn't already confirmed a crop
    if (!avatarPreview) setOriginalFile(null);
  };

  const handleReCrop = () => {
    if (originalFile) setCropSrc(URL.createObjectURL(originalFile));
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    try {
      setAvatarLoading(true);
      addToast('Uploading…', 'info');
      const res = await authService.uploadAvatar(user.user_id, avatarFile);
      const updated = { ...user, profile_picture: res.url };
      localStorage.setItem('user', JSON.stringify(updated));
      setUser(updated);
      setAvatarPreview(null);
      setAvatarFile(null);
      window.dispatchEvent(new Event('user-update'));
      addToast('Profile picture updated!', 'success');
    } catch { addToast('Upload failed.', 'error'); }
    finally { setAvatarLoading(false); }
  };

  const handleAvatarRemove = async () => {
    if (!window.confirm('Remove your profile picture?')) return;
    try {
      setAvatarLoading(true);
      const current = await account.get();
      await account.updatePrefs({ ...(current.prefs || {}), profile_picture: '' });
      const updated = { ...user, profile_picture: '' };
      localStorage.setItem('user', JSON.stringify(updated));
      setUser(updated);
      setAvatarPreview(null);
      setAvatarFile(null);
      window.dispatchEvent(new Event('user-update'));
      addToast('Profile picture removed.', 'success');
    } catch { addToast('Failed to remove picture.', 'error'); }
    finally { setAvatarLoading(false); }
  };

  const cancelAvatarPreview = () => {
    setAvatarPreview(null);
    setAvatarFile(null);
    setOriginalFile(null);
  };

  return (
    <div className="space-y-6">
      {/* Crop modal */}
      <AnimatePresence>
        {cropSrc && (
          <ImageCropModal
            imageSrc={cropSrc}
            onCrop={handleCropDone}
            onCancel={handleCropCancel}
          />
        )}
      </AnimatePresence>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Appearance</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage your profile picture.</p>
      </div>

      <div className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative shrink-0">
            {avatarPreview ? (
              <img src={avatarPreview} alt="preview" className="w-28 h-28 rounded-full object-cover ring-4 ring-primary/40 shadow-xl" />
            ) : user.profile_picture ? (
              <img src={user.profile_picture} alt="current" className="w-28 h-28 rounded-full object-cover ring-4 ring-white dark:ring-gray-700 shadow-xl" />
            ) : (
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-4xl font-bold text-white ring-4 ring-white dark:ring-gray-700 shadow-xl">
                {user.username?.charAt(0).toUpperCase()}
              </div>
            )}
            {avatarPreview && (
              <span className="absolute -top-2 -right-2 bg-primary text-white text-xs px-2 py-0.5 rounded-full font-semibold shadow">Preview</span>
            )}
          </div>

          <div className="flex-1 space-y-3 w-full">
            <div>
              <p className="font-semibold text-gray-800 dark:text-white mb-0.5">
                {avatarPreview ? 'Cropped — looks good? Save when ready.' : user.profile_picture ? 'Current profile picture' : 'No profile picture set'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Accepted: JPG, PNG, GIF, WebP · Max: 5 MB</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => avatarInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition font-semibold shadow text-sm">
                <Camera className="w-4 h-4" /> {user.profile_picture ? 'Change Photo' : 'Upload Photo'}
              </button>
              {avatarPreview && (
                <>
                  <button onClick={handleAvatarUpload} disabled={avatarLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-500 transition font-semibold shadow text-sm disabled:opacity-60">
                    {avatarLoading
                      ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <Check className="w-4 h-4" />}
                    Save Photo
                  </button>
                  <button onClick={handleReCrop}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition font-semibold text-sm">
                    Re-crop
                  </button>
                  <button onClick={cancelAvatarPreview}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition font-semibold text-sm">
                    <X className="w-4 h-4" /> Cancel
                  </button>
                </>
              )}
              {user.profile_picture && !avatarPreview && (
                <button onClick={handleAvatarRemove} disabled={avatarLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-500/10 text-red-500 rounded-xl hover:bg-red-200 dark:hover:bg-red-500/20 transition font-semibold text-sm">
                  <Trash2 className="w-4 h-4" /> Remove
                </button>
              )}
            </div>
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />
          </div>
        </div>

        <div className="p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl">
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-2 mb-2"><Info className="w-4 h-4" /> Image Guidelines</p>
          <ul className="text-xs text-blue-600 dark:text-blue-300 space-y-1 list-disc list-inside">
            <li>Crop your photo into a perfect circle before saving</li>
            <li>Supported formats: JPEG, PNG, GIF, WebP</li>
            <li>Maximum file size: 5 MB</li>
            <li>Your image is stored securely and only visible to you</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TabAppearance;
