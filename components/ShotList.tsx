import React, { useState } from 'react';
import type { Shot } from '../types';
import { CopyIcon } from './icons/CopyIcon';
import { CheckIcon } from './icons/CheckIcon';

interface ShotListProps {
  shots: Shot[];
}

const ShotList: React.FC<ShotListProps> = ({ shots }) => {
  const [copiedShot, setCopiedShot] = useState<number | null>(null);

  const handleCopy = (text: string, shotNumber: number) => {
    navigator.clipboard.writeText(text);
    setCopiedShot(shotNumber);
    setTimeout(() => setCopiedShot(null), 2000);
  };

  return (
    <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-250px)] pr-2">
      {shots.map((shot) => (
        <div key={shot.shotNumber} className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 transition-all hover:border-cyan-500 hover:shadow-lg hover:shadow-cyan-500/10">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-lg text-cyan-400">
              Shot {shot.shotNumber}
            </h3>
            <span className="bg-gray-700 text-cyan-300 text-xs font-mono px-2 py-1 rounded">
              {shot.timestamp}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <p><strong className="text-gray-400">Location:</strong> {shot.location}</p>
            <p><strong className="text-gray-400">Camera:</strong> {shot.cameraAngle}</p>
            <p><strong className="text-gray-400">Lighting:</strong> {shot.lighting}</p>
            <p className="sm:col-span-2 mt-1"><strong className="text-gray-400">Description:</strong> {shot.shotDescription}</p>
          </div>
          <div className="mt-3">
            {shot.midjourneyPrompt && (
                <>
                    <p className="text-sm font-semibold text-gray-400 mb-1">Midjourney Prompt</p>
                    <div className="relative bg-gray-900 p-3 pr-10 rounded-md font-mono text-sm text-purple-300 border border-gray-700">
                    <code>{shot.midjourneyPrompt}</code>
                    <button
                        onClick={() => handleCopy(shot.midjourneyPrompt!, shot.shotNumber)}
                        className="absolute top-1/2 right-2 -translate-y-1/2 p-1 text-gray-400 hover:text-white rounded-md transition-colors"
                        aria-label="Copy prompt"
                    >
                        {copiedShot === shot.shotNumber ? <CheckIcon /> : <CopyIcon />}
                    </button>
                    </div>
                </>
            )}
            {shot.videoPrompt && (
                <>
                    <p className="text-sm font-semibold text-gray-400 mb-1">Video Prompt</p>
                    <div className="relative bg-gray-900 p-3 pr-10 rounded-md font-mono text-sm text-purple-300 border border-gray-700">
                    <code>{shot.videoPrompt}</code>
                    <button
                        onClick={() => handleCopy(shot.videoPrompt!, shot.shotNumber)}
                        className="absolute top-1/2 right-2 -translate-y-1/2 p-1 text-gray-400 hover:text-white rounded-md transition-colors"
                        aria-label="Copy prompt"
                    >
                        {copiedShot === shot.shotNumber ? <CheckIcon /> : <CopyIcon />}
                    </button>
                    </div>
                </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ShotList;