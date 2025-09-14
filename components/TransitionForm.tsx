import React, { useCallback, useState } from 'react';
import type { TransitionFormState } from '../types';
import { VIDEO_STYLES } from '../constants';
import { UploadIcon } from './icons/UploadIcon';
import { DownloadIcon } from './icons/DownloadIcon';

interface TransitionFormProps {
  formState: TransitionFormState;
  setFormState: React.Dispatch<React.SetStateAction<TransitionFormState>>;
}

const FileInput: React.FC<{
  id: string;
  label: string;
  file: File | null;
  accept: string;
  onChange: (file: File) => void;
}> = ({ id, label, file, accept, onChange }) => {
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onChange(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="block text-sm font-medium text-cyan-400 mb-2">
        {label}
      </label>
      <label
        htmlFor={id}
        className="flex flex-col flex-grow items-center justify-center w-full bg-gray-900 border-2 border-dashed border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:border-cyan-500 hover:bg-gray-800 transition-colors text-gray-400"
      >
        <UploadIcon />
        <span className="mt-2 text-sm break-all">{file ? file.name : 'Click to upload'}</span>
      </label>
      <input type="file" id={id} accept={accept} className="hidden" onChange={onFileChange} />
    </div>
  );
};

const SelectInput: React.FC<{
    id: string;
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    children: React.ReactNode;
}> = ({ id, label, value, onChange, children }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-cyan-400 mb-2">
            {label}
        </label>
        <select
            id={id}
            name={id}
            value={value}
            onChange={onChange}
            className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-colors appearance-none"
            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
        >
            {children}
        </select>
    </div>
);

const extractFrame = (videoFile: File, seekTime: 'start' | 'end'): Promise<string> => {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        const videoUrl = URL.createObjectURL(videoFile);
        video.src = videoUrl;
        video.muted = true;
        video.playsInline = true;
        let hasSeeked = false;

        const timeoutId = setTimeout(() => {
            if (!hasSeeked) {
                cleanup();
                reject(new Error('Video processing timed out. Please try a different file.'));
            }
        }, 10000);

        const cleanup = () => {
            clearTimeout(timeoutId);
            video.removeEventListener('seeked', onSeeked);
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            URL.revokeObjectURL(videoUrl);
            video.remove();
        };

        const onSeeked = () => {
            if (hasSeeked) return;
            hasSeeked = true;

            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                cleanup();
                return reject(new Error('Could not get 2D canvas context.'));
            }
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/png');
            cleanup();
            resolve(dataUrl);
        };

        const onLoadedMetadata = () => {
            video.currentTime = seekTime === 'start' ? 0.01 : video.duration > 0.01 ? video.duration - 0.01 : 0;
        };

        const onError = () => {
            cleanup();
            reject(new Error('Error loading video. It may be corrupted or in an unsupported format.'));
        };

        video.addEventListener('seeked', onSeeked);
        video.addEventListener('loadedmetadata', onLoadedMetadata);
        video.addEventListener('error', onError);
        
        video.play().catch(() => {});
    });
};


