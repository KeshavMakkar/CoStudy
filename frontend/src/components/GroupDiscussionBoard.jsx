import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  Smile, 
  Clock, 
  Users, 
  Sparkles,
  BookOpen
} from 'lucide-react';
import { api } from '../api';

export default function GroupDiscussionBoard({ groupId, activeStudent }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const containerRef = useRef(null);
  const prevMsgCountRef = useRef(0);

  const fetchMessages = async (isInitial = false) => {
    if (!groupId) return;
    try {
      const data = await api.getGroupMessages(groupId);
      const newMsgs = data || [];
      
      // Only scroll internal box if message count grew, and do it strictly inside container
      if (newMsgs.length > prevMsgCountRef.current) {
        setMessages(newMsgs);
        prevMsgCountRef.current = newMsgs.length;
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
      } else {
        setMessages(newMsgs);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  useEffect(() => {
    prevMsgCountRef.current = 0;
    fetchMessages(true);
    const interval = setInterval(() => fetchMessages(false), 4000);
    return () => clearInterval(interval);
  }, [groupId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !groupId) return;

    const payload = {
      student_id: activeStudent?.id || null,
      student_name: activeStudent?.name || 'Anonymous Student',
      avatar: activeStudent?.avatar || '',
      content: inputText.trim(),
    };

    setIsSending(true);
    try {
      const newMsg = await api.postGroupMessage(groupId, payload);
      setMessages((prev) => {
        const updated = [...prev, newMsg];
        prevMsgCountRef.current = updated.length;
        return updated;
      });
      setInputText('');
      // Strictly scroll container internally
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
      }, 50);
    } catch (err) {
      console.error('Failed to post message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const quickPrompts = [
    '📅 When should we schedule our first weekly sync?',
    '📝 Let’s review problem set #2 together!',
    '💡 I have some notes on Recursion if anyone wants them.',
    '📍 Library 3rd floor study room at 3pm?'
  ];

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 dark:border-slate-800 light:border-slate-200 shadow-xl flex flex-col h-[480px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 dark:border-slate-800 light:border-slate-200">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-orange-500/15 text-orange-500 border border-orange-500/30">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white light:text-slate-900">Cohort Discussion Board</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 light:text-slate-500">Collaborative chat & study session coordination</p>
          </div>
        </div>

        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30 font-semibold flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
          Live Polling Active
        </span>
      </div>

      {/* Messages Feed (Internal Container Scroll Only) */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto py-4 space-y-3 pr-1"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 text-xs">
            <MessageSquare className="w-8 h-8 text-slate-400 dark:text-slate-600 mb-2" />
            <p className="font-medium">No messages yet in this cohort.</p>
            <p className="text-slate-400 dark:text-slate-500 mt-1">Start the conversation by proposing a meeting time!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = activeStudent && msg.student_id === activeStudent.id;
            const timeStr = new Date(msg.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={msg.id}
                className={`flex items-start space-x-2.5 ${isMe ? 'flex-row-reverse space-x-reverse' : ''}`}
              >
                <img
                  src={msg.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.student_name}`}
                  alt={msg.student_name}
                  className="w-7 h-7 rounded-full object-cover border border-orange-500/30 bg-slate-800 shrink-0"
                />

                <div className={`max-w-[80%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className="flex items-center space-x-2 mb-0.5">
                    <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 light:text-slate-700">
                      {isMe ? 'You' : msg.student_name}
                    </span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500">{timeStr}</span>
                  </div>

                  <div
                    className={`px-3.5 py-2 rounded-2xl text-xs leading-relaxed ${
                      isMe
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-tr-none shadow-md shadow-orange-500/20'
                        : 'bg-slate-100 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/60 rounded-tl-none'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Prompts */}
      <div className="pt-2 pb-2 overflow-x-auto flex items-center gap-1.5 no-scrollbar border-t border-slate-100 dark:border-slate-800/60">
        {quickPrompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => setInputText(prompt)}
            className="text-[10px] whitespace-nowrap px-2.5 py-1 rounded-md bg-orange-50 dark:bg-slate-800/70 hover:bg-orange-100 dark:hover:bg-slate-700 text-orange-700 dark:text-slate-300 border border-orange-200/60 dark:border-slate-700/50 transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Field */}
      <form onSubmit={handleSendMessage} className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Message your cohort as ${activeStudent?.name || 'Student'}...`}
          className="flex-1 bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        <button
          type="submit"
          disabled={isSending || !inputText.trim()}
          className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-orange-500/25"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
}
