import React, { useCallback } from 'react';
import type { FormState } from '../types';
import { VIDEO_STYLES } from '../constants';
import { UploadIcon } from './icons/UploadIcon';

interface InputFormProps {
  formState: FormState;
  setFormState: React.Dispatch<React.SetStateAction<FormState>>;
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

const InputForm: React.FC<InputFormProps> = ({ formState, setFormState }) => {
  const handleFileChange = useCallback(
    (field: keyof FormState) => (file: File) => {
      setFormState((prev) => ({ ...prev, [field]: file }));
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
  
  return (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FileInput id="songFile" label="Upload Song" file={formState.songFile} accept="audio/*" onChange={handleFileChange('songFile')} />
            <FileInput id="lyricsFile" label="Upload Lyrics (.txt)" file={formState.lyricsFile} accept=".txt" onChange={handleFileChange('lyricsFile')} />
            <FileInput id="actorImageFile" label="Upload Actor/Singer Image" file={formState.actorImageFile} accept="image/*" onChange={handleFileChange('actorImageFile')} />
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
            placeholder="e.g., Wes Anderson, Quentin Tarantino"
            className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-colors"
            />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div>
                <label htmlFor="songLength" className="block text-sm font-medium text-cyan-400 mb-2">
                Song Length
                </label>
                <input
                type="text"
                id="songLength"
                name="songLength"
                value={formState.songLength}
                onChange={handleInputChange}
                placeholder="e.g., 03:45"
                className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-colors"
                />
            </div>
        </div>
    </div>
  );
};

export default InputForm;