const TransitionForm: React.FC<TransitionFormProps> = ({ formState, setFormState }) => {
  const [scene1LastFrame, setScene1LastFrame] = useState<string | null>(null);
  const [scene2FirstFrame, setScene2FirstFrame] = useState<string | null>(null);
  const [isExtracting1, setIsExtracting1] = useState(false);
  const [isExtracting2, setIsExtracting2] = useState(false);
  const [error1, setError1] = useState<string | null>(null);
  const [error2, setError2] = useState<string | null>(null);
  
  const handleFileChange = useCallback(
    (field: keyof TransitionFormState) => async (file: File) => {
      setFormState((prev) => ({ ...prev, [field]: file }));

      if (field === 'scene1VideoFile') {
          setScene1LastFrame(null);
          setError1(null);
          setIsExtracting1(true);
          try {
              const frame = await extractFrame(file, 'end');
              setScene1LastFrame(frame);
          } catch (error) {
              console.error("Failed to extract last frame:", error);
              setError1(error instanceof Error ? error.message : 'Failed to extract frame.');
          } finally {
              setIsExtracting1(false);
          }
      }

      if (field === 'scene2VideoFile') {
          setScene2FirstFrame(null);
          setError2(null);
          setIsExtracting2(true);
          try {
              const frame = await extractFrame(file, 'start');
              setScene2FirstFrame(frame);
          } catch (error) {
              console.error("Failed to extract first frame:", error);
              setError2(error instanceof Error ? error.message : 'Failed to extract frame.');
          } finally {
              setIsExtracting2(false);
          }
      }
    },
    [setFormState]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormState((prev) => ({ ...prev, [name]: value }));
    },
    [setFormState]
  );

  const shotNumberOptions = Array.from({ length: 100 }, (_, i) => i + 1);
  
  return (
    <div className="space-y-6">
        <div>
             <FileInput id="shotListFile" label="MV Shot List (.md)" file={formState.shotListFile} accept=".md,.txt" onChange={handleFileChange('shotListFile')} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <FileInput id="scene1VideoFile" label="Upload Video for Scene 1 (From)" file={formState.scene1VideoFile} accept="video/*" onChange={handleFileChange('scene1VideoFile')} />
                {isExtracting1 && <p className="text-xs text-cyan-400 mt-2 animate-pulse">Extracting last frame...</p>}
                {error1 && <p className="text-xs text-red-400 mt-2">{error1}</p>}
                {scene1LastFrame && (
                    <a
                        href={scene1LastFrame}
                        download="scene1_last_frame.png"
                        className="mt-2 inline-flex items-center gap-2 text-sm bg-gray-700/80 hover:bg-gray-700 border border-gray-600 px-3 py-1 rounded-md transition-colors text-white backdrop-blur-sm"
                        aria-label="Download last frame of scene 1"
                    >
                        <DownloadIcon />
                        <span>Last Frame (.png)</span>
                    </a>
                )}
            </div>
            <div>
                <FileInput id="scene2VideoFile" label="Upload Video for Scene 2 (To)" file={formState.scene2VideoFile} accept="video/*" onChange={handleFileChange('scene2VideoFile')} />
                {isExtracting2 && <p className="text-xs text-cyan-400 mt-2 animate-pulse">Extracting first frame...</p>}
                {error2 && <p className="text-xs text-red-400 mt-2">{error2}</p>}
                {scene2FirstFrame && (
                    <a
                        href={scene2FirstFrame}
                        download="scene2_first_frame.png"
                        className="mt-2 inline-flex items-center gap-2 text-sm bg-gray-700/80 hover:bg-gray-700 border border-gray-600 px-3 py-1 rounded-md transition-colors text-white backdrop-blur-sm"
                        aria-label="Download first frame of scene 2"
                    >
                        <DownloadIcon />
                        <span>First Frame (.png)</span>
                    </a>
                )}
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectInput id="fromShot" label="Transition From Shot #" value={formState.fromShot} onChange={handleInputChange}>
                 <option value="" disabled>Select shot</option>
                {shotNumberOptions.map(num => <option key={`from-${num}`} value={num}>{num}</option>)}
            </SelectInput>
            <SelectInput id="toShot" label="Transition To Shot #" value={formState.toShot} onChange={handleInputChange}>
                 <option value="" disabled>Select shot</option>
                {shotNumberOptions.map(num => <option key={`to-${num}`} value={num}>{num}</option>)}
            </SelectInput>
        </div>
        
        <div>
            <label htmlFor="directorialStyle" className="block text-sm font-medium text-cyan-400 mb-2">
            Directorial Style
            </label>
            <input
            type="text"
            id="directorialStyle"
            name="directorialStyle"
            value={formState.directorialStyle}
            onChange={handleInputChange}
            placeholder="e.g., Christopher Nolan, Greta Gerwig"
            className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-colors"
            />
        </div>

        <div>
            <label htmlFor="videoStyle" className="block text-sm font-medium text-cyan-400 mb-2">
            Music Video Style Type
            </label>
            <select
            id="videoStyle"
            name="videoStyle"
            value={formState.videoStyle}
            onChange={handleInputChange}
            className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-colors appearance-none"
            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
            >
            <option value="" disabled>Select a style</option>
            {VIDEO_STYLES.map((style) => (
                <option key={style} value={style}>{style}</option>
            ))}
            </select>
        </div>
    </div>
  );
};

export default TransitionForm;