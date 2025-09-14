
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

const getPromptFormatInstructions = (promptFormat: FormState['promptFormat'], aspectRatio: FormState['format']) => {
    switch (promptFormat) {
        case 'stable-diffusion':
            return `For each shot, also generate a detailed image generation prompt suitable for Stable Diffusion 1.5. The prompt should consist of comma-separated keywords and phrases, focusing on subject, style, composition, and quality (e.g., "photograph of a sad clown, detailed face, cinematic lighting, dramatic, high-resolution photography, 8k").`;
        case 'flux-ai':
            return `For each shot, also generate a detailed image generation prompt as a single descriptive sentence for the FLUX AI image generator. Focus on creating a rich, narrative scene (e.g., "A lone astronaut stands on a desolate, crimson-hued alien planet, gazing at two suns setting on the horizon, casting long, eerie shadows.").`;
        case 'midjourney':
        default:
            const ar = aspectRatio === 'vertical' ? '--ar 9:16' : '--ar 16:9';
            return `For each shot, also generate a highly detailed and evocative image generation prompt suitable for Midjourney. The prompt should capture the scene, actor, lighting, camera angle, and the specific directorial, video, and artistic style. The prompt must be creative and visually descriptive. End each prompt with "${ar} --style raw".`;
    }
}

export const generateShotList = async (formState: FormState): Promise<Shot[]> => {
  if (!formState.actorImageFile || !formState.lyricsFile) {
      throw new Error("Missing required files");
  }

  const actorImagePart = await fileToGenerativePart(formState.actorImageFile);
  const lyricsText = await fileToText(formState.lyricsFile);
  const promptInstructions = getPromptFormatInstructions(formState.promptFormat, formState.format);

  const prompt = `
    You are a visionary music video director with a deep understanding of cinematography, storytelling, and music theory.
    Your task is to create a detailed shot list for a music video based on the provided materials.
    
    Here is the information you have:
    - **Song Lyrics**: 
      \`\`\`
      ${lyricsText}
      \`\`\`
    - **Song Length**: ${formState.songLength}
    - **Shot Length**: Each shot should be ${formState.shotLength} seconds long.
    - **Director's Style**: ${formState.directorialStyle}
    - **Music Video Genre/Style**: ${formState.videoStyle}
    - **Artistic Style**: ${formState.artStyle}. This is a crucial element. All visual descriptions and prompts must strongly reflect this style.
    - **Video Format**: ${formState.format === 'vertical' ? 'Vertical 9:16' : 'Horizontal 16:9'}. All shot descriptions and prompts must be tailored for this aspect ratio.
    - **Lead Actor/Singer**: The lead artist is depicted in the provided image. ${formState.actorName ? `Their name is ${formState.actorName}. ` : ''}Analyze their look, mood, and style to inform the video's aesthetic, which should also heavily feature the chosen artistic style.

    Your tasks are:
    1.  Break down the entire song into sequential ${formState.shotLength}-second segments and create a comprehensive shot list. For each segment, provide a detailed plan.
    2.  ${promptInstructions}
    
    The output must be a valid JSON array of objects, where each object represents one ${formState.shotLength}-second shot.
  `;
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: { parts: [{ text: prompt }, actorImagePart] },
    config: {
      responseMimeType: "application/json",
      temperature: formState.temperature,
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
              description: `The time range for this shot, in increments of ${formState.shotLength} seconds (e.g., '00:00 - 00:${String(formState.shotLength).padStart(2, '0')}').`,
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
            imagePrompt: {
              type: Type.STRING,
              description: `A detailed image generation prompt in the specified format (${formState.promptFormat}).`,
            },
          },
          required: ["shotNumber", "timestamp", "cameraAngle", "shotDescription", "lighting", "location", "imagePrompt"],
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
    Your task is to create a detailed shot description for a single, ${formState.transitionLength}-second transition shot to bridge two distinct shots in a music video.

    Here is the context you have:
    - **Full Music Video Shot List**: This provides the overall tone, narrative, and style of the project.
      \`\`\`
      ${shotListText}
      \`\`\`
    - **Transition From**: Shot #${formState.fromShot}. The video for this scene is provided.
    - **Transition To**: Shot #${formState.toShot}. The video for this scene is also provided.
    - **Director's Style**: ${formState.directorialStyle}
    - **Music Video Genre/Style**: ${formState.videoStyle}
    - **Artistic Style**: ${formState.artStyle}. The transition must heavily incorporate this specific visual style.
    - **Video Format**: ${formState.format === 'vertical' ? 'Vertical 9:16' : 'Horizontal 16:9'}. Design the transition to fit this aspect ratio.
    
    Your tasks are:
    1.  Analyze the provided shot list, paying close attention to the descriptions, locations, and moods of Shot #${formState.fromShot} and Shot #${formState.toShot}.
    2.  Critically analyze the provided video files for Scene 1 (from) and Scene 2 (to). Pay attention to motion, color grading, pacing, and subject matter to inform the transition.
    3.  Design a single, creative, and visually compelling transition shot that lasts ${formState.transitionLength} seconds and logically and artistically connects the two scenes, incorporating the specified artistic style.
    4.  Provide a detailed plan for this single transition shot. The timestamp should be relative to the transition (e.g., "00:00 - 00:0${formState.transitionLength}"). The shotNumber should be 1.
    5.  Generate a detailed AI video prompt for this shot in the "wan 2.2" format.
        **wan 2.2 Format Guidelines:** The prompt must be a single, continuous descriptive sentence. Structure it as follows: [Main subject and action], [description of environment/background], [camera movement, e.g., dolly in, pan right], [stylistic elements, e.g., cinematic lighting, hyperrealistic, 8k].

    The output must be a valid JSON array containing a single object, where the object represents the transition shot.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: { parts: [{ text: prompt }, scene1VideoPart, scene2VideoPart] },
    config: {
      responseMimeType: "application/json",
      temperature: formState.temperature,
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            shotNumber: { type: Type.INTEGER, description: "The sequential number of the shot within the transition (e.g., 1)." },
            timestamp: { type: Type.STRING, description: `The time range for this shot (e.g., '00:00 - 00:0${formState.transitionLength}').` },
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