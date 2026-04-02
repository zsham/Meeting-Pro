/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  Users, 
  Plus, 
  X, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Clock, 
  FileText, 
  UserCircle, 
  ChevronRight,
  LogOut,
  Shield,
  User as UserIcon
} from 'lucide-react';
import { format, isAfter, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { Meeting, User, UserRole, MOCK_USERS } from './types';

const STORAGE_KEY = 'meeting_pro_data';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User>(MOCK_USERS[0]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Load data from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setMeetings(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load meetings', e);
      }
    }
  }, []);

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(meetings));
  }, [meetings]);

  const filteredMeetings = useMemo<Meeting[]>(() => {
    let result = meetings;
    if (currentUser.role === 'user') {
      result = meetings.filter(m => m.invitedUserIds.includes(currentUser.id));
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(m => 
        m.title.toLowerCase().includes(query) || 
        m.description.toLowerCase().includes(query)
      );
    }
    
    return result.sort((a, b) => parseISO(b.startTime).getTime() - parseISO(a.startTime).getTime());
  }, [meetings, currentUser, searchQuery]);

  const handleSaveMeeting = (meetingData: Partial<Meeting>) => {
    if (editingMeeting) {
      setMeetings(prev => prev.map(m => m.id === editingMeeting.id ? { ...m, ...meetingData } as Meeting : m));
    } else {
      const newMeeting: Meeting = {
        id: Math.random().toString(36).substr(2, 9),
        title: meetingData.title || 'Untitled Meeting',
        description: meetingData.description || '',
        startTime: meetingData.startTime || new Date().toISOString(),
        endTime: meetingData.endTime || new Date().toISOString(),
        invitedUserIds: meetingData.invitedUserIds || [],
        notes: '',
        status: 'scheduled',
        createdAt: new Date().toISOString(),
      };
      setMeetings(prev => [newMeeting, ...prev]);
    }
    setIsModalOpen(false);
    setEditingMeeting(null);
  };

  const handleCancelMeeting = (id: string) => {
    setMeetings(prev => prev.map(m => m.id === id ? { ...m, status: 'cancelled' } as Meeting : m));
  };

  const handleDeleteMeeting = (id: string) => {
    if (confirm('Are you sure you want to delete this meeting?')) {
      setMeetings(prev => prev.filter(m => m.id !== id));
    }
  };

  const handleUpdateNotes = (id: string, notes: string) => {
    setMeetings(prev => prev.map(m => m.id === id ? { ...m, notes } as Meeting : m));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <Calendar className="text-white w-6 h-6" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">Meeting Pro</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center bg-slate-100 rounded-full p-1">
                {MOCK_USERS.map(user => (
                  <button
                    key={user.id}
                    onClick={() => setCurrentUser(user)}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium transition-all",
                      currentUser.id === user.id 
                        ? "bg-white text-indigo-600 shadow-sm" 
                        : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    {user.name.split(' ')[0]}
                  </button>
                ))}
              </div>
              
              <div className="flex items-center gap-2 pl-4 border-l border-slate-200">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold">{currentUser.name}</p>
                  <p className="text-xs text-slate-500 capitalize">{currentUser.role}</p>
                </div>
                <div className="bg-slate-200 p-2 rounded-full">
                  {currentUser.role === 'admin' ? <Shield className="w-5 h-5 text-indigo-600" /> : <UserIcon className="w-5 h-5 text-slate-600" />}
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {currentUser.role === 'admin' ? 'Meeting Management' : 'My Meetings'}
            </h1>
            <p className="text-slate-500 mt-1">
              {currentUser.role === 'admin' 
                ? 'Schedule, manage and track all organization meetings.' 
                : 'View and manage meetings you have been invited to.'}
            </p>
          </div>
          
          {currentUser.role === 'admin' && (
            <button
              onClick={() => {
                setEditingMeeting(null);
                setIsModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-200 active:scale-95"
            >
              <Plus className="w-5 h-5" />
              New Meeting
            </button>
          )}
        </div>

        {/* Search & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="lg:col-span-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search meetings by title or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-2xl px-12 py-4 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all shadow-sm"
              />
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-slate-500 text-sm font-medium">Total Meetings</p>
              <p className="text-2xl font-bold text-indigo-600">{filteredMeetings.length}</p>
            </div>
            <div className="bg-indigo-50 p-3 rounded-xl">
              <Clock className="text-indigo-600 w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Meetings List */}
        <div className="space-y-4">
          {filteredMeetings.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-3xl py-20 text-center">
              <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="text-slate-300 w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">No meetings found</h3>
              <p className="text-slate-500 max-w-xs mx-auto mt-2">
                {searchQuery ? "Try adjusting your search filters." : "There are no meetings scheduled at the moment."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredMeetings.map((meeting) => (
                <MeetingCard 
                  key={meeting.id} 
                  meeting={meeting} 
                  role={currentUser.role}
                  onEdit={() => {
                    setEditingMeeting(meeting);
                    setIsModalOpen(true);
                  }}
                  onCancel={() => handleCancelMeeting(meeting.id)}
                  onDelete={() => handleDeleteMeeting(meeting.id)}
                  onUpdateNotes={(notes) => handleUpdateNotes(meeting.id, notes)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <MeetingModal 
            meeting={editingMeeting}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSaveMeeting}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

interface MeetingCardProps {
  meeting: Meeting;
  role: UserRole;
  onEdit: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onUpdateNotes: (notes: string) => void;
}

const MeetingCard: React.FC<MeetingCardProps> = ({ 
  meeting, 
  role, 
  onEdit, 
  onCancel, 
  onDelete,
  onUpdateNotes 
}) => {
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [notes, setNotes] = useState(meeting.notes);
  const isCancelled = meeting.status === 'cancelled';
  const isPast = isAfter(new Date(), parseISO(meeting.endTime));

  const invitedUsers = MOCK_USERS.filter(u => meeting.invitedUserIds.includes(u.id));

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all",
        isCancelled && "opacity-75 grayscale-[0.5]"
      )}
    >
      <div className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3">
              <span className={cn(
                "px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider",
                isCancelled ? "bg-red-100 text-red-600" : 
                isPast ? "bg-slate-100 text-slate-600" : "bg-green-100 text-green-600"
              )}>
                {isCancelled ? 'Cancelled' : isPast ? 'Completed' : 'Upcoming'}
              </span>
              <span className="text-slate-400 text-sm">•</span>
              <div className="flex items-center gap-1.5 text-slate-500 text-sm font-medium">
                <Clock className="w-4 h-4" />
                {format(parseISO(meeting.startTime), 'MMM d, yyyy • h:mm a')}
              </div>
            </div>

            <div>
              <h3 className={cn("text-xl font-bold text-slate-900", isCancelled && "line-through")}>
                {meeting.title}
              </h3>
              <p className="text-slate-600 mt-1 line-clamp-2">{meeting.description}</p>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <div className="flex -space-x-2">
                {invitedUsers.map((user) => (
                  <div 
                    key={user.id}
                    title={user.name}
                    className="w-8 h-8 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-indigo-600"
                  >
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </div>
                ))}
                {invitedUsers.length === 0 && <span className="text-xs text-slate-400 italic">No invitees</span>}
              </div>
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                <Users className="w-4 h-4" />
                {invitedUsers.length} Invited
              </div>
            </div>
          </div>

          <div className="flex flex-wrap lg:flex-col gap-2 lg:min-w-[140px]">
            {role === 'admin' && !isCancelled && (
              <>
                <button 
                  onClick={onEdit}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-all"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit
                </button>
                <button 
                  onClick={onCancel}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-xl text-sm font-semibold transition-all"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </>
            )}
            {role === 'admin' && (
              <button 
                onClick={onDelete}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-semibold transition-all"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
            <button 
              onClick={() => setIsNotesOpen(!isNotesOpen)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all",
                isNotesOpen ? "bg-indigo-600 text-white" : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
              )}
            >
              <FileText className="w-4 h-4" />
              Notes
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isNotesOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-6 pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    Meeting Notes
                  </h4>
                  {role === 'admin' && (
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Admin Only Editing</span>
                  )}
                </div>
                
                {role === 'admin' ? (
                  <div className="space-y-3">
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add meeting minutes, action items, or key takeaways..."
                      className="w-full min-h-[120px] bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={() => onUpdateNotes(notes)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all active:scale-95"
                      >
                        Save Notes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600 min-h-[60px] whitespace-pre-wrap">
                    {meeting.notes || "No notes have been added to this meeting yet."}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

interface MeetingModalProps {
  meeting: Meeting | null;
  onClose: () => void;
  onSave: (data: Partial<Meeting>) => void;
}

const MeetingModal: React.FC<MeetingModalProps> = ({ 
  meeting, 
  onClose, 
  onSave 
}) => {
  const [formData, setFormData] = useState({
    title: meeting?.title || '',
    description: meeting?.description || '',
    startTime: meeting?.startTime ? format(parseISO(meeting.startTime), "yyyy-MM-dd'T'HH:mm") : format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    endTime: meeting?.endTime ? format(parseISO(meeting.endTime), "yyyy-MM-dd'T'HH:mm") : format(new Date(Date.now() + 3600000), "yyyy-MM-dd'T'HH:mm"),
    invitedUserIds: meeting?.invitedUserIds || []
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      startTime: new Date(formData.startTime).toISOString(),
      endTime: new Date(formData.endTime).toISOString(),
    });
  };

  const toggleUser = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      invitedUserIds: prev.invitedUserIds.includes(userId)
        ? prev.invitedUserIds.filter(id => id !== userId)
        : [...prev.invitedUserIds, userId]
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">
            {meeting ? 'Edit Meeting' : 'Schedule New Meeting'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-all">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Meeting Title</label>
              <input
                required
                type="text"
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. Weekly Sync, Project Kickoff"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Description</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="What is this meeting about?"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Start Time</label>
                <input
                  required
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={e => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">End Time</label>
                <input
                  required
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={e => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3">Invite Participants</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {MOCK_USERS.filter(u => u.role !== 'admin').map(user => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => toggleUser(user.id)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                      formData.invitedUserIds.includes(user.id)
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                    )}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                      formData.invitedUserIds.includes(user.id)
                        ? "bg-indigo-600 border-indigo-600"
                        : "bg-white border-slate-300"
                    )}>
                      {formData.invitedUserIds.includes(user.id) && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold leading-none">{user.name}</p>
                      <p className="text-[10px] opacity-70 mt-1">{user.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-[2] px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-100"
            >
              {meeting ? 'Update Meeting' : 'Create Meeting'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
