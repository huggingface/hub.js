import type { BaseArgs, Options } from "../../types";
import { request } from "../custom/request";

export type TextClassificationArgs = BaseArgs & {
	/**
	 * A string to be classified
	 */
	inputs: string;
};

export type TextClassificationReturn = {
	/**
	 * The label for the class (model specific)
	 */
	label: string;
	/**
	 * A floats that represents how likely is that the text belongs to this class.
	 */
	score: number;
}[];

/**
 * Usually used for sentiment-analysis this will output the likelihood of classes of an input. Recommended model: distilbert-base-uncased-finetuned-sst-2-english
 */
export async function textClassification(
	args: TextClassificationArgs,
	options?: Options
): Promise<TextClassificationReturn> {
	const res = (await request<TextClassificationReturn[]>(args, options))?.[0];
	const isValidOutput =
		Array.isArray(res) && res.every((x) => typeof x.label === "string" && typeof x.score === "number");
	if (!isValidOutput) {
		throw new TypeError("Invalid inference output: output must be of type Array<label: string, score: number>");
	}
	return res;
}
