import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronDown, MessageSquare, Info, Star, Send, X, CheckCircle2, Edit2, Trash2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { feedbackService } from '../../services/api';
import { FormField } from './ProfileUtils';

const FAQ_ITEMS = [
  {
    q: 'How does SignBridge translate sign language?',
    a: 'SignBridge uses a trained AI/ML model that processes real-time camera input and recognizes hand gestures corresponding to words, alphabets, and numbers in Sri Lankan Sign Language, then converts them to text or audio.',
  },
  {
    q: 'Which sign languages are supported?',
    a: 'Currently SignBridge focuses on Sri Lankan Sign Language (SL-SL). We are actively working on expanding support to ASL (American Sign Language) and other regional dialects.',
  },
  {
    q: 'How do I change my profile picture?',
    a: 'Go to the Appearance tab in your dashboard. You can upload a new image (max 5 MB, JPG/PNG/GIF), preview it before saving, and remove it if needed.',
  },
  {
    q: 'Is my translation history private?',
    a: 'Yes. Your translation history is linked to your account and only visible to you. You can delete individual items or clear all history at any time.',
  },
  {
    q: 'I forgot my password — what should I do?',
    a: 'On the login page, click "Forgot password?" to receive a password reset link via email. If you signed up via Google, no password is required.',
  },
  {
    q: 'Can I use SignBridge on mobile?',
    a: 'Yes! SignBridge is fully responsive and works on modern mobile browsers. Camera-based sign detection works best in landscape mode with good lighting.',
  },
];

const TabHelp = ({ user }) => {
  const { addToast } = useToast();
  
  const [openFaq, setOpenFaq] = useState(null);
  const [fbForm, setFbForm] = useState({ subject: '', message: '', rating: 5 });
  const [fbLoading, setFbLoading] = useState(false);
  const [myFeedbacks, setMyFeedbacks] = useState([]);
  const [editingFb, setEditingFb] = useState(null);

  useEffect(() => {
    if (user?.user_id) {
      feedbackService.getMyFeedbacks(user.user_id)
        .then(data => setMyFeedbacks(data))
        .catch(() => {});
    }
  }, [user]);

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!fbForm.subject.trim() || !fbForm.message.trim()) {
      addToast('Please fill subject and message.', 'error'); return;
    }
    try {
      setFbLoading(true);
      if (editingFb) {
        await feedbackService.update(editingFb._id, { subject: fbForm.subject, message: fbForm.message, rating: fbForm.rating });
        setMyFeedbacks(prev => prev.map(f => f._id === editingFb._id ? { ...f, ...fbForm } : f));
        addToast('Feedback updated!', 'success');
        setEditingFb(null);
      } else {
        const newFb = await feedbackService.submit({ user_id: user.user_id, username: user.username, ...fbForm });
        setMyFeedbacks(prev => [newFb, ...prev]);
        addToast('Feedback sent! Thank you.', 'success');
      }
      setFbForm({ subject: '', message: '', rating: 5 });
    } catch { addToast('Failed to submit feedback.', 'error'); }
    finally { setFbLoading(false); }
  };

  const handleDeleteFeedback = async (id) => {
    if (!window.confirm('Delete this feedback?')) return;
    try {
      await feedbackService.delete(id);
      setMyFeedbacks(prev => prev.filter(f => f._id !== id));
      addToast('Feedback deleted.', 'success');
    } catch { addToast('Failed to delete.', 'error'); }
  };

  const startEditFeedback = (fb) => {
    setEditingFb(fb);
    setFbForm({ subject: fb.subject, message: fb.message, rating: fb.rating || 5 });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Help & Support</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Find answers and send us your feedback.</p>
      </div>

      <div className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-lg mb-4">
          <HelpCircle className="w-5 h-5 text-primary" /> Frequently Asked Questions
        </h3>
        <div className="space-y-2">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-4 text-left text-sm font-semibold text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                {item.q}
                <ChevronDown className={`w-4 h-4 text-gray-500 shrink-0 ml-3 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {openFaq === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <p className="px-4 pb-4 text-sm text-gray-600 dark:text-gray-300 border-t border-gray-100 dark:border-gray-700 pt-3">{item.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-lg mb-4">
          <MessageSquare className="w-5 h-5 text-primary" /> {editingFb ? 'Edit Feedback' : 'Send Feedback'}
        </h3>
        <form onSubmit={handleSubmitFeedback} className="space-y-4">
          <FormField label="Subject" icon={Info}>
            <input type="text" value={fbForm.subject} onChange={e => setFbForm(s => ({ ...s, subject: e.target.value }))}
              className="profile-input" placeholder="Brief subject…" required />
          </FormField>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1.5">Message</label>
            <textarea value={fbForm.message} onChange={e => setFbForm(s => ({ ...s, message: e.target.value }))}
              rows={4} className="profile-input resize-none" placeholder="Tell us how we can improve…" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1.5">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} type="button" onClick={() => setFbForm(s => ({ ...s, rating: n }))} className="transition-transform hover:scale-110">
                  <Star className={`w-6 h-6 ${n <= fbForm.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} />
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={fbLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition font-semibold shadow disabled:opacity-60">
              {fbLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
              {fbLoading ? 'Sending…' : editingFb ? 'Update Feedback' : 'Send Feedback'}
            </button>
            {editingFb && (
              <button type="button" onClick={() => { setEditingFb(null); setFbForm({ subject: '', message: '', rating: 5 }); }}
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition font-semibold">
                <X className="w-4 h-4" /> Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {myFeedbacks.length > 0 && (
        <div className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm space-y-3">
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-lg">
            <CheckCircle2 className="w-5 h-5 text-green-500" /> My Submitted Feedbacks
          </h3>
          {myFeedbacks.map(fb => (
            <div key={fb._id} className="p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 dark:text-white text-sm truncate">{fb.subject}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{fb.message}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map(n => (
                      <Star key={n} className={`w-3 h-3 ${n <= (fb.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} />
                    ))}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => startEditFeedback(fb)} className="p-1.5 text-gray-400 hover:text-primary rounded-lg hover:bg-primary/10 transition">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDeleteFeedback(fb._id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TabHelp;
