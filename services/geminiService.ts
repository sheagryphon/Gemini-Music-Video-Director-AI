import { GoogleGenAI, Type } from "@google/genai";
import type { FormState, Shot, TransitionFormState } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const fileToGenerativePart = async (file: File) => {
  const base64EncodedData = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  return {
    inlineData: {
      data: base64EncodedData,
      mimeType: file.type,
    },
  };
};

const fileToText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                resolve(event.target.result as string);
            } else {
                reject(new Error("Failed to read file"));
            }
        };
        reader.onerror = () => {
            reject(new Error("Error reading file"));
        };
        reader.readAsText(file);
    });
};

export const generateShotList = async (formState: FormState): Promise<Shot[]> => {
  if (!formState.actorImageFile || !formState.lyricsFile) {
      throw new Error("Missing required files");
  }

  const actorImagePart = await fileToGenerativePart(formState.actorImageFile);
  const lyricsText = await fileToText(formState.lyricsFile);

  const prompt = `
    You are a visionary music video director with a deep understanding of cinematography, storytelling, and music theory.
    Your task is to create a detailed shot list for a music video based on the provided materials.
    
    Here is the information you have:
    - **Song Lyrics**: 
      \`\`\`
      ${lyricsText}
      \`\`\`
    - **Song Length**: ${formState.songLength}
    - **Director's Style**: ${formState.directorialStyle}
    - **Music Video Genre/Style**: ${formState.videoStyle}
    - **Lead Actor/Singer**: The lead artist is depicted in the provided image. Analyze their look, mood, and style to inform the video's aesthetic.

    Your tasks are:
    1.  Break down the entire song into sequential 6-second segments and create a comprehensive shot list. For each segment, provide a detailed plan.
    2.  For each shot, also generate a highly detailed and evocative image generation prompt suitable for Midjourney. The prompt should capture the scene, actor, lighting, camera angle, and the specific directorial and video style. The prompt must be creative and visually descriptive. End each prompt with "--ar 16:9 --style raw".
    
    The output must be a valid JSON array of objects, where each object represents one 6-second shot.
  `;
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: { parts: [{ text: prompt }, actorImagePart] },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            shotNumber: {
              type: Type.INTEGER,
              description: "The sequential number of the shot.",
            },
            timestamp: {
              type: Type.STRING,
              description: "The time range for this shot (e.g., '00:00 - 00:06').",
            },
            cameraAngle: {
              type: Type.STRING,
              description: "Describe the camera shot type and angle (e.g., 'Medium close-up, low angle').",
            },
            shotDescription: {
              type: Type.STRING,
              description: "A detailed description of the action, scenery, and performance in the shot.",
            },
            lighting: {
              type: Type.STRING,
              description: "Describe the lighting style (e.g., 'High-key, soft shadows' or 'Neon backlighting').",
            },
            location: {
              type: Type.STRING,
              description: "The setting or location for this shot (e.g., 'Rainy city street at night').",
            },
            midjourneyPrompt: {
              type: Type.STRING,
              description: "A detailed image generation prompt for Midjourney, ending with parameters like --ar 16:9 --style raw.",
            },
          },
          required: ["shotNumber", "timestamp", "cameraAngle", "shotDescription", "lighting", "location", "midjourneyPrompt"],
        },
      },
    },
  });

  try {
    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);
    return result as Shot[];
  } catch(e) {
    console.error("Failed to parse JSON response:", response.text);
    throw new Error("The AI returned an invalid response. Please try again.");
  }
};


export const generateTransitionShotList = async (formState: TransitionFormState): Promise<Shot[]> => {
  if (!formState.shotListFile || !formState.scene1VideoFile || !formState.scene2VideoFile) {
      throw new Error("Missing required files for transition generation.");
  }

  const shotListText = await fileToText(formState.shotListFile);
  const scene1VideoPart = await fileToGenerativePart(formState.scene1VideoFile);
  const scene2VideoPart = await fileToGenerativePart(formState.scene2VideoFile);

  const prompt = `
    You are a master film editor and director, specializing in creating seamless and impactful transitions between scenes.
    Your task is to create a detailed shot description for a single, 1-2 second transition shot to bridge two distinct shots in a music video.

    Here is the context you have:
    - **Full Music Video Shot List**: This provides the overall tone, narrative, and style of the project.
      \`\`\`
      ${shotListText}
      \`\`\`
    - **Transition From**: Shot #${formState.fromShot}. The video for this scene is provided.
    - **Transition To**: Shot #${formState.toShot}. The video for this scene is also provided.
    - **Director's Style**: ${formState.directorialStyle}
    - **Music Video Genre/Style**: ${formState.videoStyle}
    
    Your tasks are:
    1.  Analyze the provided shot list, paying close attention to the descriptions, locations, and moods of Shot #${formState.fromShot} and Shot #${formState.toShot}.
    2.  Critically analyze the provided video files for Scene 1 (from) and Scene 2 (to). Pay attention to motion, color grading, pacing, and subject matter to inform the transition.
    3.  Design a single, creative, and visually compelling transition shot that lasts 1-2 seconds and logically and artistically connects the two scenes.
    4.  Provide a detailed plan for this single transition shot. The timestamp should be relative to the transition (e.g., "00:00 - 00:01.5"). The shotNumber should be 1.
    5.  Generate a detailed AI video prompt for this shot in the "wan 2.2" format.
        **wan 2.2 Format Guidelines:** The prompt must be a single, continuous descriptive sentence. Structure it as follows: [Main subject and action], [description of environment/background], [camera movement, e.g., dolly in, pan right], [stylistic elements, e.g., cinematic lighting, hyperrealistic, 8k].

    The output must be a valid JSON array containing a single object, where the object represents the transition shot.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: { parts: [{ text: prompt }, scene1VideoPart, scene2VideoPart] },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            shotNumber: { type: Type.INTEGER, description: "The sequential number of the shot within the transition (e.g., 1)." },
            timestamp: { type: Type.STRING, description: "The time range for this shot (e.g., '00:00 - 00:01.5')." },
            cameraAngle: { type: Type.STRING, description: "Describe the camera shot type and angle." },
            shotDescription: { type: Type.STRING, description: "A detailed description of the action and scenery in the shot." },
            lighting: { type: Type.STRING, description: "Describe the lighting style." },
            location: { type: Type.STRING, description: "The setting or location for this shot." },
            videoPrompt: { type: Type.STRING, description: "A detailed AI video generation prompt in the 'wan 2.2' format." },
          },
          required: ["shotNumber", "timestamp", "cameraAngle", "shotDescription", "lighting", "location", "videoPrompt"],
        },
      },
    },
  });

  try {
    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);
    return result as Shot[];
  } catch(e) {
    console.error("Failed to parse JSON response:", response.text);
    throw new Error("The AI returned an invalid response. Please try again.");
  }
};