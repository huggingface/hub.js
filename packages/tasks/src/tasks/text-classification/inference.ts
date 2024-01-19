/**
 * Inference code generated from the JSON schema spec in ./spec
 *
 * Generated on 2024-01-19T16:16:01.752Z
 */

/**
 * Inputs for Text Classification inference
 */
export interface TextClassificationInput {
	/**
	 * One or several texts to classify
	 */
	inputs: string[] | string;
	/**
	 * Additional inference parameters
	 */
	parameters?: TextClassificationParameters;
	[property: string]: any;
}

/**
 * Additional inference parameters
 *
 * Additional inference parameters for Text Classification
 */
export interface TextClassificationParameters {
	/**
	 * The function to apply to the model outputs in order to retrieve the scores.
	 */
	functionToApply?: FunctionToApply;
	/**
	 * When specified, limits the output to the top K most probable classes.
	 */
	topK?: number;
	[property: string]: any;
}

export type FunctionToApply = "sigmoid" | "softmax" | "none";

/**
 * Outputs of inference for the Text Classification task
 */
export interface TextClassificationOutput {
	/**
	 * The predicted class label (model specific).
	 */
	label: string;
	/**
	 * The corresponding probability.
	 */
	score: number;
	[property: string]: any;
}
