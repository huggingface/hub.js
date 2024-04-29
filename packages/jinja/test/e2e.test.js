import { describe, expect, it } from "vitest";

import { Template } from "../src/index";

import { downloadFile } from "@huggingface/hub";

const EXAMPLE_CHAT = [
	{ role: "user", content: "Hello, how are you?" },
	{ role: "assistant", content: "I'm doing great. How can I help you today?" },
	{ role: "user", content: "I'd like to show off how chat templating works!" },
];

const EXAMPLE_CHAT_WITH_SYSTEM = [
	{
		role: "system",
		content: "You are a friendly chatbot who always responds in the style of a pirate",
	},
	...EXAMPLE_CHAT,
];

const EXAMPLE_FUNCTION_CALLING = [
	{
		role: "assistant",
		content: null,
		tool_calls: [
			{
				type: "function",
				function: {
					name: "get_current_weather",
					arguments: '{\n  "location": "Hanoi"\n}',
				},
			},
		],
	},
	{ role: "user", content: "what's the weather like in Hanoi?" },
];

// Example adapted from https://huggingface.co/fireworks-ai/firefunction-v1
const EXAMPLE_FUNCTION_SPEC = [
	{
		name: "get_stock_price",
		description: "Get the current stock price",
		parameters: {
			type: "object",
			properties: {
				symbol: {
					type: "string",
					description: "The stock symbol, e.g. AAPL, GOOG",
				},
			},
			required: ["symbol"],
		},
	},
	{
		name: "check_word_anagram",
		description: "Check if two words are anagrams of each other",
		parameters: {
			type: "object",
			properties: {
				word1: {
					type: "string",
					description: "The first word",
				},
				word2: {
					type: "string",
					description: "The second word",
				},
			},
			required: ["word1", "word2"],
		},
	},
];
const EXAMPLE_FUNCTION_CALLING_WITH_SYSTEM = [
	{ role: "functions", content: JSON.stringify(EXAMPLE_FUNCTION_SPEC, null, 4) },
	{ role: "system", content: "You are a helpful assistant with access to functions. Use them if required." },
	{ role: "user", content: "Hi, can you tell me the current stock price of AAPL?" },
];

/**
 * Defined in https://github.com/huggingface/transformers
 * Keys correspond to `model_type` in the transformers repo.
 */
const TEST_DEFAULT_TEMPLATES = Object.freeze({
	_base: {
		chat_template: `{% for message in messages %}{{'<|im_start|>' + message['role'] + '\n' + message['content'] + '<|im_end|>' + '\n'}}{% endfor %}{% if add_generation_prompt %}{{ '<|im_start|>assistant\n' }}{% endif %}`,
		data: {
			messages: EXAMPLE_CHAT,
			add_generation_prompt: false,
		},
		target: `<|im_start|>user\nHello, how are you?<|im_end|>\n<|im_start|>assistant\nI'm doing great. How can I help you today?<|im_end|>\n<|im_start|>user\nI'd like to show off how chat templating works!<|im_end|>\n`,
	},
	blenderbot: {
		// facebook/blenderbot-400M-distill
		chat_template: `{% for message in messages %}{% if message['role'] == 'user' %}{{ ' ' }}{% endif %}{{ message['content'] }}{% if not loop.last %}{{ '  ' }}{% endif %}{% endfor %}{{ eos_token }}`,
		data: {
			messages: EXAMPLE_CHAT,
			eos_token: "</s>",
		},
		target: ` Hello, how are you?  I'm doing great. How can I help you today?   I'd like to show off how chat templating works!</s>`,
	},
	blenderbot_small: {
		// facebook/blenderbot_small-90M
		chat_template: `{% for message in messages %}{% if message['role'] == 'user' %}{{ ' ' }}{% endif %}{{ message['content'] }}{% if not loop.last %}{{ '  ' }}{% endif %}{% endfor %}{{ eos_token }}`,
		data: {
			messages: EXAMPLE_CHAT,
			eos_token: "</s>",
		},
		target: ` Hello, how are you?  I'm doing great. How can I help you today?   I'd like to show off how chat templating works!</s>`,
	},
	bloom: {
		// bigscience/bloom
		chat_template: `{% for message in messages %}{{ message.content }}{{ eos_token }}{% endfor %}`,
		data: {
			messages: EXAMPLE_CHAT,
			eos_token: "</s>",
		},
		target: `Hello, how are you?</s>I'm doing great. How can I help you today?</s>I'd like to show off how chat templating works!</s>`,
	},
	gpt_neox: {
		// EleutherAI/gpt-neox-20b
		chat_template: `{% for message in messages %}{{ message.content }}{{ eos_token }}{% endfor %}`,
		data: {
			messages: EXAMPLE_CHAT,
			eos_token: "<|endoftext|>",
		},
		target: `Hello, how are you?<|endoftext|>I'm doing great. How can I help you today?<|endoftext|>I'd like to show off how chat templating works!<|endoftext|>`,
	},
	gpt2: {
		// gpt2
		chat_template: `{% for message in messages %}{{ message.content }}{{ eos_token }}{% endfor %}`,
		data: {
			messages: EXAMPLE_CHAT,
			eos_token: "<|endoftext|>",
		},
		target: `Hello, how are you?<|endoftext|>I'm doing great. How can I help you today?<|endoftext|>I'd like to show off how chat templating works!<|endoftext|>`,
	},
	llama: {
		// hf-internal-testing/llama-tokenizer
		chat_template: `{% if messages[0]['role'] == 'system' %}{% set loop_messages = messages[1:] %}{% set system_message = messages[0]['content'] %}{% elif USE_DEFAULT_PROMPT == true and not '<<SYS>>' in messages[0]['content'] %}{% set loop_messages = messages %}{% set system_message = 'DEFAULT_SYSTEM_MESSAGE' %}{% else %}{% set loop_messages = messages %}{% set system_message = false %}{% endif %}{% for message in loop_messages %}{% if (message['role'] == 'user') != (loop.index0 % 2 == 0) %}{{ raise_exception('Conversation roles must alternate user/assistant/user/assistant/...') }}{% endif %}{% if loop.index0 == 0 and system_message != false %}{% set content = '<<SYS>>\\n' + system_message + '\\n<</SYS>>\\n\\n' + message['content'] %}{% else %}{% set content = message['content'] %}{% endif %}{% if message['role'] == 'user' %}{{ bos_token + '[INST] ' + content.strip() + ' [/INST]' }}{% elif message['role'] == 'system' %}{{ '<<SYS>>\\n' + content.strip() + '\\n<</SYS>>\\n\\n' }}{% elif message['role'] == 'assistant' %}{{ ' ' + content.strip() + ' ' + eos_token }}{% endif %}{% endfor %}`,
		data: {
			messages: EXAMPLE_CHAT_WITH_SYSTEM,
			bos_token: "<s>",
			eos_token: "</s>",
			USE_DEFAULT_PROMPT: true,
		},
		target: `<s>[INST] <<SYS>>\nYou are a friendly chatbot who always responds in the style of a pirate\n<</SYS>>\n\nHello, how are you? [/INST] I'm doing great. How can I help you today? </s><s>[INST] I'd like to show off how chat templating works! [/INST]`,
	},
	whisper: {
		// openai/whisper-large-v3
		chat_template: `{% for message in messages %}{{ message.content }}{{ eos_token }}{% endfor %}`,
		data: {
			messages: EXAMPLE_CHAT,
			eos_token: "<|endoftext|>",
		},
		target: `Hello, how are you?<|endoftext|>I'm doing great. How can I help you today?<|endoftext|>I'd like to show off how chat templating works!<|endoftext|>`,
	},
});

