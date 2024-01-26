/**
 * Inference code generated from the JSON schema spec in ./spec
 *
 * Using src/scripts/inference-codegen
 */

/**
 * Inputs for Image To Image inference
 */
export interface ImageToImageInput {
	/**
	 * The input image data
	 */
	data: unknown;
	/**
	 * Additional inference parameters
	 */
	parameters?: ImageToImageParameters;
	[property: string]: unknown;
}

/**
 * Additional inference parameters
 *
 * Additional inference parameters for Image To Image
 */
export interface ImageToImageParameters {
	/**
	 * For diffusion models. A higher guidance scale value encourages the model to generate
	 * images closely linked to the text prompt at the expense of lower image quality.
	 */
	guidanceScale?: number;
	/**
	 * One or several prompt to guide what NOT to include in image generation.
	 */
	negativePrompt?: string[];
	/**
	 * For diffusion models. The number of denoising steps. More denoising steps usually lead to
	 * a higher quality image at the expense of slower inference.
	 */
	numInferenceSteps?: number;
	/**
	 * The size in pixel of the output image
	 */
	targetSize?: TargetSize;
	[property: string]: unknown;
}

/**
 * The size in pixel of the output image
 */
export interface TargetSize {
	height: number;
	width: number;
	[property: string]: unknown;
}

/**
 * Outputs of inference for the Image To Image task
 */
export interface ImageToImageOutput {
	/**
	 * The output image
	 */
	image?: unknown;
	[property: string]: unknown;
}
