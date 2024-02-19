import { validateOutput, z } from "../../lib/validateOutput";
import type { BaseArgs, Options } from "../../types";
import { toArray } from "../../utils/toArray";
import { request } from "../custom/request";

export type ZeroShotClassificationArgs = BaseArgs & {
	/**
	 * a string or list of strings
	 */
	inputs: string | string[];
	parameters: {
		/**
		 * a list of strings that are potential classes for inputs. (max 10 candidate_labels, for more, simply run multiple requests, results are going to be misleading if using too many candidate_labels anyway. If you want to keep the exact same, you can simply run multi_label=True and do the scaling on your end.
		 */
		candidate_labels: string[];
		/**
		 * (Default: false) Boolean that is set to True if classes can overlap
		 */
		multi_label?: boolean;
	};
};

export interface ZeroShotClassificationOutputValue {
	labels: string[];
	scores: number[];
	sequence: string;
}

export type ZeroShotClassificationOutput = ZeroShotClassificationOutputValue[];

/**
 * This task is super useful to try out classification with zero code, you simply pass a sentence/paragraph and the possible labels for that sentence, and you get a result. Recommended model: facebook/bart-large-mnli.
 */
export async function zeroShotClassification(
	args: ZeroShotClassificationArgs,
	options?: Options
): Promise<ZeroShotClassificationOutput> {
	const res = toArray(
		await request<ZeroShotClassificationOutput[number] | ZeroShotClassificationOutput>(args, {
			...options,
			taskHint: "zero-shot-classification",
		})
	);
	return validateOutput(
		res,
		z.array(z.object({ labels: z.array(z.string()), scores: z.array(z.number()), sequence: z.string() }))
	);
}
