import React, { useState } from 'react';
import { Star, CheckCircle2 } from 'lucide-react';

interface FeedbackFormProps {
  onSubmit: (rating: number, feedback: string) => void;
}

export function FeedbackForm({ onSubmit }: FeedbackFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <p className="text-[11px] font-bold text-[#1e293b] uppercase tracking-wider">How was your support experience?</p>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button 
              key={star}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
              className="p-1 hover:scale-110 transition-transform"
            >
              <Star 
                className={`w-6 h-6 transition-colors ${
                  star <= (hoverRating || rating) ? 'text-amber-500 fill-amber-500' : 'text-[#e2e8f0]'
                }`} 
              />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest">Resolution Comments</label>
        <textarea 
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="What did we do well? What could we improve?"
          rows={3}
          className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-3 text-xs outline-none focus:ring-1 focus:ring-[#3b82f6] text-[#1e293b] placeholder-[#94a3b8] resize-none"
        />
      </div>

      <button 
        disabled={!rating}
        onClick={() => onSubmit(rating, feedback)}
        className="w-full py-2.5 bg-[#1e293b] text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-[#0f172a] transition-all shadow-sm disabled:opacity-30 flex items-center justify-center gap-2"
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Submit Evaluation
      </button>
    </div>
  );
}
