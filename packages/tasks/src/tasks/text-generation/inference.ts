/**
 * Inference code generated from the JSON schema spec in ./spec
 *
 * Using src/scripts/inference-codegen
 */

/**
 * Inputs for Text Generation inference
 */
export interface TextGenerationInput {
	/**
	 * The text to initialize generation with
	 */
	inputs: string;
	/**
	 * Additional inference parameters
	 */
	parameters?: TextGenerationParameters;
	[property: string]: unknown;
}

/**
 * Additional inference parameters
 *
 * Additional inference parameters for Text Generation
 */
export interface TextGenerationParameters {
	/**
	 * The number of sampling queries to run. Only the best one (in terms of total logprob) will
	 * be returned.
	 */
	best_of?: number;
	/**
	 * Whether or not to output decoder input details
	 */
	decoder_input_details?: boolean;
	/**
	 * Whether or not to output details
	 */
	details?: boolean;
	/**
	 * Whether to use logits sampling instead of greedy decoding when generating new tokens.
	 */
	do_sample?: boolean;
	/**
	 * The maximum number of tokens to generate.
	 */
	max_new_tokens?: number;
	/**
	 * The parameter for repetition penalty. A value of 1.0 means no penalty. See [this
	 * paper](https://hf.co/papers/1909.05858) for more details.
	 */
	repetition_penalty?: number;
	/**
	 * Whether to prepend the prompt to the generated text.
	 */
	return_full_text?: boolean;
	/**
	 * The random sampling seed.
	 */
	seed?: number;
	/**
	 * Stop generating tokens if a member of `stop_sequences` is generated.
	 */
	stop_sequences?: string[];
	/**
	 * The value used to modulate the logits distribution.
	 */
	temperature?: number;
	/**
	 * The number of highest probability vocabulary tokens to keep for top-k-filtering.
	 */
	top_k?: number;
	/**
	 * If set to < 1, only the smallest set of most probable tokens with probabilities that add
	 * up to `top_p` or higher are kept for generation.
	 */
	top_p?: number;
	/**
	 * Truncate input tokens to the given size.
	 */
	truncate?: number;
	/**
	 * Typical Decoding mass. See [Typical Decoding for Natural Language
	 * Generation](https://hf.co/papers/2202.00666) for more information
	 */
	typical_p?: number;
	/**
	 * Watermarking with [A Watermark for Large Language Models](https://hf.co/papers/2301.10226)
	 */
	watermark?: boolean;
	[property: string]: unknown;
}

/**
 * Outputs for Text Generation inference
 */
export interface TextGenerationOutput {
	/**
	 * When enabled, details about the generation
	 */
	details?: TextGenerationOutputDetails;
	/**
	 * The generated text
	 */
	generated_text: string;
	[property: string]: unknown;
}

/**
 * When enabled, details about the generation
 */
export interface TextGenerationOutputDetails {
	/**
	 * Details about additional sequences when best_of is provided
	 */
	best_of_sequences?: TextGenerationSequenceDetails[];
	/**
	 * The reason why the generation was stopped.
	 */
	finish_reason: FinishReason;
	/**
	 * The number of generated tokens
	 */
	generated_tokens: number;
	prefill: PrefillToken[];
	/**
	 * The random seed used for generation
	 */
	seed?: number;
	/**
	 * The generated tokens and associated details
	 */
	tokens: Token[];
	[property: string]: unknown;
}

export interface TextGenerationSequenceDetails {
	/**
	 * The reason why the generation was stopped.
	 */
	finish_reason: FinishReason;
	/**
	 * The generated text
	 */
	generated_text: number;
	/**
	 * The number of generated tokens
	 */
	generated_tokens: number;
	prefill: PrefillToken[];
	/**
	 * The random seed used for generation
	 */
	seed?: number;
	/**
	 * The generated tokens and associated details
	 */
	tokens: Token[];
	[property: string]: unknown;
}

/**
 * The generated sequence reached the maximum allowed length
 *
 * The model generated an end-of-sentence (EOS) token
 *
 * One of the sequence in stop_sequences was generated
 */
export type FinishReason = "length" | "eos_token" | "stop_sequence";

export interface PrefillToken {
	id: number;
	logprob: number;
	/**
	 * The text associated with that token
	 */
	text: string;
	[property: string]: unknown;
}

export interface Token {
	id: number;
	logprob: number;
	/**
	 * Whether or not that token is a special one
	 */
	special: boolean;
	/**
	 * The text associated with that token
	 */
	text: string;
	[property: string]: unknown;
}
