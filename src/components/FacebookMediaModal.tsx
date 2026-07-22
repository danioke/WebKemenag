import React, { useState } from 'react';
import { X, ThumbsUp, MessageCircle, Share, MoreHorizontal, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FacebookMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  title: string;
  date?: string;
  authorName?: string;
  authorAvatar?: string;
  initialLikes?: number;
  initialComments?: any[];
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export default function FacebookMediaModal({
  isOpen,
  onClose,
  mediaUrl,
  mediaType,
  title,
  date = "Baru saja",
  authorName = "Kemenag OKI",
  authorAvatar = "https://ui-avatars.com/api/?name=Kemenag+OKI&background=0D8ABC&color=fff",
  initialLikes = 42,
  initialComments = [],
  onNext,
  onPrev,
  hasNext,
  hasPrev
}: FacebookMediaModalProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(false);
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState('');

  if (!isOpen) return null;

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes(isLiked ? likes - 1 : likes + 1);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setComments([...comments, {
      id: Date.now().toString(),
      author: "Pengunjung",
      avatar: "https://ui-avatars.com/api/?name=P&background=eee&color=666",
      text: newComment,
      time: "Baru saja"
    }]);
    setNewComment('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex bg-black/90 md:bg-black/80 backdrop-blur-sm font-sans">
      {/* Close button - Top Left */}
      <button 
        onClick={onClose}
        className="absolute top-4 left-4 z-50 text-white p-2 hover:bg-white/10 rounded-full transition-colors"
      >
        <X size={24} />
      </button>

      <div className="flex flex-col md:flex-row w-full h-full">
        {/* Left Side - Media Viewer */}
        <div className="flex-grow flex items-center justify-center relative h-[60vh] md:h-full bg-black">
          {hasPrev && onPrev && (
            <button onClick={onPrev} className="absolute left-4 z-20 text-white p-3 bg-black/40 hover:bg-black/60 rounded-full hidden md:block">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
          )}
          
          <div className="w-full h-full flex items-center justify-center p-4">
            {mediaType === 'image' ? (
              <img src={mediaUrl} alt={title} className="max-w-full max-h-full object-contain" />
            ) : (
              <video src={mediaUrl} controls autoPlay className="max-w-full max-h-full object-contain" />
            )}
          </div>

          {hasNext && onNext && (
            <button onClick={onNext} className="absolute right-4 z-20 text-white p-3 bg-black/40 hover:bg-black/60 rounded-full hidden md:block">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          )}
        </div>

        {/* Right Side - Facebook Style Sidebar */}
        <div className="w-full md:w-[360px] lg:w-[400px] h-[40vh] md:h-full bg-white flex flex-col flex-shrink-0 rounded-t-2xl md:rounded-none overflow-hidden shadow-xl">
          {/* Header */}
          <div className="p-4 flex items-center justify-between border-b border-gray-200">
            <div className="flex items-center gap-3">
              <img src={authorAvatar} alt={authorName} className="w-10 h-10 rounded-full" />
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">{authorName}</h4>
                <p className="text-xs text-gray-500">{date} • 🌍</p>
              </div>
            </div>
            <button className="text-gray-500 hover:bg-gray-100 p-2 rounded-full">
              <MoreHorizontal size={20} />
            </button>
          </div>

          {/* Caption */}
          <div className="p-4 text-sm text-gray-800 border-b border-gray-100">
            {title}
          </div>

          {/* Stats */}
          <div className="px-4 py-2 flex items-center justify-between text-gray-500 text-xs border-b border-gray-100">
            <div className="flex items-center gap-1">
              <div className="bg-blue-500 text-white p-1 rounded-full"><ThumbsUp size={10} className="fill-current" /></div>
              <span>{likes}</span>
            </div>
            <div>
              <span>{comments.length} Komentar</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-2 py-1 flex items-center justify-between border-b border-gray-200">
            <button onClick={handleLike} className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md hover:bg-gray-100 ${isLiked ? 'text-blue-600' : 'text-gray-600'}`}>
              <ThumbsUp size={20} className={isLiked ? "fill-current" : ""} /> Suka
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-100">
              <MessageCircle size={20} /> Komentari
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-100">
              <Share size={20} /> Bagikan
            </button>
          </div>

          {/* Comments List */}
          <div className="flex-grow overflow-y-auto p-4 bg-gray-50">
            {comments.length === 0 ? (
              <div className="text-center text-gray-500 text-sm mt-4">Belum ada komentar.</div>
            ) : (
              <div className="space-y-4">
                {comments.map((comment, i) => (
                  <div key={i} className="flex gap-2">
                    <img src={comment.avatar} alt={comment.author} className="w-8 h-8 rounded-full" />
                    <div>
                      <div className="bg-gray-200 px-3 py-2 rounded-2xl">
                        <span className="font-semibold text-xs block">{comment.author}</span>
                        <span className="text-sm text-gray-800">{comment.text}</span>
                      </div>
                      <div className="flex gap-3 text-[11px] text-gray-500 font-medium mt-1 ml-2">
                        <button className="hover:underline">Suka</button>
                        <button className="hover:underline">Balas</button>
                        <span>{comment.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Comment Input */}
          <div className="p-3 border-t border-gray-200 bg-white">
            <form onSubmit={handleAddComment} className="flex items-center gap-2">
              <img src="https://ui-avatars.com/api/?name=P&background=eee&color=666" alt="You" className="w-8 h-8 rounded-full" />
              <div className="flex-grow flex items-center bg-gray-100 rounded-full px-3 py-1.5">
                <input
                  type="text"
                  placeholder="Tulis komentar publik..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="bg-transparent border-none focus:outline-none text-sm w-full"
                />
                <button type="submit" disabled={!newComment.trim()} className="text-blue-500 disabled:text-gray-400 p-1">
                  <Send size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
