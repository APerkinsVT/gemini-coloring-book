
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ColorInfo } from '../types';

const faberCastellColors = `
225: Dark Red, 226: Alizarin Crimson, 230: Cold Grey I, 233: Cold Grey IV, 267: Pine Green, 270: Warm Grey I, 273: Warm Grey IV, 280: Burnt Umber, 283: Burnt Siena, 101: Medium White, 102: Cream, 103: Ivory, 104: Light Yellow Glaze, 106: Light Chrome Yellow, 109: Dark Chrome Yellow, 113: Orange Glaze, 118: Scarlet Red, 124: Rose Carmine, 127: Pink Carmine, 131: Medium Flesh, 132: Light Flesh, 138: Violet, 140: Light Ultramine, 143: Cobalt Blue, 149: Bluish Turquoise, 151: Helioblue-reddish, 153: Cobalt Turquoise, 155: Helio Turquoise, 156: Cobalt Green, 157: Dark Indigo, 159: Hooker's Green, 160: Manganese Violet, 165: Juniper Green, 167: Permanent Green Olive, 168: Earth Green Yellowish, 169: Caput Mortuum, 170: May Green, 172: Earth Green, 173: Olive Green Yellowish, 174: Chrome Green Opaque, 175: Dark Sepia, 176: Van Dyck Brown, 177: Walnut Brown, 179: Bistre, 180: Raw Umber, 181: Payne's Grey, 182: Brown Ochre, 183: Light Yellow Ochre, 184: Dark Naples Ochre, 185: Naples Yellow, 186: Terracotta, 187: Burnt Ochre, 188: Sanguine, 189: Cinnamon, 190: Venetian Red, 191: Pompeian Red, 192: Indian Red, 193: Burnt Carmine, 194: Red-Violet, 199: Black
`;

const colorSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      number: {
        type: Type.STRING,
        description: "The number ID for the color, starting from 1.",
      },
      picturePart: {
        type: Type.STRING,
        description: "The name of the feature in the image that this color represents (e.g., 'Orchid Petal', 'Pottery Main', 'Leaf Highlight').",
      },
      hex: {
        type: Type.STRING,
        description: "The hexadecimal color code, starting with '#'.",
      },
      fbPencilColor: {
        type: Type.STRING,
        description: "The official name of the closest matching Faber-Castell Polychromos pencil from the provided list.",
      },
      fbNumber: {
        type: Type.STRING,
        description: "The official number of the closest matching Faber-Castell Polychromos pencil from the provided list.",
      },
    },
    required: ["number", "picturePart", "hex", "fbPencilColor", "fbNumber"],
  },
};

const getAiClient = () => {
  const apiKey = import.meta.env.VITE_API_KEY;
  if (!apiKey) {
    throw new Error("VITE_API_KEY environment variable is not set.");
  }
  return new GoogleGenAI({ apiKey });
};

export const extractPalette = async (
  base64Image: string,
  mimeType: string
): Promise<ColorInfo[]> => {
  const ai = getAiClient();

  const imagePart = {
    inlineData: {
      data: base64Image,
      mimeType,
    },
  };

  const textPart = {
    text: `Analyze the provided image to create a detailed color palette for an artist.
Follow these steps:
1.  Identify the 8 most prominent and important colors in the image.
2.  For each color, determine which part of the picture it represents and give it a descriptive name (e.g., 'Orchid Petal', 'Pottery Main', 'Leaf Highlight').
3.  Extract the hexadecimal code for each color.
4.  Critically examine the Faber-Castell Polychromos color list provided below. For each extracted color, find the *closest possible match* from the list and record its official name and number.
5.  Assign a unique number ID to each color, starting from 1.
6.  Return the final result as a JSON array of objects, with each object containing: 'number', 'picturePart', 'hex', 'fbPencilColor', and 'fbNumber'.

**Faber-Castell Polychromos Color List:**
${faberCastellColors}`,
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: colorSchema,
      },
    });

    const jsonString = response.text.trim();
    const data = JSON.parse(jsonString);
    
    if (!Array.isArray(data)) {
        throw new Error("API response is not in the expected array format.");
    }

    // Filter out duplicate colors based on a combination of properties
    const uniqueColors = data.filter((color, index, self) =>
        index === self.findIndex((c) => (
            c.hex === color.hex && c.picturePart === color.picturePart
        ))
    );

    return uniqueColors as ColorInfo[];

  } catch (error) {
    console.error("Error extracting palette with Gemini:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to extract palette: ${error.message}`);
    }
    throw new Error("An unknown error occurred during palette extraction.");
  }
};

