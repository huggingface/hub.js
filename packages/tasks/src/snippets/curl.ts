import type { PipelineType } from "../pipelines.js";
import type { ChatCompletionInputMessage, GenerationParameters } from "../tasks/index.js";
import { getModelInputSnippet } from "./inputs.js";
import type {
	GenerationConfigFormatter,
	GenerationMessagesFormatter,
	InferenceSnippet,
	ModelDataMinimal,
} from "./types.js";

export const snippetBasic = (model: ModelDataMinimal, accessToken: string): InferenceSnippet => ({
	content: `curl https://api-inference.huggingface.co/models/${model.id} \\
	-X POST \\
	-d '{"inputs": ${getModelInputSnippet(model, true)}}' \\
	-H 'Content-Type: application/json' \\
	-H "Authorization: Bearer ${accessToken || `{API_TOKEN}`}"`,
});

const formatGenerationMessages: GenerationMessagesFormatter = ({ messages, sep, start, end }) =>
	start +
	messages
		.map(({ role }) => {
			// escape single quotes since single quotes is used to define http post body inside curl requests
			// TODO: handle the case below
			// content = content?.replace(/'/g, "'\\''");
			return `{ "role": "${role}", "content": "test msg" }`;
		})
		.join(sep) +
	end;

const formatGenerationConfig: GenerationConfigFormatter = ({ config, sep, start, end }) =>
	start +
	Object.entries(config)
		.map(([key, val]) => `"${key}": ${val}`)
		.join(sep) +
	end;

export const snippetTextGeneration = (
	model: ModelDataMinimal,
	accessToken: string,
	opts?: {
		streaming?: boolean;
		messages?: ChatCompletionInputMessage[];
		temperature?: GenerationParameters["temperature"];
		max_tokens?: GenerationParameters["max_tokens"];
		top_p?: GenerationParameters["top_p"];
	}
): InferenceSnippet => {
	if (model.tags.includes("conversational")) {
		// Conversational model detected, so we display a code snippet that features the Messages API
		const streaming = opts?.streaming ?? true;
		const messages: ChatCompletionInputMessage[] = opts?.messages ?? [
			{ role: "user", content: "What is the capital of France?" },
		];

		const config = {
			temperature: opts?.temperature,
			max_tokens: opts?.max_tokens ?? 500,
			top_p: opts?.top_p,
		};
		return {
			content: `curl 'https://api-inference.huggingface.co/models/${model.id}/v1/chat/completions' \\
-H "Authorization: Bearer ${accessToken || `{API_TOKEN}`}" \\
-H 'Content-Type: application/json' \\
--data '{
    "model": "${model.id}",
    "messages": ${formatGenerationMessages({ messages, sep: ",\n    ", start: `[\n    `, end: `\n]` })},
    ${formatGenerationConfig({ config, sep: ",\n    ", start: "", end: "" })},
    "stream": ${!!streaming}
}'`,
		};
	} else {
		return snippetBasic(model, accessToken);
	}
};

export const snippetImageTextToTextGeneration = (model: ModelDataMinimal, accessToken: string): InferenceSnippet => {
	if (model.tags.includes("conversational")) {
		// Conversational model detected, so we display a code snippet that features the Messages API
		return {
			content: `curl 'https://api-inference.huggingface.co/models/${model.id}/v1/chat/completions' \\
-H "Authorization: Bearer ${accessToken || `{API_TOKEN}`}" \\
-H 'Content-Type: application/json' \\
-d '{
	"model": "${model.id}",
	"messages": [
		{
			"role": "user",
			"content": [
				{"type": "image_url", "image_url": {"url": "https://cdn.britannica.com/61/93061-050-99147DCE/Statue-of-Liberty-Island-New-York-Bay.jpg"}},
				{"type": "text", "text": "Describe this image in one sentence."}
			]
		}
	],
	"max_tokens": 500,
	"stream": false
}'
`,
		};
	} else {
		return snippetBasic(model, accessToken);
	}
};

export const snippetZeroShotClassification = (model: ModelDataMinimal, accessToken: string): InferenceSnippet => ({
	content: `curl https://api-inference.huggingface.co/models/${model.id} \\
	-X POST \\
	-d '{"inputs": ${getModelInputSnippet(model, true)}, "parameters": {"candidate_labels": ["refund", "legal", "faq"]}}' \\
	-H 'Content-Type: application/json' \\
	-H "Authorization: Bearer ${accessToken || `{API_TOKEN}`}"`,
});

export const snippetFile = (model: ModelDataMinimal, accessToken: string): InferenceSnippet => ({
	content: `curl https://api-inference.huggingface.co/models/${model.id} \\
	-X POST \\
	--data-binary '@${getModelInputSnippet(model, true, true)}' \\
	-H "Authorization: Bearer ${accessToken || `{API_TOKEN}`}"`,
});

export const curlSnippets: Partial<
	Record<
		PipelineType,
		(model: ModelDataMinimal, accessToken: string, opts?: Record<string, unknown>) => InferenceSnippet
	>
> = {
	// Same order as in js/src/lib/interfaces/Types.ts
	"text-classification": snippetBasic,
	"token-classification": snippetBasic,
	"table-question-answering": snippetBasic,
	"question-answering": snippetBasic,
	"zero-shot-classification": snippetZeroShotClassification,
	translation: snippetBasic,
	summarization: snippetBasic,
	"feature-extraction": snippetBasic,
	"text-generation": snippetTextGeneration,
	"image-text-to-text": snippetImageTextToTextGeneration,
	"text2text-generation": snippetBasic,
	"fill-mask": snippetBasic,
	"sentence-similarity": snippetBasic,
	"automatic-speech-recognition": snippetFile,
	"text-to-image": snippetBasic,
	"text-to-speech": snippetBasic,
	"text-to-audio": snippetBasic,
	"audio-to-audio": snippetFile,
	"audio-classification": snippetFile,
	"image-classification": snippetFile,
	"image-to-text": snippetFile,
	"object-detection": snippetFile,
	"image-segmentation": snippetFile,
};

export function getCurlInferenceSnippet(model: ModelDataMinimal, accessToken: string): InferenceSnippet {
	return model.pipeline_tag && model.pipeline_tag in curlSnippets
		? curlSnippets[model.pipeline_tag]?.(model, accessToken) ?? { content: "" }
		: { content: "" };
}

export function hasCurlInferenceSnippet(model: Pick<ModelDataMinimal, "pipeline_tag">): boolean {
	return !!model.pipeline_tag && model.pipeline_tag in curlSnippets;
}
