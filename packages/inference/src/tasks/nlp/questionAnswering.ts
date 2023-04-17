import type { BaseArgs, Options } from "../../types";
import { request } from "../custom/request";

export type QuestionAnsweringArgs = BaseArgs & {
	inputs: {
		context: string;
		question: string;
	};
};

export interface QuestionAnsweringReturn {
	/**
	 * A string that’s the answer within the text.
	 */
	answer: string;
	/**
	 * The index (string wise) of the stop of the answer within context.
	 */
	end: number;
	/**
	 * A float that represents how likely that the answer is correct
	 */
	score: number;
	/**
	 * The index (string wise) of the start of the answer within context.
	 */
	start: number;
}

/**
 * Want to have a nice know-it-all bot that can answer any question?. Recommended model: deepset/roberta-base-squad2
 */
export async function questionAnswering(
	args: QuestionAnsweringArgs,
	options?: Options
): Promise<QuestionAnsweringReturn> {
	const res = await request<QuestionAnsweringReturn>(args, options);
	const isValidOutput =
		typeof res.answer === "string" &&
		typeof res.end === "number" &&
		typeof res.score === "number" &&
		typeof res.start === "number";
	if (!isValidOutput) {
		throw new TypeError(
			"Invalid inference output: output must be of type <answer: string, end: number, score: number, start: number>"
		);
	}
	return res;
}
