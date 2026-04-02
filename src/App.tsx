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
  User as UserIcon,
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Camera
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
  const [activeCallMeetingId, setActiveCallMeetingId] = useState<string | null>(null);

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
      <nav className="sticky top-0 z-40 w-full glass border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="bg-slate-900 p-2 rounded-lg shadow-sm">
                <Calendar className="text-white w-5 h-5" />
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900">Meeting<span className="text-indigo-600">Pro</span></span>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center bg-slate-100/80 rounded-full p-1 border border-slate-200/50">
                {MOCK_USERS.map(user => (
                  <button
                    key={user.id}
                    onClick={() => setCurrentUser(user)}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all",
                      currentUser.id === user.id 
                        ? "bg-white text-indigo-600 shadow-sm" 
                        : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    {user.name.split(' ')[0]}
                  </button>
                ))}
              </div>
              
              <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-slate-900">{currentUser.name}</p>
                  <p className="text-[10px] text-slate-500 font-mono uppercase tracking-tighter">{currentUser.role}</p>
                </div>
                <div className="bg-indigo-50 p-2 rounded-xl border border-indigo-100">
                  {currentUser.role === 'admin' ? <Shield className="w-4 h-4 text-indigo-600" /> : <UserIcon className="w-4 h-4 text-indigo-600" />}
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-indigo-600 rounded-full" />
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-[0.2em]">Workspace</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              {currentUser.role === 'admin' ? 'Control Center' : 'My Schedule'}
            </h1>
            <p className="text-slate-500 mt-2 max-w-md text-sm leading-relaxed">
              {currentUser.role === 'admin' 
                ? 'Orchestrate organization meetings, manage participants, and archive critical session notes.' 
                : 'Access your upcoming sessions and review shared meeting intelligence.'}
            </p>
          </div>
          
          {currentUser.role === 'admin' && (
            <button
              onClick={() => {
                setEditingMeeting(null);
                setIsModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-slate-200 active:scale-95 text-sm"
            >
              <Plus className="w-4 h-4" />
              Schedule Session
            </button>
          )}
        </div>

        {/* Search & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-12">
          <div className="lg:col-span-3">
            <div className="relative group">
              <input
                type="text"
                placeholder="Filter by title, description, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-2xl px-14 py-5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm text-sm placeholder:text-slate-400"
              />
              <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors w-5 h-5" />
            </div>
          </div>
          <div className="dashboard-card p-5 flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Active Sessions</p>
              <p className="text-3xl font-black text-slate-900">{filteredMeetings.length}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <Clock className="text-slate-400 w-5 h-5" />
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
                  onJoinCall={() => setActiveCallMeetingId(meeting.id)}
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

      {/* Video Call Overlay */}
      <AnimatePresence>
        {activeCallMeetingId && (
          <VideoCallOverlay 
            meeting={meetings.find(m => m.id === activeCallMeetingId) || null}
            onClose={() => setActiveCallMeetingId(null)}
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
  onJoinCall: () => void;
}

const MeetingCard: React.FC<MeetingCardProps> = ({ 
  meeting, 
  role, 
  onEdit, 
  onCancel, 
  onDelete,
  onUpdateNotes,
  onJoinCall
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
        "dashboard-card overflow-hidden group",
        isCancelled && "opacity-75 grayscale-[0.5] bg-slate-50/50"
      )}
    >
      <div className="p-8">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8">
          <div className="flex-1 space-y-6">
            <div className="flex items-center gap-4">
              <span className={cn(
                "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-[0.15em] border",
                isCancelled ? "bg-red-50 text-red-600 border-red-100" : 
                isPast ? "bg-slate-50 text-slate-500 border-slate-200" : "bg-indigo-50 text-indigo-600 border-indigo-100"
              )}>
                {isCancelled ? 'Cancelled' : isPast ? 'Archived' : 'Active'}
              </span>
              <div className="flex items-center gap-2 text-slate-400 text-[11px] font-mono uppercase tracking-tight">
                <Clock className="w-3.5 h-3.5" />
                {format(parseISO(meeting.startTime), 'MMM d, yyyy • HH:mm')}
              </div>
            </div>

            <div>
              <h3 className={cn("text-2xl font-black text-slate-900 tracking-tight leading-none mb-3", isCancelled && "line-through opacity-50")}>
                {meeting.title}
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed max-w-2xl">{meeting.description}</p>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-2">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2.5">
                  {invitedUsers.map((user) => (
                    <div 
                      key={user.id}
                      title={user.name}
                      className="w-9 h-9 rounded-xl bg-white border-2 border-slate-50 flex items-center justify-center text-[11px] font-black text-slate-700 shadow-sm"
                    >
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </div>
                  ))}
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {invitedUsers.length} Participants
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap lg:flex-col gap-3 lg:min-w-[160px]">
              {!isCancelled && !isPast && (
                <button 
                  onClick={onJoinCall}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-200 active:scale-95"
                >
                  <Video className="w-4 h-4" />
                  Join
                </button>
              )}
            {role === 'admin' && !isCancelled && (
              <>
                <button 
                  onClick={onEdit}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-2xl text-xs font-bold transition-all active:scale-95"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button 
                  onClick={onCancel}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-amber-50 text-amber-600 border border-amber-100 rounded-2xl text-xs font-bold transition-all active:scale-95"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </button>
              </>
            )}
            {role === 'admin' && (
              <button 
                onClick={onDelete}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-red-50 text-red-600 border border-red-100 rounded-2xl text-xs font-bold transition-all active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            )}
            <button 
              onClick={() => setIsNotesOpen(!isNotesOpen)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold transition-all active:scale-95",
                isNotesOpen ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              <FileText className="w-3.5 h-3.5" />
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

interface VideoCallOverlayProps {
  meeting: Meeting | null;
  onClose: () => void;
}

const VideoCallOverlay: React.FC<VideoCallOverlayProps> = ({ meeting, onClose }) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function startMedia() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Error accessing media devices:", err);
        setError("Could not access camera or microphone. Please check permissions.");
      }
    }

    startMedia();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const toggleMic = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
      }
    }
  };

  if (!meeting) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-slate-950 flex flex-col font-sans"
    >
      {/* Header */}
      <div className="p-6 flex items-center justify-between bg-slate-900/40 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-500/20 p-2.5 rounded-xl border border-indigo-500/30">
            <Video className="text-indigo-400 w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="text-white font-black tracking-tight">{meeting.title}</h2>
              <span className="px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/20 text-red-500 text-[9px] font-black uppercase tracking-widest">Live</span>
            </div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Encrypted Session • {MOCK_USERS.length} Participants</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-white/10"
        >
          <X className="w-6 h-6 text-slate-400" />
        </button>
      </div>

      {/* Video Grid */}
      <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden">
        {/* Self View */}
        <div className="relative bg-slate-900 rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl group">
          {isVideoOn ? (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover mirror"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900">
              <div className="w-24 h-24 rounded-3xl bg-slate-800 border border-white/5 flex items-center justify-center mb-4 shadow-inner">
                <UserIcon className="w-10 h-10 text-slate-600" />
              </div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Camera Disabled</p>
            </div>
          )}
          <div className="absolute bottom-6 left-6 glass px-4 py-2 rounded-xl border border-white/10 flex items-center gap-3">
            <div className="relative">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping opacity-75" />
            </div>
            <span className="text-white text-[11px] font-black uppercase tracking-wider">You (Admin)</span>
          </div>
          
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/90 p-8 text-center backdrop-blur-sm">
              <div className="max-w-xs">
                <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Camera className="w-8 h-8 text-red-500" />
                </div>
                <p className="text-white font-black text-lg mb-2 tracking-tight">Access Restricted</p>
                <p className="text-slate-400 text-sm leading-relaxed">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Mock Participant View */}
        <div className="relative bg-slate-900 rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl hidden md:block">
          <img 
            src="https://picsum.photos/seed/professional/1200/800" 
            alt="Participant" 
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center backdrop-blur-sm">
              <Users className="w-10 h-10 text-indigo-400/50" />
            </div>
          </div>
          <div className="absolute bottom-6 left-6 glass px-4 py-2 rounded-xl border border-white/10 flex items-center gap-3">
            <span className="text-white text-[11px] font-black uppercase tracking-wider">John Doe</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-10 bg-slate-950 border-t border-white/5 flex items-center justify-center gap-8">
        <button 
          onClick={toggleMic}
          className={cn(
            "p-5 rounded-2xl transition-all shadow-2xl active:scale-90 border",
            isMicOn ? "bg-slate-900 text-white border-white/10 hover:bg-slate-800" : "bg-red-500 text-white border-red-400/20 hover:bg-red-600"
          )}
        >
          {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
        </button>
        
        <button 
          onClick={toggleVideo}
          className={cn(
            "p-5 rounded-2xl transition-all shadow-2xl active:scale-90 border",
            isVideoOn ? "bg-slate-900 text-white border-white/10 hover:bg-slate-800" : "bg-red-500 text-white border-red-400/20 hover:bg-red-600"
          )}
        >
          {isVideoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
        </button>

        <div className="w-px h-10 bg-white/10 mx-2" />

        <button 
          onClick={onClose}
          className="px-10 py-5 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all shadow-2xl shadow-red-500/20 active:scale-95"
        >
          End Session
        </button>
      </div>
    </motion.div>
  );
};

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100"
      >
        <div className="p-10 border-b border-slate-50 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {meeting ? 'Refine Session' : 'New Session'}
            </h2>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Configure meeting parameters</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-50 rounded-2xl transition-all border border-transparent hover:border-slate-100">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Session Title</label>
              <input
                required
                type="text"
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Strategic Planning Q3..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Agenda & Context</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Define key objectives and expected outcomes..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all min-h-[120px] font-medium text-sm leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Commencement</label>
                <input
                  required
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={e => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Conclusion</label>
                <input
                  required
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={e => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-sm"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Invite Intelligence</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {MOCK_USERS.filter(u => u.role !== 'admin').map(user => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => toggleUser(user.id)}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group",
                      formData.invitedUserIds.includes(user.id)
                        ? "bg-indigo-50/50 border-indigo-200"
                        : "bg-white border-slate-100 hover:border-slate-200"
                    )}
                  >
                    <div className={cn(
                      "w-6 h-6 rounded-lg border flex items-center justify-center transition-all",
                      formData.invitedUserIds.includes(user.id)
                        ? "bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-200"
                        : "bg-slate-50 border-slate-200 group-hover:border-slate-300"
                    )}>
                      {formData.invitedUserIds.includes(user.id) && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </div>
                    <div>
                      <p className={cn("text-xs font-black tracking-tight", formData.invitedUserIds.includes(user.id) ? "text-indigo-900" : "text-slate-700")}>{user.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">{user.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-8 py-4 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95"
            >
              Discard
            </button>
            <button
              type="submit"
              className="flex-[2] px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-slate-200 active:scale-95"
            >
              {meeting ? 'Confirm Changes' : 'Initialize Session'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
