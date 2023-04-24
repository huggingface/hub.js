import type { Options, RequestArgs } from "../../types";
import { makeRequestOptions } from "../../lib/makeRequestOptions";

/**
 * Primitive to make custom calls to the inference API
 */
export async function request<T>(
	args: RequestArgs,
	options?: Options & {
		/** For internal HF use, which is why it's not exposed in {@link Options} */
		includeCredentials?: boolean;
	}
): Promise<T> {
	const { url, info } = makeRequestOptions(args, options);
	const response = await (options?.custom_fetch ?? fetch)(url, info);

	if (options?.retry_on_error !== false && response.status === 503 && !options?.wait_for_model) {
		return request(args, {
			...options,
			wait_for_model: true,
		});
	}

	if (!response.ok) {
		if (response.headers.get("Content-Type")?.startsWith("application/json")) {
			const output = await response.json();
			if (output.error) {
				throw new Error(output.error);
			}
		}
		throw new Error("An error occurred while fetching the blob");
	}

	if (response.headers.get("Content-Type")?.startsWith("application/json")) {
		return await response.json();
	}

	return (await response.blob()) as T;
}
