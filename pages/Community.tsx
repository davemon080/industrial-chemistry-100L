import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, Message } from '../types';
import { MOCK_STUDENTS } from '../data/mockData';

interface CommunityProps {
  currentUser: User;
}

const Community: React.FC<CommunityProps> = ({ currentUser }) => {
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('community_messages');
    return saved ? JSON.parse(saved) : [];
  });
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('community_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current && !isChatLoading) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [selectedStudent, messages, isChatLoading]);

  const handleSelectStudent = (student: User) => {
    if (selectedStudent?.id === student.id) return;
    setIsChatLoading(true);
    setSelectedStudent(student);
    // Simulate loading conversation history
    setTimeout(() => setIsChatLoading(false), 500);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedStudent) return;

    const newMessage: Message = {
      id: `msg_${Date.now()}`,
      senderId: currentUser.id,
      receiverId: selectedStudent.id,
      text: inputText,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');
  };

  const getLastMessage = (studentId: string) => {
    const studentMessages = messages.filter(m => 
      (m.senderId === currentUser.id && m.receiverId === studentId) ||
      (m.senderId === studentId && m.receiverId === currentUser.id)
    );
    return studentMessages.length > 0 ? studentMessages.sort((a, b) => b.timestamp - a.timestamp)[0] : null;
  };

  const sortedStudents = useMemo(() => {
    const studentsWithLastMessage = MOCK_STUDENTS.map(student => ({
      ...student,
      lastMessage: getLastMessage(student.id)
    }));

    return studentsWithLastMessage
      .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => {
        const timeA = a.lastMessage ? a.lastMessage.timestamp : 0;
        const timeB = b.lastMessage ? b.lastMessage.timestamp : 0;
        return timeB - timeA || a.name.localeCompare(b.name);
      });
  }, [messages, searchQuery]);

  const chatMessages = useMemo(() => {
    if (!selectedStudent) return [];
    return messages.filter(m => 
      (m.senderId === currentUser.id && m.receiverId === selectedStudent.id) ||
      (m.senderId === selectedStudent.id && m.receiverId === currentUser.id)
    ).sort((a, b) => a.timestamp - b.timestamp);
  }, [messages, selectedStudent]);

  return (
    <div className="h-full w-full flex bg-white overflow-hidden animate-in fade-in duration-500">
      <aside className={`flex-col border-r border-slate-100 bg-slate-50/10 h-full ${selectedStudent ? 'hidden md:flex md:w-80 lg:w-96' : 'flex w-full md:w-80 lg:w-96'}`}>
        <div className="p-6 border-b border-slate-100 bg-white">
          <h2 className="text-xl font-black text-slate-900 tracking-tight mb-4">Messenger</h2>
          <input 
            type="text" placeholder="Search students..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold focus:outline-none"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {sortedStudents.map((student) => {
            const isSelected = selectedStudent?.id === student.id;
            const lastMsg = student.lastMessage;
            return (
              <button 
                key={student.id} onClick={() => handleSelectStudent(student)}
                className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all ${isSelected ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'hover:bg-slate-100 text-slate-600'}`}
              >
                <img src={student.avatar} className="w-12 h-12 rounded-xl object-cover" />
                <div className="flex-1 min-w-0 text-left">
                  <h3 className={`font-black text-sm truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>{student.name}</h3>
                  <p className="text-[10px] font-bold truncate opacity-80">{lastMsg ? lastMsg.text : 'Start chatting...'}</p>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      <section className={`flex-1 flex-col bg-white h-full ${!selectedStudent ? 'hidden md:flex' : 'flex'}`}>
        {selectedStudent ? (
          <div className="flex flex-col h-full">
            <div className="p-4 md:p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => setSelectedStudent(null)} className="md:hidden p-2 text-slate-400"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M15 19l-7-7 7-7" /></svg></button>
                <img src={selectedStudent.avatar} className="w-10 h-10 rounded-xl" />
                <h2 className="text-base font-black text-slate-900">{selectedStudent.name}</h2>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/20">
              {isChatLoading ? (
                <div className="space-y-6 animate-pulse">
                  <div className="flex justify-start"><div className="w-2/3 h-10 bg-slate-200 rounded-2xl rounded-bl-none" /></div>
                  <div className="flex justify-end"><div className="w-1/2 h-10 bg-indigo-100 rounded-2xl rounded-br-none" /></div>
                  <div className="flex justify-start"><div className="w-3/4 h-12 bg-slate-200 rounded-2xl rounded-bl-none" /></div>
                </div>
              ) : chatMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`px-5 py-3 rounded-2xl text-sm font-bold shadow-sm ${msg.senderId === currentUser.id ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'}`}>{msg.text}</div>
                </div>
              ))}
            </div>

            <div className="p-4 md:p-8 border-t border-slate-50 pb-[110px] md:pb-8">
              <form onSubmit={handleSendMessage} className="flex gap-4">
                <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Message..." className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 font-bold" />
                <button type="submit" disabled={!inputText.trim()} className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg hover:bg-indigo-700 disabled:opacity-30">
                  <svg className="w-6 h-6 rotate-90" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-white h-full">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Select a Peer</h2>
            <p className="text-slate-400 font-bold mt-3 text-sm">Choose a student to start a real-time study chat.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Community;