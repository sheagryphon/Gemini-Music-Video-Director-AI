
import React, { useState, useCallback } from 'react';
import type { FormState, Shot, TransitionFormState } from './types';
import { generateShotList, generateTransitionShotList } from './services/geminiService';
import Header from './components/Header';
import InputForm from './components/InputForm';
import TransitionForm from './components/TransitionForm';
import ShotList from './components/ShotList';
import Loader from './components/Loader';
import { WandIcon } from './components/icons/WandIcon';
import { DownloadIcon } from './components/icons/DownloadIcon';

const App: React.FC = () => {
  // Main form state
  const [formState, setFormState] = useState<FormState>({
    songFile: null,
    lyricsFile: null,
    actorImageFile: null,
    directorialStyle: '',
    videoStyle: '',
    artStyle: '',
    songLength: '',
    promptFormat: 'midjourney',
    temperature: 0.9,
    shotLength: 6,
    format: 'horizontal',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shotList, setShotList] = useState<Shot[] | null>(null);

  // New transition form state
  const [transitionFormState, setTransitionFormState] = useState<TransitionFormState>({
    shotListFile: null,
    scene1VideoFile: null,
    scene2VideoFile: null,
    fromShot: '',
    toShot: '',
    directorialStyle: '',
    videoStyle: '',
    artStyle: '',
    temperature: 0.9,
    transitionLength: 2,
    format: 'horizontal',
  });
  const [isTransitionLoading, setIsTransitionLoading] = useState(false);
  const [transitionError, setTransitionError] = useState<string | null>(null);
  const [transitionShotList, setTransitionShotList] = useState<Shot[] | null>(null);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'main' | 'transition'>('main');

  const handleFormSubmit = useCallback(async () => {
    if (!formState.songFile || !formState.lyricsFile || !formState.actorImageFile || !formState.directorialStyle || !formState.videoStyle || !formState.artStyle || !formState.songLength || !formState.shotLength) {
      setError('Please fill out all fields and upload all required files.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setShotList(null);

    try {
      const generatedList = await generateShotList(formState);
      setShotList(generatedList);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? `An error occurred: ${e.message}` : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [formState]);

  const handleTransitionSubmit = useCallback(async () => {
    if (!transitionFormState.shotListFile || !transitionFormState.scene1VideoFile || !transitionFormState.scene2VideoFile || !transitionFormState.fromShot || !transitionFormState.toShot || !transitionFormState.directorialStyle || !transitionFormState.videoStyle || !transitionFormState.artStyle || !transitionFormState.transitionLength) {
      setTransitionError('Please fill out all fields and upload all required files.');
      return;
    }

    setIsTransitionLoading(true);
    setTransitionError(null);
    setTransitionShotList(null);

    try {
      const generatedList = await generateTransitionShotList(transitionFormState);
      setTransitionShotList(generatedList);
    } catch (e) {
      console.error(e);
      setTransitionError(e instanceof Error ? `An error occurred: ${e.message}` : 'An unknown error occurred.');
    } finally {
      setIsTransitionLoading(false);
    }
  }, [transitionFormState]);

  const downloadFile = (content: string, fileName: string, contentType: string) => {
    const a = document.createElement("a");
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  };

  const handleSaveShotList = () => {
    if (!shotList) return;

    const settingsHeader = `# MV Director AI - Generation Settings

- **Song File**: ${formState.songFile?.name || 'N/A'}
- **Lyrics File**: ${formState.lyricsFile?.name || 'N/A'}
- **Actor/Singer Image**: ${formState.actorImageFile?.name || 'N/A'}
- **Directorial Style**: ${formState.directorialStyle}
- **Music Video Style**: ${formState.videoStyle}
- **Artistic Style**: ${formState.artStyle}
- **Song Length**: ${formState.songLength}
- **Video Format**: ${formState.format === 'vertical' ? 'Vertical 9:16' : 'Horizontal 16:9'}
- **Image Prompt Format**: ${formState.promptFormat}
- **Creative Temperature**: ${formState.temperature.toFixed(1)}
- **Shot Length**: ${formState.shotLength} seconds

---

`;

    const content = shotList.map(shot => `## Shot ${shot.shotNumber} (${shot.timestamp})

- **Location:** ${shot.location}
- **Camera:** ${shot.cameraAngle}
- **Lighting:** ${shot.lighting}
- **Description:** ${shot.shotDescription}

### Image Prompt
\`\`\`
${shot.imagePrompt}
\`\`\`
    `).join('\n---\n');
    
    const baseFileName = formState.songFile?.name.replace(/\.[^/.]+$/, "") || 'mv';
    downloadFile(settingsHeader + content, `${baseFileName}-shot-list.md`, 'text/markdown');
  };

  const handleSavePrompts = () => {
    if (!shotList) return;
    
    const settingsHeader = `MV Director AI - Generation Settings
=====================================
Song File: ${formState.songFile?.name || 'N/A'}
Lyrics File: ${formState.lyricsFile?.name || 'N/A'}
Actor/Singer Image: ${formState.actorImageFile?.name || 'N/A'}
Directorial Style: ${formState.directorialStyle}
Music Video Style: ${formState.videoStyle}
Artistic Style: ${formState.artStyle}
Song Length: ${formState.songLength}
Video Format: ${formState.format === 'vertical' ? 'Vertical 9:16' : 'Horizontal 16:9'}
Image Prompt Format: ${formState.promptFormat}
Creative Temperature: ${formState.temperature.toFixed(1)}
Shot Length: ${formState.shotLength} seconds
=====================================

`;
    const content = shotList.map(shot => shot.imagePrompt).join('\n\n');
    const baseFileName = formState.songFile?.name.replace(/\.[^/.]+$/, "") || 'mv';
    downloadFile(settingsHeader + content, `${baseFileName}-image-prompts.txt`, 'text/plain');
  };

  const handleSaveTransitionShotList = () => {
    if (!transitionShotList) return;

    const settingsHeader = `# MV Director AI - Transition Generation Settings

- **Shot List File**: ${transitionFormState.shotListFile?.name || 'N/A'}
- **Scene 1 Video (From)**: ${transitionFormState.scene1VideoFile?.name || 'N/A'}
- **Scene 2 Video (To)**: ${transitionFormState.scene2VideoFile?.name || 'N/A'}
- **Transition From Shot**: #${transitionFormState.fromShot}
- **Transition To Shot**: #${transitionFormState.toShot}
- **Directorial Style**: ${transitionFormState.directorialStyle}
- **Music Video Style**: ${transitionFormState.videoStyle}
- **Artistic Style**: ${transitionFormState.artStyle}
- **Video Format**: ${transitionFormState.format === 'vertical' ? 'Vertical 9:16' : 'Horizontal 16:9'}
- **Creative Temperature**: ${transitionFormState.temperature.toFixed(1)}
- **Transition Length**: ${transitionFormState.transitionLength} seconds

---

`;

    const content = transitionShotList.map(shot => `## Transition Shot ${shot.shotNumber} (${shot.timestamp})

- **Location:** ${shot.location}
- **Camera:** ${shot.cameraAngle}
- **Lighting:** ${shot.lighting}
- **Description:** ${shot.shotDescription}

### AI Video Prompt
\`\`\`
${shot.videoPrompt}
\`\`\`
    `).join('\n---\n');

    const baseFileName = `scene ${transitionFormState.fromShot} - ${transitionFormState.toShot} transition`;
    downloadFile(settingsHeader + content, `${baseFileName}-shots.md`, 'text/markdown');
  };

  const handleSaveTransitionPrompts = () => {
    if (!transitionShotList) return;
    
    const settingsHeader = `MV Director AI - Transition Generation Settings
================================================
Shot List File: ${transitionFormState.shotListFile?.name || 'N/A'}
Scene 1 Video (From): ${transitionFormState.scene1VideoFile?.name || 'N/A'}
Scene 2 Video (To): ${transitionFormState.scene2VideoFile?.name || 'N/A'}
Transition From Shot: #${transitionFormState.fromShot}
Transition To Shot: #${transitionFormState.toShot}
Directorial Style: ${transitionFormState.directorialStyle}
Music Video Style: ${transitionFormState.videoStyle}
Artistic Style: ${transitionFormState.artStyle}
Video Format: ${transitionFormState.format === 'vertical' ? 'Vertical 9:16' : 'Horizontal 16:9'}
Creative Temperature: ${transitionFormState.temperature.toFixed(1)}
Transition Length: ${transitionFormState.transitionLength} seconds
================================================

`;
    const content = transitionShotList.map(shot => shot.videoPrompt).join('\n\n');
    const baseFileName = `scene ${transitionFormState.fromShot} - ${transitionFormState.toShot} transition`;
    downloadFile(settingsHeader + content, `${baseFileName}-prompts.txt`, 'text/plain');
  };

  const tabClass = (tabName: 'main' | 'transition') => 
    `px-4 py-3 text-sm font-medium rounded-t-lg transition-colors focus:outline-none ${
      activeTab === tabName 
      ? 'bg-black/20 border-b-2 border-cyan-400 text-cyan-400' 
      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
    }`;


  return (
    <div className="min-h-screen text-gray-200 font-sans p-4 sm:p-6 lg:p-8 flex items-center justify-center">
      <div className="w-full max-w-7xl mx-auto bg-black/40 backdrop-blur-lg p-6 sm:p-8 rounded-2xl border border-white/10 shadow-2xl shadow-black/50">
        <Header />

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-700 mt-6">
          <button onClick={() => setActiveTab('main')} className={tabClass('main')}>
            Full Music Video
          </button>
          <button onClick={() => setActiveTab('transition')} className={tabClass('transition')}>
            Scene Transition Generator
          </button>
        </div>

        <main className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel: Forms */}
          <div>
            {activeTab === 'main' && (
              <>
                <InputForm formState={formState} setFormState={setFormState} />
                <button
                    onClick={handleFormSubmit}
                    disabled={isLoading}
                    className="mt-8 w-full flex items-center justify-center gap-3 bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-800 disabled:text-gray-400 disabled:cursor-not-allowed text-black font-bold py-4 px-6 rounded-lg shadow-lg shadow-cyan-500/20 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-cyan-300"
                >
                    <WandIcon />
                    {isLoading ? 'Generating Vision...' : 'Generate Shot List'}
                </button>
              </>
            )}
             {activeTab === 'transition' && (
               <>
                <TransitionForm formState={transitionFormState} setFormState={setTransitionFormState} />
                <button 
                  onClick={handleTransitionSubmit} 
                  disabled={isTransitionLoading} 
                  className="mt-8 w-full flex items-center justify-center gap-3 bg-purple-500 hover:bg-purple-400 disabled:bg-purple-800 disabled:text-gray-400 disabled:cursor-not-allowed text-black font-bold py-4 px-6 rounded-lg shadow-lg shadow-purple-500/20 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-300">
                  <WandIcon />
                  {isTransitionLoading ? 'Bridging Scenes...' : 'Generate Transition'}
                </button>
              </>
            )}
          </div>
          {/* Right Panel: Output */}
          <div className="bg-black/20 p-6 rounded-lg border border-gray-700 min-h-[500px] flex flex-col">
             {activeTab === 'main' && (
               <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-cyan-400">Generated Shot List</h2>
                  {shotList && (
                    <div className="flex items-center gap-2">
                      <button onClick={handleSaveShotList} className="flex items-center gap-2 text-sm bg-gray-700/50 hover:bg-gray-700 border border-gray-600 px-3 py-2 rounded-md transition-colors">
                        <DownloadIcon />
                        <span>Shots (.md)</span>
                      </button>
                      <button onClick={handleSavePrompts} className="flex items-center gap-2 text-sm bg-gray-700/50 hover:bg-gray-700 border border-gray-600 px-3 py-2 rounded-md transition-colors">
                        <DownloadIcon />
                        <span>Prompts (.txt)</span>
                      </button>
                    </div>
                  )}
                </div>
                {isLoading && <Loader loadingText="Analyzing Frequencies..." />}
                {error && <div className="text-red-400 bg-red-900/50 p-4 rounded-lg border border-red-700">{error}</div>}
                {shotList && <ShotList shots={shotList} />}
                {!isLoading && !error && !shotList && (
                  <div className="flex-grow flex items-center justify-center text-gray-500">
                    Your music video storyboard will appear here...
                  </div>
                )}
              </>
            )}
            {activeTab === 'transition' && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-purple-400">Generated Transition Sequence</h2>
                   {transitionShotList && (
                    <div className="flex items-center gap-2">
                      <button onClick={handleSaveTransitionShotList} className="flex items-center gap-2 text-sm bg-gray-700/50 hover:bg-gray-700 border border-gray-600 px-3 py-2 rounded-md transition-colors">
                        <DownloadIcon />
                        <span>Shots (.md)</span>
                      </button>
                      <button onClick={handleSaveTransitionPrompts} className="flex items-center gap-2 text-sm bg-gray-700/50 hover:bg-gray-700 border border-gray-600 px-3 py-2 rounded-md transition-colors">
                        <DownloadIcon />
                        <span>Prompts (.txt)</span>
                      </button>
                    </div>
                  )}
                </div>
                {isTransitionLoading && <Loader loadingText="Bridging Scenes..." />}
                {transitionError && <div className="text-red-400 bg-red-900/50 p-4 rounded-lg border border-red-700">{transitionError}</div>}
                {transitionShotList && <ShotList shots={transitionShotList} />}
                {!isTransitionLoading && !transitionError && !transitionShotList && (
                  <div className="flex-grow flex items-center justify-center text-gray-500">
                    Your transition sequence storyboard will appear here...
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;