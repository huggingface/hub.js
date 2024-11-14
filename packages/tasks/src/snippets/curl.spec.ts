import type { ModelDataMinimal } from "./types.js";
import { describe, expect, it } from "vitest";
import { getCurlInferenceSnippet } from "./curl.js";

describe("inference API snippets", () => {
	it("conversational llm", async () => {
		const model: ModelDataMinimal = {
			id: "meta-llama/Llama-3.1-8B-Instruct",
			pipeline_tag: "text-generation",
			tags: ["conversational"],
			inference: "",
		};
		const snippet = getCurlInferenceSnippet(model, "api_token");

		expect(snippet.content)
			.toEqual(`curl 'https://api-inference.huggingface.co/models/meta-llama/Llama-3.1-8B-Instruct/v1/chat/completions' \\
-H "Authorization: Bearer api_token" \\
-H 'Content-Type: application/json' \\
--data '{
    "model": "meta-llama/Llama-3.1-8B-Instruct",
    "messages": [
		{
			"role": "user",
			"content": "What is the capital of France?"
		}
	],
    "max_tokens": 500,
    "stream": true
}'`);
	});

	it("conversational llm non-streaming", async () => {
		const model: ModelDataMinimal = {
			id: "meta-llama/Llama-3.1-8B-Instruct",
			pipeline_tag: "text-generation",
			tags: ["conversational"],
			inference: "",
		};
		const snippet = getCurlInferenceSnippet(model, "api_token", { streaming: false });

		expect(snippet.content)
			.toEqual(`curl 'https://api-inference.huggingface.co/models/meta-llama/Llama-3.1-8B-Instruct/v1/chat/completions' \\
-H "Authorization: Bearer api_token" \\
-H 'Content-Type: application/json' \\
--data '{
    "model": "meta-llama/Llama-3.1-8B-Instruct",
    "messages": [
		{
			"role": "user",
			"content": "What is the capital of France?"
		}
	],
    "max_tokens": 500,
    "stream": false
}'`);
	});

	it("conversational vlm", async () => {
		const model: ModelDataMinimal = {
			id: "meta-llama/Llama-3.2-11B-Vision-Instruct",
			pipeline_tag: "image-text-to-text",
			tags: ["conversational"],
			inference: "",
		};
		const snippet = getCurlInferenceSnippet(model, "api_token");

		expect(snippet.content)
			.toEqual(`curl 'https://api-inference.huggingface.co/models/meta-llama/Llama-3.2-11B-Vision-Instruct/v1/chat/completions' \\
-H "Authorization: Bearer api_token" \\
-H 'Content-Type: application/json' \\
--data '{
    "model": "meta-llama/Llama-3.2-11B-Vision-Instruct",
    "messages": [
		{
			"role": "user",
			"content": [
				{
					"type": "text",
					"text": "Describe this image in one sentence."
				},
				{
					"type": "image_url",
					"image_url": {
						"url": "https://cdn.britannica.com/61/93061-050-99147DCE/Statue-of-Liberty-Island-New-York-Bay.jpg"
					}
				}
			]
		}
	],
    "max_tokens": 500,
    "stream": true
}'`);
	});
});