export const generateLineDrawing = async (
  base64Image: string,
  mimeType: string
): Promise<string> => {
  const ai = getAiClient();

  const imagePart = {
    inlineData: {
      data: base64Image,
      mimeType,
    },
  };

  const textPart = {
    text: `Your primary goal is to create a highly faithful and accurate **outline drawing** of the provided image for a coloring book. You must act as a precise digital tracer, not a creative interpreter.

**ABSOLUTE CRITICAL RULES - YOU MUST FOLLOW THESE:**
1.  **OUTLINE DRAWING ONLY:** Your output must be a line drawing. You are strictly forbidden from filling in large areas with solid color or heavy shading. The user must be able to color inside the lines you create. For example, if the image contains a dark flower pot, you must draw its outline and add light shading for form. You MUST NOT fill the entire pot with a solid dark color.
2.  **DO NOT INVENT DETAILS:** Do NOT add any elements, objects, or details that are not clearly visible in the original photo. If a shoreline is empty, it MUST be drawn empty.
3.  **NO FAKE TREES:** Do NOT add trees, buildings, or other objects if they are not in the source image.
4.  **NO TARGET SUN:** Do NOT draw the sun as a 'target' or with concentric circles. Your drawing of the sun must match the source photo's representation.

**Instructions:**
- Create a simplified line drawing focusing on the main, existing shapes and outlines.
- Use clean black lines on a white background.
- Add very light and subtle grayscale shading (5-25% black) ONLY to represent the shadows and depth seen in the original photo. The overall image must remain light and colorable.
- Before finishing, check your drawing against the original photo one last time to ensure you have not invented any details or filled in any large objects.
- The output must be ONLY the image. It must contain NO color and NO numbers.`,
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [imagePart, textPart] },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64ImageBytes: string = part.inlineData.data;
        return `data:image/png;base64,${base64ImageBytes}`;
      }
    }
    throw new Error("API did not return an image for the line drawing.");
  } catch (error) {
    console.error("Error generating line drawing:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to generate line drawing: ${error.message}`);
    }
    throw new Error("An unknown error occurred during line drawing generation.");
  }
};

export const generateColoringInstructions = async (
  base64Image: string,
  mimeType: string,
  palette: ColorInfo[]
): Promise<string> => {
  const ai = getAiClient();

  const imagePart = {
    inlineData: {
      data: base64Image,
      mimeType,
    },
  };
  
  const paletteString = palette
    .map(c => `${c.number}: ${c.picturePart} (${c.hex})`)
    .join('\n');

  const textPart = {
    text: `You are an artist providing straightforward instructions for a coloring page.
You will be given an image and a specific color palette. Write a helpful coloring guide in a checklist or bulleted list format.

**Instructions:**
- Your tone should be direct, informative, and practical.
- Create a bulleted list using a hyphen (-) for each point.
- Emphasize the part of the drawing using double asterisks for bold, like **this**.
- For each part, describe which color(s) from the provided palette to use.
- You MUST refer to the colors using both the number and the "Picture Part" name (e.g., "#3 (Leaf Green)").
- Start with a brief introductory sentence.
- Example of the desired format:
"""
Here is a guide to bring your drawing to life:
- **Orchid Petals:** Use #2 (Orchid White) for the main petals. For the delicate centers, add a touch of #6 (Orchid Center Pink).
- **Bromeliad Bloom:** This should be colored with the vibrant #4 (Bromeliad Yellow).
- **Leaves:** The main leaves will look great with #3 (Leaf Green). Use #8 (Darker Leaf Green) to add depth in the shadowy areas.
- **Pot:** The pot itself is #1 (Pot Yellow).
- **Soil & Stake:** Use #5 (Soil Brown) for the soil and #7 (Support Gold) for the support stake.
"""
- The output should be ONLY the text guide. Do not include headers or any other content.

**Color Palette to use for instructions:**
${paletteString}`,
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, textPart] },
    });

    return response.text;
  } catch (error) {
    console.error("Error generating coloring instructions:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to generate coloring instructions: ${error.message}`);
    }
    throw new Error("An unknown error occurred during instruction generation.");
  }
};
