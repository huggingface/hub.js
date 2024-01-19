/**
 * Inference code generated from the JSON schema spec in ./spec
 *
 * Using src/scripts/inference-codegen
 */

/**
 * Inputs for Summarization inference
 *
 * Inputs for Text2text Generation inference
 */
export interface SummarizationInput {
	/**
	 * One or more texts to use for text2text generation
	 */
	inputs: string[] | string;
	/**
	 * Additional inference parameters
	 */
	parameters?: Parameters;
	[property: string]: any;
}

/**
 * Additional inference parameters
 *
 * Additional inference parameters for Text2text Generation
 */
export interface Parameters {
	/**
	 * Whether to clean up the potential extra spaces in the text output.
	 */
	cleanUpTokenizationSpaces?: boolean;
	/**
	 * Additional parametrization of the text generation algorithm
	 */
	generateParameters?: { [key: string]: any };
	/**
	 * The truncation strategy to use
	 */
	truncation?: Truncation;
	[property: string]: any;
}

export type Truncation = "do_not_truncate" | "longest_first" | "only_first" | "only_second";

/**
 * Outputs for Summarization inference
 *
 * Outputs of inference for the Text2text Generation task
 */
export interface SummarizationOutput {
	generatedTex: any;
	/**
	 * The generated text.
	 */
	generatedText?: string;
	[property: string]: any;
}
