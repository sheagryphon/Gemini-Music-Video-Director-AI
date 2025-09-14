
import React from 'react';

interface LoaderProps {
  loadingText?: string;
}

const Loader: React.FC<LoaderProps> = ({ loadingText = "Loading..." }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="relative w-24 h-24">
        <div className="absolute border-4 border-t-4 border-cyan-500 border-solid rounded-full w-full h-full animate-spin" style={{borderTopColor: 'transparent'}}></div>
        <div className="absolute border-4 border-t-4 border-purple-500 border-solid rounded-full w-full h-full animate-spin" style={{animationDelay: '0.2s', borderTopColor: 'transparent'}}></div>
      </div>
      <p className="mt-4 text-cyan-400 text-lg animate-pulse">{loadingText}</p>
    </div>
  );
};

export default Loader;