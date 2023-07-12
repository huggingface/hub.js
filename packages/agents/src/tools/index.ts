import { textToImageTool } from "./textToImage";
import { imageToTextTool } from "./imageToText";
import { textToSpeechTool } from "./textToSpeech";
import { speechToTextTool } from "./speechToText";
import type { Tool } from "../types/public";

export const defaultTools: Array<Tool<unknown, unknown>> = [
	textToImageTool,
	imageToTextTool,
	textToSpeechTool,
	speechToTextTool,
];

export { textToImageTool } from "./textToImage";
export { imageToTextTool } from "./imageToText";
export { textToSpeechTool } from "./textToSpeech";
export { speechToTextTool } from "./speechToText";
