/**
 * Inference code generated from the JSON schema spec in ./spec
 *
 * Using src/scripts/inference-codegen
 */

/**
 * Inputs for Token Classification inference
 */
export interface TokenClassificationInput {
	/**
	 * The input text data
	 */
	data: string;
	/**
	 * Additional inference parameters
	 */
	parameters?: TokenClassificationParameters;
	[property: string]: unknown;
}

/**
 * Additional inference parameters
 *
 * Additional inference parameters for Token Classification
 */
export interface TokenClassificationParameters {
	/**
	 * The strategy used to fuse tokens based on model predictions
	 */
	aggregationStrategy?: TokenClassificationAggregationStrategy;
	/**
	 * A list of labels to ignore
	 */
	ignoreLabels?: string[];
	/**
	 * The number of overlapping tokens between chunks when splitting the input text.
	 */
	stride?: number;
	[property: string]: unknown;
}

/**
 * Do not aggregate tokens
 *
 * Group consecutive tokens with the same label in a single entity.
 *
 * Similar to "simple", also preserves word integrity (use the label predicted for the first
 * token in a word).
 *
 * Similar to "simple", also preserves word integrity (uses the label with the highest
 * score, averaged across the word's tokens).
 *
 * Similar to "simple", also preserves word integrity (uses the label with the highest score
 * across the word's tokens).
 */
export type TokenClassificationAggregationStrategy = "none" | "simple" | "first" | "average" | "max";

/**
 * Outputs of inference for the Token Classification task
 */
export interface TokenClassificationOutput {
	/**
	 * The character position in the input where this group ends.
	 */
	end?: number;
	/**
	 * The predicted label for that group of tokens
	 */
	entityGroup?: string;
	label: unknown;
	/**
	 * The associated score / probability
	 */
	score: number;
	/**
	 * The character position in the input where this group begins.
	 */
	start?: number;
	/**
	 * The corresponding text
	 */
	word?: string;
	[property: string]: unknown;
}
