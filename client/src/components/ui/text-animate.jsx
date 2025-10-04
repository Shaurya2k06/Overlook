import React from 'react';

export const TextAnimate = ({ children, animation = "slideUp", by = "word" }) => {
  const text = typeof children === 'string' ? children : '';
  
  if (by === 'word') {
    const words = text.split(' ');
    
    return (
      <span className="inline-block">
        {words.map((word, idx) => (
          <span
            key={idx}
            className="inline-block"
            style={{
              animation: animation === 'slideUp' 
                ? `slideUp 0.6s ease-out ${idx * 0.1}s both` 
                : `fadeIn 0.6s ease-out ${idx * 0.1}s both`,
            }}
          >
            {word}
            {idx < words.length - 1 && '\u00A0'}
          </span>
        ))}
        <style>{`
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
        `}</style>
      </span>
    );
  }
  
  return <span>{children}</span>;
};
