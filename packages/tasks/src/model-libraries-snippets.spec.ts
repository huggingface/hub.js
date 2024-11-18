import { describe, expect, it } from "vitest";
import type { ModelData } from "./model-data";
import { llama_cpp_python } from "./model-libraries-snippets";

describe("model-libraries-snippets", () => {
	it("llama_cpp_python conversational", async () => {
		const model: ModelData = {
			id: "mlabonne/gemma-2b-it-GGUF",
			tags: ["conversational"],
			inference: "",
		};
		const snippet = llama_cpp_python(model);

		expect(snippet.join("\n")).toEqual(`from llama_cpp import Llama

llm = Llama.from_pretrained(
	repo_id="mlabonne/gemma-2b-it-GGUF",
	filename="{{GGUF_FILE}}",
)

llm.create_chat_completion(
	messages = [
		{
			"role": "user",
			"content": "What is the capital of France?"
		}
	]
)`);
	});

	it("llama_cpp_python non-conversational", async () => {
		const model: ModelData = {
			id: "mlabonne/gemma-2b-it-GGUF",
			tags: [""],
			inference: "",
		};
		const snippet = llama_cpp_python(model);

		expect(snippet.join("\n")).toEqual(`from llama_cpp import Llama

llm = Llama.from_pretrained(
	repo_id="mlabonne/gemma-2b-it-GGUF",
	filename="{{GGUF_FILE}}",
)

output = llm(
	"Once upon a time,",
	max_tokens=512,
	echo=True
)
print(output)`);
	});
});
