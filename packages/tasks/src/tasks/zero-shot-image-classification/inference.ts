/**
 * Inference code generated from the JSON schema spec in ./spec
 *
 * Using src/scripts/inference-codegen
 */

/**
 * Inputs for Zero Shot Image Classification inference
 */
export interface ZeroShotImageClassificationInput {
	/**
	 * The input image data, with candidate labels
	 */
	data: ZeroShotImageClassificationInputData;
	/**
	 * Additional inference parameters
	 */
	parameters?: ZeroShotImageClassificationParameters;
	[property: string]: unknown;
}

/**
 * The input image data, with candidate labels
 */
export interface ZeroShotImageClassificationInputData {
	/**
	 * The candidate labels for this image
	 */
	candidateLabels: string[];
	/**
	 * The image data to classify
	 */
	image: unknown;
	[property: string]: unknown;
}

/**
 * Additional inference parameters
 *
 * Additional inference parameters for Zero Shot Image Classification
 */
export interface ZeroShotImageClassificationParameters {
	/**
	 * The sentence used in conjunction with candidateLabels to attempt the text classification
	 * by replacing the placeholder with the candidate labels.
	 */
	hypothesisTemplate?: string;
	[property: string]: unknown;
}

/**
 * Outputs of inference for the Zero Shot Image Classification task
 */
export interface ZeroShotImageClassificationOutput {
	/**
	 * A candidate label
	 */
	label: string;
	/**
	 * The associated score / probability
	 */
	score: number;
	[property: string]: unknown;
}
