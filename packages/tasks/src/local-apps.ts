import type { ModelData } from "./model-data";
import type { PipelineType } from "./pipelines";

/**
 * Elements configurable by a local app.
 */
export type LocalApp = {
	/**
	 * Name that appears in buttons
	 */
	prettyLabel: string;
	/**
	 * Link to get more info about a local app (website etc)
	 */
	docsUrl: string;
	/**
	 * main category of app
	 */
	mainTask: PipelineType;
	/**
	 * Whether to display a pill "macOS-only"
	 */
	macOSOnly?: boolean;

	comingSoon?: boolean;
	/**
	 * IMPORTANT: function to figure out whether to display the button on a model page's main "Use this model" dropdown.
	 */
	displayOnModelPage: (model: ModelData) => boolean;
} & (
	| {
			/**
			 * If the app supports deeplink, URL to open.
			 */
			deeplink: (model: ModelData) => URL;
	  }
	| {
			/**
			 * And if not (mostly llama.cpp), snippet to copy/paste in your terminal
			 */
			snippet: (model: ModelData, filepath?: string) => string | string[];
	  }
);

function isGgufModel(model: ModelData) {
	return model.tags.includes("gguf");
}

const snippetLlamacpp = (model: ModelData): string[] => {
	return [
		`# Option 1: use llama.cpp with brew
brew install llama.cpp

# Load and run the model
llama \\
	--hf-repo "${model.id}" \\
	--hf-file file.gguf \\
	-p "I believe the meaning of life is" \\
	-n 128`,
		`# Option 2: build llama.cpp from source with curl support
git clone https://github.com/ggerganov/llama.cpp.git
cd llama.cpp
LLAMA_CURL=1 make

# Load and run the model
./main \\
	--hf-repo "${model.id}" \\
	-m file.gguf \\
	-p "I believe the meaning of life is" \\
	-n 128`,
	];
};

const snippetAikit = (model: ModelData, filepath?: string): string[] => {
	// convert model id to lowercase for docker image name
	model.id = model.id.toLowerCase();
	return [
		`# build the container with docker locally
docker buildx build -t ${model.id}:latest --load \
	--build-arg="model=huggingface://${model.id}/${filepath ?? "file.gguf"}" \
	"https://raw.githubusercontent.com/sozercan/aikit/main/models/aikitfile.yaml"

# run the container locally
docker run -d --rm -p 8080:8080 ${model.id}:latest

# visit http://localhost:8080/chat with your browser
# or
# curl http://localhost:8080/v1/chat/completions -H "Content-Type: application/json" -d '{"model": "${filepath ?? "file.gguf"}", "messages": [{"role": "user", "content": "I believe the meaning of life is"}]}'`
	];
};

/**
 * Add your new local app here.
 *
 * This is open to new suggestions and awesome upcoming apps.
 *
 * /!\ IMPORTANT
 *
 * If possible, you need to support deeplinks and be as cross-platform as possible.
 *
 * Ping the HF team if we can help with anything!
 */
export const LOCAL_APPS = {
	"llama.cpp": {
		prettyLabel: "llama.cpp",
		docsUrl: "https://github.com/ggerganov/llama.cpp",
		mainTask: "text-generation",
		displayOnModelPage: isGgufModel,
		snippet: snippetLlamacpp,
	},
	lmstudio: {
		prettyLabel: "LM Studio",
		docsUrl: "https://lmstudio.ai",
		mainTask: "text-generation",
		displayOnModelPage: isGgufModel,
		deeplink: (model) => new URL(`lmstudio://open_from_hf?model=${model.id}`),
	},
	jan: {
		prettyLabel: "Jan",
		docsUrl: "https://jan.ai",
		mainTask: "text-generation",
		displayOnModelPage: isGgufModel,
		deeplink: (model) => new URL(`jan://models/huggingface/${model.id}`),
	},
	backyard: {
		prettyLabel: "Backyard AI",
		docsUrl: "https://backyard.ai",
		mainTask: "text-generation",
		displayOnModelPage: isGgufModel,
		deeplink: (model) => new URL(`https://backyard.ai/hf/model/${model.id}`),
	},
	sanctum: {
		prettyLabel: "Sanctum",
		docsUrl: "https://sanctum.ai",
		mainTask: "text-generation",
		displayOnModelPage: isGgufModel,
		deeplink: (model) => new URL(`sanctum://open_from_hf?model=${model.id}`),
	},
	drawthings: {
		prettyLabel: "Draw Things",
		docsUrl: "https://drawthings.ai",
		mainTask: "text-to-image",
		macOSOnly: true,
		displayOnModelPage: (model) =>
			model.library_name === "diffusers" && (model.pipeline_tag === "text-to-image" || model.tags.includes("lora")),
		deeplink: (model) => {
			if (model.tags.includes("lora")) {
				return new URL(`https://drawthings.ai/import/diffusers/pipeline.load_lora_weights?repo_id=${model.id}`);
			} else {
				return new URL(`https://drawthings.ai/import/diffusers/pipeline.from_pretrained?repo_id=${model.id}`);
			}
		},
	},
	diffusionbee: {
		prettyLabel: "DiffusionBee",
		docsUrl: "https://diffusionbee.com",
		mainTask: "text-to-image",
		macOSOnly: true,
		comingSoon: true,
		displayOnModelPage: (model) => model.library_name === "diffusers" && model.pipeline_tag === "text-to-image",
		deeplink: (model) => new URL(`diffusionbee://open_from_hf?model=${model.id}`),
	},
	aikit: {
		prettyLabel: "AIKit",
		docsUrl: "https://github.com/sozercan/aikit",
		mainTask: "text-generation",
		displayOnModelPage: isGgufModel,
		snippet: snippetAikit,
	},
} satisfies Record<string, LocalApp>;

export type LocalAppKey = keyof typeof LOCAL_APPS;
