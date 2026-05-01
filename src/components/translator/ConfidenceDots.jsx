import React from 'react';

const ConfidenceDots = ({ confidence }) => {
  const filled = Math.round(confidence * 5);
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full transition-all duration-300 ${
            i < filled
              ? filled >= 4 ? 'bg-green-300' : filled >= 3 ? 'bg-yellow-300' : 'bg-orange-300'
              : 'bg-white/30'
          }`}
        />
      ))}
    </div>
  );
};

export default ConfidenceDots;
