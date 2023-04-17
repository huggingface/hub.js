import { request } from "../custom/request";
import type { BaseArgs, Options } from "../../types";

export type ObjectDetectionArgs = BaseArgs & {
	/**
	 * Binary image data
	 */
	data: Blob | ArrayBuffer;
};

export interface ObjectDetectionReturnValue {
	/**
	 * A dict (with keys [xmin,ymin,xmax,ymax]) representing the bounding box of a detected object.
	 */
	box: {
		xmax: number;
		xmin: number;
		ymax: number;
		ymin: number;
	};
	/**
	 * The label for the class (model specific) of a detected object.
	 */
	label: string;

	/**
	 * A float that represents how likely it is that the detected object belongs to the given class.
	 */
	score: number;
}

export type ObjectDetectionReturn = ObjectDetectionReturnValue[];

/**
 * This task reads some image input and outputs the likelihood of classes & bounding boxes of detected objects.
 * Recommended model: facebook/detr-resnet-50
 */
export async function objectDetection(args: ObjectDetectionArgs, options?: Options): Promise<ObjectDetectionReturn> {
	const res = await request<ObjectDetectionReturn>(args, options);
	const isValidOutput =
		Array.isArray(res) &&
		res.every(
			(x) =>
				typeof x.label === "string" &&
				typeof x.score === "number" &&
				typeof x.box.xmin === "number" &&
				typeof x.box.ymin === "number" &&
				typeof x.box.xmax === "number" &&
				typeof x.box.ymax === "number"
		);
	if (!isValidOutput) {
		throw new TypeError(
			"Invalid inference output: output must be of type Array<{label:string; score:number; box:{xmin:number; ymin:number; xmax:number; ymax:number}}>"
		);
	}
	return res;
}