/**
 * Custom templates that are not defined in the transformers repo.
 * Keys are repo ids on the Hugging Face Hub (https://hf.co/models)
 */
const TEST_CUSTOM_TEMPLATES = Object.freeze({
	"HuggingFaceH4/zephyr-7b-beta (add_generation_prompt=false)": {
		chat_template: `{% for message in messages %}\n{% if message['role'] == 'user' %}\n{{ '<|user|>\n' + message['content'] + eos_token }}\n{% elif message['role'] == 'system' %}\n{{ '<|system|>\n' + message['content'] + eos_token }}\n{% elif message['role'] == 'assistant' %}\n{{ '<|assistant|>\n'  + message['content'] + eos_token }}\n{% endif %}\n{% if loop.last and add_generation_prompt %}\n{{ '<|assistant|>' }}\n{% endif %}\n{% endfor %}`,
		data: {
			messages: EXAMPLE_CHAT_WITH_SYSTEM,
			eos_token: "</s>",
			add_generation_prompt: false,
		},
		target: `<|system|>\nYou are a friendly chatbot who always responds in the style of a pirate</s>\n<|user|>\nHello, how are you?</s>\n<|assistant|>\nI'm doing great. How can I help you today?</s>\n<|user|>\nI'd like to show off how chat templating works!</s>\n`,
	},
	"HuggingFaceH4/zephyr-7b-beta (add_generation_prompt=true)": {
		chat_template: `{% for message in messages %}\n{% if message['role'] == 'user' %}\n{{ '<|user|>\n' + message['content'] + eos_token }}\n{% elif message['role'] == 'system' %}\n{{ '<|system|>\n' + message['content'] + eos_token }}\n{% elif message['role'] == 'assistant' %}\n{{ '<|assistant|>\n'  + message['content'] + eos_token }}\n{% endif %}\n{% if loop.last and add_generation_prompt %}\n{{ '<|assistant|>' }}\n{% endif %}\n{% endfor %}`,
		data: {
			messages: [
				{ role: "system", content: "You are a friendly chatbot who always responds in the style of a pirate" },
				{ role: "user", content: "How many helicopters can a human eat in one sitting?" },
			],
			eos_token: "</s>",
			add_generation_prompt: true,
		},
		target: `<|system|>\nYou are a friendly chatbot who always responds in the style of a pirate</s>\n<|user|>\nHow many helicopters can a human eat in one sitting?</s>\n<|assistant|>\n`,
	},
	"HuggingFaceH4/zephyr-7b-gemma-v0.1": {
		chat_template: `{% if messages[0]['role'] == 'user' or messages[0]['role'] == 'system' %}{{ bos_token }}{% endif %}{% for message in messages %}{{ '<|im_start|>' + message['role'] + '\n' + message['content'] + '<|im_end|>' + '\n' }}{% endfor %}{% if add_generation_prompt %}{{ '<|im_start|>assistant\n' }}{% elif messages[-1]['role'] == 'assistant' %}{{ eos_token }}{% endif %}`,
		data: {
			messages: EXAMPLE_CHAT,
			bos_token: "<bos>",
			eos_token: "<eos>",
			add_generation_prompt: false,
		},
		target: `<bos><|im_start|>user\nHello, how are you?<|im_end|>\n<|im_start|>assistant\nI'm doing great. How can I help you today?<|im_end|>\n<|im_start|>user\nI'd like to show off how chat templating works!<|im_end|>\n`,
	},
	"mistral-community/Mixtral-8x22B-Instruct-v0.1-4bit": {
		chat_template: `{{ bos_token }}{% for message in messages %}{% if (message['role'] == 'user') != (loop.index0 % 2 == 0) %}{{ raise_exception('Conversation roles must alternate user/assistant/user/assistant/...') }}{% endif %}{% if message['role'] == 'user' %}{{ '[INST] ' + message['content'] + ' [/INST]' }}{% elif message['role'] == 'assistant' %}{{ message['content'] + eos_token + ' ' }}{% else %}{{ raise_exception('Only user and assistant roles are supported!') }}{% endif %}{% endfor %}`,
		data: {
			messages: EXAMPLE_CHAT,
			bos_token: "<s>",
			eos_token: "</s>",
		},
		target: `<s>[INST] Hello, how are you? [/INST]I'm doing great. How can I help you today?</s> [INST] I'd like to show off how chat templating works! [/INST]`,
	},
	"mistralai/Mixtral-8x7B-Instruct-v0.1": {
		chat_template: `{{ bos_token }}{% for message in messages %}{% if (message['role'] == 'user') != (loop.index0 % 2 == 0) %}{{ raise_exception('Conversation roles must alternate user/assistant/user/assistant/...') }}{% endif %}{% if message['role'] == 'user' %}{{ '[INST] ' + message['content'] + ' [/INST]' }}{% elif message['role'] == 'assistant' %}{{ message['content'] + eos_token}}{% else %}{{ raise_exception('Only user and assistant roles are supported!') }}{% endif %}{% endfor %}`,
		data: {
			messages: EXAMPLE_CHAT,
			bos_token: "<s>",
			eos_token: "</s>",
		},
		target: `<s>[INST] Hello, how are you? [/INST]I'm doing great. How can I help you today?</s>[INST] I'd like to show off how chat templating works! [/INST]`,
	},
	"cognitivecomputations/dolphin-2.5-mixtral-8x7b": {
		chat_template: `{% if not add_generation_prompt is defined %}{% set add_generation_prompt = false %}{% endif %}{% for message in messages %}{{'<|im_start|>' + message['role'] + '\n' + message['content'] + '<|im_end|>' + '\n'}}{% endfor %}{% if add_generation_prompt %}{{ '<|im_start|>assistant\n' }}{% endif %}`,
		data: {
			messages: EXAMPLE_CHAT,
			bos_token: "<s>",
			eos_token: "</s>",
		},
		target: `<|im_start|>user\nHello, how are you?<|im_end|>\n<|im_start|>assistant\nI'm doing great. How can I help you today?<|im_end|>\n<|im_start|>user\nI'd like to show off how chat templating works!<|im_end|>\n`,
	},
	"openchat/openchat-3.5-0106": {
		chat_template: `{{ bos_token }}{% for message in messages %}{{ 'GPT4 Correct ' + message['role'].title() + ': ' + message['content'] + '<|end_of_turn|>'}}{% endfor %}{% if add_generation_prompt %}{{ 'GPT4 Correct Assistant:' }}{% endif %}`,
		data: {
			messages: EXAMPLE_CHAT,
			bos_token: "<s>",
			eos_token: "</s>",
			add_generation_prompt: false,
		},
		target: `<s>GPT4 Correct User: Hello, how are you?<|end_of_turn|>GPT4 Correct Assistant: I'm doing great. How can I help you today?<|end_of_turn|>GPT4 Correct User: I'd like to show off how chat templating works!<|end_of_turn|>`,
	},
	"upstage/SOLAR-10.7B-Instruct-v1.0": {
		chat_template: `{% for message in messages %}{% if message['role'] == 'system' %}{% if message['content']%}{{'### System:\n' + message['content']+'\n\n'}}{% endif %}{% elif message['role'] == 'user' %}{{'### User:\n' + message['content']+'\n\n'}}{% elif message['role'] == 'assistant' %}{{'### Assistant:\n'  + message['content']}}{% endif %}{% if loop.last and add_generation_prompt %}{{ '### Assistant:\n' }}{% endif %}{% endfor %}`,
		data: {
			messages: EXAMPLE_CHAT,
			bos_token: "<s>",
			eos_token: "</s>",
			add_generation_prompt: false,
		},
		target: `### User:\nHello, how are you?\n\n### Assistant:\nI'm doing great. How can I help you today?### User:\nI'd like to show off how chat templating works!\n\n`,
	},
	"codellama/CodeLlama-70b-Instruct-hf": {
		chat_template: `{% if messages[0]['role'] == 'system' %}{% set user_index = 1 %}{% else %}{% set user_index = 0 %}{% endif %}{% for message in messages %}{% if (message['role'] == 'user') != ((loop.index0 + user_index) % 2 == 0) %}{{ raise_exception('Conversation roles must alternate user/assistant/user/assistant/...') }}{% endif %}{% if loop.index0 == 0 %}{{ '<s>' }}{% endif %}{% set content = 'Source: ' + message['role'] + '\n\n ' + message['content'] | trim %}{{ content + ' <step> ' }}{% endfor %}{{'Source: assistant\nDestination: user\n\n '}}`,
		data: {
			messages: EXAMPLE_CHAT,
			bos_token: "<s>",
			eos_token: "</s>",
		},
		target: `<s>Source: user\n\n Hello, how are you? <step> Source: assistant\n\n I'm doing great. How can I help you today? <step> Source: user\n\n I'd like to show off how chat templating works! <step> Source: assistant\nDestination: user\n\n `,
	},
	"Deci/DeciLM-7B-instruct": {
		chat_template: `{% for message in messages %}\n{% if message['role'] == 'user' %}\n{{ '### User:\n' + message['content'] }}\n{% elif message['role'] == 'system' %}\n{{ '### System:\n' + message['content'] }}\n{% elif message['role'] == 'assistant' %}\n{{ '### Assistant:\n'  + message['content'] }}\n{% endif %}\n{% if loop.last and add_generation_prompt %}\n{{ '### Assistant:' }}\n{% endif %}\n{% endfor %}`,
		data: {
			messages: EXAMPLE_CHAT,
			bos_token: "<s>",
			eos_token: "</s>",
			add_generation_prompt: false,
		},
		target: `### User:\nHello, how are you?\n### Assistant:\nI'm doing great. How can I help you today?\n### User:\nI'd like to show off how chat templating works!\n`,
	},
	"Qwen/Qwen1.5-72B-Chat": {
		chat_template: `{% for message in messages %}{% if loop.first and messages[0]['role'] != 'system' %}{{ '<|im_start|>system\nYou are a helpful assistant<|im_end|>\n' }}{% endif %}{{'<|im_start|>' + message['role'] + '\n' + message['content']}}{% if (loop.last and add_generation_prompt) or not loop.last %}{{ '<|im_end|>' + '\n'}}{% endif %}{% endfor %}{% if add_generation_prompt and messages[-1]['role'] != 'assistant' %}{{ '<|im_start|>assistant\n' }}{% endif %}`,
		data: {
			messages: EXAMPLE_CHAT,
			bos_token: "<s>",
			eos_token: "</s>",
			add_generation_prompt: false,
		},
		target: `<|im_start|>system\nYou are a helpful assistant<|im_end|>\n<|im_start|>user\nHello, how are you?<|im_end|>\n<|im_start|>assistant\nI'm doing great. How can I help you today?<|im_end|>\n<|im_start|>user\nI'd like to show off how chat templating works!`,
	},
	"deepseek-ai/deepseek-llm-7b-chat": {
		chat_template: `{% if not add_generation_prompt is defined %}{% set add_generation_prompt = false %}{% endif %}{{ bos_token }}{% for message in messages %}{% if message['role'] == 'user' %}{{ 'User: ' + message['content'] + '\n\n' }}{% elif message['role'] == 'assistant' %}{{ 'Assistant: ' + message['content'] + eos_token }}{% elif message['role'] == 'system' %}{{ message['content'] + '\n\n' }}{% endif %}{% endfor %}{% if add_generation_prompt %}{{ 'Assistant:' }}{% endif %}`,
		data: {
			messages: EXAMPLE_CHAT,
			bos_token: "<｜begin▁of▁sentence｜>",
			eos_token: "<｜end▁of▁sentence｜>",
		},
		target: `<｜begin▁of▁sentence｜>User: Hello, how are you?\n\nAssistant: I'm doing great. How can I help you today?<｜end▁of▁sentence｜>User: I'd like to show off how chat templating works!\n\n`,
	},
	"h2oai/h2o-danube-1.8b-chat": {
		chat_template: `{% for message in messages %}{% if message['role'] == 'user' %}{{ '<|prompt|>' + message['content'] + eos_token }}{% elif message['role'] == 'system' %}{{ '<|system|>' + message['content'] + eos_token }}{% elif message['role'] == 'assistant' %}{{ '<|answer|>'  + message['content'] + eos_token }}{% endif %}{% if loop.last and add_generation_prompt %}{{ '<|answer|>' }}{% endif %}{% endfor %}`,
		data: {
			messages: EXAMPLE_CHAT,
			bos_token: "<s>",
			eos_token: "</s>",
			add_generation_prompt: false,
		},
		target: `<|prompt|>Hello, how are you?</s><|answer|>I'm doing great. How can I help you today?</s><|prompt|>I'd like to show off how chat templating works!</s>`,
	},
	"internlm/internlm2-chat-7b": {
		chat_template: `{% if messages[0]['role'] == 'user' or messages[0]['role'] == 'system' %}{{ bos_token }}{% endif %}{% for message in messages %}{{ '<|im_start|>' + message['role'] + '\n' + message['content'] + '<|im_end|>' + '\n' }}{% endfor %}{% if add_generation_prompt %}{{ '<|im_start|>assistant\n' }}{% elif messages[-1]['role'] == 'assistant' %}{{ eos_token }}{% endif %}`,
		data: {
			messages: EXAMPLE_CHAT,
			bos_token: "<s>",
			eos_token: "</s>",
			add_generation_prompt: false,
		},
		target: `<s><|im_start|>user\nHello, how are you?<|im_end|>\n<|im_start|>assistant\nI'm doing great. How can I help you today?<|im_end|>\n<|im_start|>user\nI'd like to show off how chat templating works!<|im_end|>\n`,
	},
	"TheBloke/deepseek-coder-33B-instruct-AWQ": {
		chat_template: `{%- set found_item = false -%}\n{%- for message in messages -%}\n    {%- if message['role'] == 'system' -%}\n        {%- set found_item = true -%}\n    {%- endif -%}\n{%- endfor -%}\n{%- if not found_item -%}\n{{'You are an AI programming assistant, utilizing the Deepseek Coder model, developed by Deepseek Company, and you only answer questions related to computer science. For politically sensitive questions, security and privacy issues, and other non-computer science questions, you will refuse to answer.\\n'}}\n{%- endif %}\n{%- for message in messages %}\n    {%- if message['role'] == 'system' %}\n{{ message['content'] }}\n    {%- else %}\n        {%- if message['role'] == 'user' %}\n{{'### Instruction:\\n' + message['content'] + '\\n'}}\n        {%- else %}\n{{'### Response:\\n' + message['content'] + '\\n<|EOT|>\\n'}}\n        {%- endif %}\n    {%- endif %}\n{%- endfor %}\n{{'### Response:\\n'}}\n`,
		data: {
			messages: EXAMPLE_CHAT,
			bos_token: "<｜begin▁of▁sentence｜>",
			eos_token: "<|EOT|>",
		},
		target: `You are an AI programming assistant, utilizing the Deepseek Coder model, developed by Deepseek Company, and you only answer questions related to computer science. For politically sensitive questions, security and privacy issues, and other non-computer science questions, you will refuse to answer.\n### Instruction:\nHello, how are you?\n### Response:\nI'm doing great. How can I help you today?\n<|EOT|>\n### Instruction:\nI'd like to show off how chat templating works!\n### Response:\n`,
	},
	"ericzzz/falcon-rw-1b-chat": {
		chat_template: `{% for message in messages %}{% if loop.index > 1 and loop.previtem['role'] != 'assistant' %}{{ ' ' }}{% endif %}{% if message['role'] == 'system' %}{{ '[SYS] ' + message['content'].strip() }}{% elif message['role'] == 'user' %}{{ '[INST] ' + message['content'].strip() }}{% elif message['role'] == 'assistant' %}{{ '[RESP] '  + message['content'] + eos_token }}{% endif %}{% endfor %}{% if add_generation_prompt %}{{ ' [RESP] ' }}{% endif %}`,
		data: {
			messages: EXAMPLE_CHAT,
			bos_token: "<|endoftext|>",
			eos_token: "<|endoftext|>",
			add_generation_prompt: false,
		},
		target: `[INST] Hello, how are you? [RESP] I'm doing great. How can I help you today?<|endoftext|>[INST] I'd like to show off how chat templating works!`,
	},
	"abacusai/Smaug-34B-v0.1": {
		chat_template: `{%- for idx in range(0, messages|length) -%}\n{%- if messages[idx]['role'] == 'user' -%}\n{%- if idx > 1 -%}\n{{- bos_token + '[INST] ' + messages[idx]['content'] + ' [/INST]' -}}\n{%- else -%}\n{{- messages[idx]['content'] + ' [/INST]' -}}\n{%- endif -%}\n{% elif messages[idx]['role'] == 'system' %}\n{{- '[INST] <<SYS>>\\n' + messages[idx]['content'] + '\\n<</SYS>>\\n\\n' -}}\n{%- elif messages[idx]['role'] == 'assistant' -%}\n{{- ' '  + messages[idx]['content'] + ' ' + eos_token -}}\n{% endif %}\n{% endfor %}`,
		data: {
			messages: EXAMPLE_CHAT,
			bos_token: "<s>",
			eos_token: "</s>",
		},
		target: `Hello, how are you? [/INST] I'm doing great. How can I help you today? </s><s>[INST] I'd like to show off how chat templating works! [/INST]`,
	},
	"maywell/Synatra-Mixtral-8x7B": {
		chat_template: `Below is an instruction that describes a task. Write a response that appropriately completes the request.\n\n{% for message in messages %}{% if message['role'] == 'user' %}### Instruction:\n{{ message['content']|trim -}}{% if not loop.last %}{% endif %}\n{% elif message['role'] == 'assistant' %}### Response:\n{{ message['content']|trim -}}{% if not loop.last %}{% endif %}\n{% elif message['role'] == 'system' %}{{ message['content']|trim -}}{% if not loop.last %}{% endif %}\n{% endif %}\n{% endfor %}\n{% if add_generation_prompt and messages[-1]['role'] != 'assistant' %}\n### Response:\n{% endif %}`,
		data: {
			messages: EXAMPLE_CHAT,
			bos_token: "<s>",
			eos_token: "</s>",
			add_generation_prompt: false,
		},
		target: `Below is an instruction that describes a task. Write a response that appropriately completes the request.\n\n### Instruction:\nHello, how are you?### Response:\nI'm doing great. How can I help you today?### Instruction:\nI'd like to show off how chat templating works!`,
	},
	"deepseek-ai/deepseek-coder-33b-instruct": {
		chat_template: `{% if not add_generation_prompt is defined %}\n{% set add_generation_prompt = false %}\n{% endif %}\n{%- set ns = namespace(found=false) -%}\n{%- for message in messages -%}\n    {%- if message['role'] == 'system' -%}\n        {%- set ns.found = true -%}\n    {%- endif -%}\n{%- endfor -%}\n{{bos_token}}{%- if not ns.found -%}\n{{'You are an AI programming assistant, utilizing the Deepseek Coder model, developed by Deepseek Company, and you only answer questions related to computer science. For politically sensitive questions, security and privacy issues, and other non-computer science questions, you will refuse to answer\\n'}}\n{%- endif %}\n{%- for message in messages %}\n    {%- if message['role'] == 'system' %}\n{{ message['content'] }}\n    {%- else %}\n        {%- if message['role'] == 'user' %}\n{{'### Instruction:\\n' + message['content'] + '\\n'}}\n        {%- else %}\n{{'### Response:\\n' + message['content'] + '\\n<|EOT|>\\n'}}\n        {%- endif %}\n    {%- endif %}\n{%- endfor %}\n{% if add_generation_prompt %}\n{{'### Response:'}}\n{% endif %}`,
		data: {
			messages: EXAMPLE_CHAT,
			bos_token: "<｜begin▁of▁sentence｜>",
			eos_token: "<|EOT|>",
		},
		target: `<｜begin▁of▁sentence｜>You are an AI programming assistant, utilizing the Deepseek Coder model, developed by Deepseek Company, and you only answer questions related to computer science. For politically sensitive questions, security and privacy issues, and other non-computer science questions, you will refuse to answer\n### Instruction:\nHello, how are you?\n### Response:\nI'm doing great. How can I help you today?\n<|EOT|>\n### Instruction:\nI'd like to show off how chat templating works!\n`,
	},
	"meetkai/functionary-medium-v2.2": {
		chat_template: `{#v2.2#}\n{% for message in messages %}\n{% if message['role'] == 'user' or message['role'] == 'system' %}\n{{ '<|from|>' + message['role'] + '\n<|recipient|>all\n<|content|>' + message['content'] + '\n' }}{% elif message['role'] == 'tool' %}\n{{ '<|from|>' + message['name'] + '\n<|recipient|>all\n<|content|>' + message['content'] + '\n' }}{% else %}\n{% set contain_content='no'%}\n{% if message['content'] is not none %}\n{{ '<|from|>assistant\n<|recipient|>all\n<|content|>' + message['content'] }}{% set contain_content='yes'%}\n{% endif %}\n{% if 'tool_calls' in message and message['tool_calls'] is not none %}\n{% for tool_call in message['tool_calls'] %}\n{% set prompt='<|from|>assistant\n<|recipient|>' + tool_call['function']['name'] + '\n<|content|>' + tool_call['function']['arguments'] %}\n{% if loop.index == 1 and contain_content == "no" %}\n{{ prompt }}{% else %}\n{{ '\n' + prompt}}{% endif %}\n{% endfor %}\n{% endif %}\n{{ '<|stop|>\n' }}{% endif %}\n{% endfor %}\n{% if add_generation_prompt %}{{ '<|from|>assistant\n<|recipient|>' }}{% endif %}`,
		data: {
			messages: EXAMPLE_FUNCTION_CALLING,
			bos_token: "<s>",
			eos_token: "</s>",
			add_generation_prompt: false,
		},
		target: `<|from|>assistant\n<|recipient|>get_current_weather\n<|content|>{\n  "location": "Hanoi"\n}<|stop|>\n<|from|>user\n<|recipient|>all\n<|content|>what's the weather like in Hanoi?\n`,
	},
	"fireworks-ai/firefunction-v1": {
		chat_template: `{%- set message_roles = ['SYSTEM', 'FUNCTIONS', 'USER', 'ASSISTANT', 'TOOL'] -%}\n{%- set ns = namespace(seen_non_system=false, messages=messages, content='', functions=[]) -%}\n{{ bos_token }}\n{#- Basic consistency checks -#}\n{%- if not ns.messages -%}\n  {{ raise_exception('No messages') }}\n{%- endif -%}\n{%- if ns.messages[0]['role'] | upper != 'SYSTEM' -%}\n  {%- set ns.messages = [{'role': 'SYSTEM', 'content': 'You are a helpful assistant with access to functions. Use them if required.'}] + ns.messages -%}\n{%- endif -%}\n{%- if ns.messages | length < 2 or ns.messages[0]['role'] | upper != 'SYSTEM' or ns.messages[1]['role'] | upper != 'FUNCTIONS' -%}\n  {{ raise_exception('Expected either "functions" or ["system", "functions"] as the first messages') }}\n{%- endif -%}\n{%- for message in ns.messages -%}\n  {%- set role = message['role'] | upper -%}\n  {#- Validation -#}\n  {%- if role not in message_roles -%}\n    {{ raise_exception('Invalid role ' + message['role'] + '. Only ' + message_roles + ' are supported.') }}\n  {%- endif -%}\n  {%- set ns.content = message['content'] if message.get('content') else '' -%}\n  {#- Move tool calls inside the content -#}\n  {%- if 'tool_calls' in message -%}\n    {%- for call in message['tool_calls'] -%}\n      {%- set ns.content = ns.content + '<functioncall>{"name": "' + call['function']['name'] + '", "arguments": ' + call['function']['arguments'] + '}' -%}\n    {%- endfor -%}\n  {%- endif -%}\n  {%- if role == 'ASSISTANT' and '<functioncall>' not in ns.content -%}\n    {%- set ns.content = '<plain>' + ns.content -%}\n  {%- endif -%}\n  {%- if role == 'ASSISTANT' -%}\n    {%- set ns.content = ns.content + eos_token -%}\n  {%- endif -%}\n  {{ role }}: {{ ns.content }}{{ '\\n\\n' }}\n{%- endfor -%}\nASSISTANT:{{ ' ' }}\n`,
		data: {
			messages: EXAMPLE_FUNCTION_CALLING_WITH_SYSTEM,
			bos_token: "<s>",
			eos_token: "</s>",
			add_generation_prompt: false,
		},
		target: `<s>SYSTEM: You are a helpful assistant with access to functions. Use them if required.\n\nFUNCTIONS: [\n    {\n        "name": "get_stock_price",\n        "description": "Get the current stock price",\n        "parameters": {\n            "type": "object",\n            "properties": {\n                "symbol": {\n                    "type": "string",\n                    "description": "The stock symbol, e.g. AAPL, GOOG"\n                }\n            },\n            "required": [\n                "symbol"\n            ]\n        }\n    },\n    {\n        "name": "check_word_anagram",\n        "description": "Check if two words are anagrams of each other",\n        "parameters": {\n            "type": "object",\n            "properties": {\n                "word1": {\n                    "type": "string",\n                    "description": "The first word"\n                },\n                "word2": {\n                    "type": "string",\n                    "description": "The second word"\n                }\n            },\n            "required": [\n                "word1",\n                "word2"\n            ]\n        }\n    }\n]\n\nSYSTEM: You are a helpful assistant with access to functions. Use them if required.\n\nUSER: Hi, can you tell me the current stock price of AAPL?\n\nASSISTANT: `,
	},
	"maywell/PiVoT-MoE": {
		chat_template: `{{ (messages|selectattr('role', 'equalto', 'system')|list|last).content|trim if (messages|selectattr('role', 'equalto', 'system')|list) else '' }}{% for message in messages %}{% if message['role'] == 'system' %}{{ message['content']|trim }}{% elif message['role'] == 'user' %}### Instruction: {{ message['content']|trim }}{% elif message['role'] == 'assistant' %}### Response: {{ message['content']|trim }}{% elif message['role'] == 'user_context' %}### Input: {{ message['content']|trim }}{% endif %}{% if not loop.last %}\n{% endif %}{% endfor %}{% if add_generation_prompt and messages[-1]['role'] != 'assistant' %}### Response:{% endif %}`,
		data: {
			messages: EXAMPLE_CHAT_WITH_SYSTEM,
			bos_token: "<s>",
			eos_token: "</s>",
			add_generation_prompt: false,
		},
		// NOTE: There is a bug in the model's chat template which causes the system prompt
		// to be repeated twice. We replicate this behaviour here.
		target: `You are a friendly chatbot who always responds in the style of a pirateYou are a friendly chatbot who always responds in the style of a pirate### Instruction: Hello, how are you?### Response: I'm doing great. How can I help you today?### Instruction: I'd like to show off how chat templating works!`,
	},
	"CohereForAI/c4ai-command-r-v01": {
		chat_template:
			`{{ bos_token }}{% if messages[0]['role'] == 'system' %}{% set loop_messages = messages[1:] %}{% set system_message = messages[0]['content'] %}{% else %}{% set loop_messages = messages %}{% set system_message = '## Task and Context\\nYou help people answer their questions and other requests interactively. You will be asked a very wide array of requests on all kinds of topics. You will be equipped with a wide range of search engines or similar tools to help you, which you use to research your answer. You should focus on serving the user\\'s needs as best you can, which will be wide-ranging.\\n\\n## Style Guide\\nUnless the user asks for a different style of answer, you should answer in full sentences, using proper grammar and spelling.' %}{% endif %}` +
			`{{ '<|START_OF_TURN_TOKEN|><|SYSTEM_TOKEN|>' }}{{ '# Safety Preamble' }}{{ '\nThe instructions in this section override those in the task description and style guide sections. Don\\'t answer questions that are harmful or immoral.' }}{{ '\n\n# System Preamble' }}{{ '\n## Basic Rules' }}{{ '\nYou are a powerful conversational AI trained by Cohere to help people. You are augmented by a number of tools, and your job is to use and consume the output of these tools to best help the user. You will see a conversation history between yourself and a user, ending with an utterance from the user. You will then see a specific instruction instructing you what kind of response to generate. When you answer the user\\'s requests, you cite your sources in your answers, according to those instructions.' }}` +
			`{{ '\n\n# User Preamble' }}{{ '\n' + system_message }}` +
			`{{'\n\n## Available Tools\nHere is a list of tools that you have available to you:\n\n'}}{% for tool in tools %}{% if loop.index0 != 0 %}{{ '\n\n'}}{% endif %}{{'\`\`\`python\ndef ' + tool.name + '('}}{% for param_name, param_fields in tool.parameter_definitions.items() %}{% if loop.index0 != 0 %}{{ ', '}}{% endif %}{{param_name}}: {% if not param_fields.required %}{{'Optional[' + param_fields.type + '] = None'}}{% else %}{{ param_fields.type }}{% endif %}{% endfor %}{{ ') -> List[Dict]:\n    """'}}{{ tool.description }}{% if tool.parameter_definitions|length != 0 %}{{ '\n\n    Args:\n        '}}{% for param_name, param_fields in tool.parameter_definitions.items() %}{% if loop.index0 != 0 %}{{ '\n        ' }}{% endif %}{{ param_name + ' ('}}{% if not param_fields.required %}{{'Optional[' + param_fields.type + ']'}}{% else %}{{ param_fields.type }}{% endif %}{{ '): ' + param_fields.description }}{% endfor %}{% endif %}{{ '\n    """\n    pass\n\`\`\`' }}{% endfor %}{{ '<|END_OF_TURN_TOKEN|>'}}` +
			`{% for message in loop_messages %}{% set content = message['content'] %}{% if message['role'] == 'user' %}{{ '<|START_OF_TURN_TOKEN|><|USER_TOKEN|>' + content.strip() + '<|END_OF_TURN_TOKEN|>' }}{% elif message['role'] == 'system' %}{{ '<|START_OF_TURN_TOKEN|><|SYSTEM_TOKEN|>' + content.strip() + '<|END_OF_TURN_TOKEN|>' }}{% elif message['role'] == 'assistant' %}{{ '<|START_OF_TURN_TOKEN|><|CHATBOT_TOKEN|>'  + content.strip() + '<|END_OF_TURN_TOKEN|>' }}{% endif %}{% endfor %}` +
			`{{'<|START_OF_TURN_TOKEN|><|SYSTEM_TOKEN|>Write \\'Action:\\' followed by a json-formatted list of actions that you want to perform in order to produce a good response to the user\\'s last input. You can use any of the supplied tools any number of times, but you should aim to execute the minimum number of necessary actions for the input. You should use the \`directly-answer\` tool if calling the other tools is unnecessary. The list of actions you want to call should be formatted as a list of json objects, for example:\n\`\`\`json\n[\n    {\n        "tool_name": title of the tool in the specification,\n        "parameters": a dict of parameters to input into the tool as they are defined in the specs, or {} if it takes no parameters\n    }\n]\`\`\`<|END_OF_TURN_TOKEN|>'}}{% if add_generation_prompt %}{{ '<|START_OF_TURN_TOKEN|><|CHATBOT_TOKEN|>' }}{% endif %}`,

		data: {
			messages: [{ role: "user", content: "Whats the biggest penguin in the world?" }],
			tools: [
				{
					name: "internet_search",
					description: "Returns a list of relevant document snippets for a textual query retrieved from the internet",
					parameter_definitions: {
						query: {
							description: "Query to search the internet with",
							type: "str",
							required: true,
						},
					},
				},
				{
					name: "directly_answer",
					description:
						"Calls a standard (un-augmented) AI chatbot to generate a response given the conversation history",
					parameter_definitions: {},
				},
			],
			bos_token: "<BOS_TOKEN>",
			add_generation_prompt: true,
		},
		target:
			"<BOS_TOKEN><|START_OF_TURN_TOKEN|><|SYSTEM_TOKEN|># Safety Preamble\nThe instructions in this section override those in the task description and style guide sections. Don't answer questions that are harmful or immoral.\n\n# System Preamble\n## Basic Rules\nYou are a powerful conversational AI trained by Cohere to help people. You are augmented by a number of tools, and your job is to use and consume the output of these tools to best help the user. You will see a conversation history between yourself and a user, ending with an utterance from the user. You will then see a specific instruction instructing you what kind of response to generate. When you answer the user's requests, you cite your sources in your answers, according to those instructions." +
			"\n\n# User Preamble\n## Task and Context\nYou help people answer their questions and other requests interactively. You will be asked a very wide array of requests on all kinds of topics. You will be equipped with a wide range of search engines or similar tools to help you, which you use to research your answer. You should focus on serving the user's needs as best you can, which will be wide-ranging.\n\n## Style Guide\nUnless the user asks for a different style of answer, you should answer in full sentences, using proper grammar and spelling." +
			'\n\n## Available Tools\nHere is a list of tools that you have available to you:\n\n```python\ndef internet_search(query: str) -> List[Dict]:\n    """Returns a list of relevant document snippets for a textual query retrieved from the internet\n\n    Args:\n        query (str): Query to search the internet with\n    """\n    pass\n```\n\n```python\ndef directly_answer() -> List[Dict]:\n    """Calls a standard (un-augmented) AI chatbot to generate a response given the conversation history\n    """\n    pass\n```<|END_OF_TURN_TOKEN|>' +
			"<|START_OF_TURN_TOKEN|><|USER_TOKEN|>Whats the biggest penguin in the world?<|END_OF_TURN_TOKEN|>" +
			'<|START_OF_TURN_TOKEN|><|SYSTEM_TOKEN|>Write \'Action:\' followed by a json-formatted list of actions that you want to perform in order to produce a good response to the user\'s last input. You can use any of the supplied tools any number of times, but you should aim to execute the minimum number of necessary actions for the input. You should use the `directly-answer` tool if calling the other tools is unnecessary. The list of actions you want to call should be formatted as a list of json objects, for example:\n```json\n[\n    {\n        "tool_name": title of the tool in the specification,\n        "parameters": a dict of parameters to input into the tool as they are defined in the specs, or {} if it takes no parameters\n    }\n]```<|END_OF_TURN_TOKEN|><|START_OF_TURN_TOKEN|><|CHATBOT_TOKEN|>',
	},
});

describe("End-to-end tests", () => {
	describe("Default templates", async () => {
		for (const [model_type, test_data] of Object.entries(TEST_DEFAULT_TEMPLATES)) {
			it(model_type, async () => {
				const template = new Template(test_data.chat_template);
				const result = template.render(test_data.data);
				expect(result).toEqual(test_data.target);
			});
		}
	});

	describe("Custom templates", async () => {
		for (const [model_type, test_data] of Object.entries(TEST_CUSTOM_TEMPLATES)) {
			it(model_type, async () => {
				const template = new Template(test_data.chat_template);
				const result = template.render(test_data.data);
				expect(result).toEqual(test_data.target);
			});
		}
	});

	it("should parse a chat template from the Hugging Face Hub", async () => {
		const repo = "mistral-community/Mixtral-8x22B-Instruct-v0.1-4bit";
		const tokenizerConfig = await (
			await downloadFile({
				repo,
				path: "tokenizer_config.json",
			})
		).json();

		const template = new Template(tokenizerConfig.chat_template);
		const result = template.render(TEST_CUSTOM_TEMPLATES[repo].data);
		expect(result).toEqual(TEST_CUSTOM_TEMPLATES[repo].target);
	});
});
