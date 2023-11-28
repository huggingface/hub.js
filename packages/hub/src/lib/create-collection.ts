import { HUB_URL } from "../consts";
import { createApiError } from "../error";
import type { Collection, CreateCollectionPayload } from "../types/api/api-collection";
import type { Credentials } from "../types/public";
import { checkCredentials } from "../utils/checkCredentials";

export async function createCollection(params: {
	title: string;
	namespace?: string;
	description?: string;
	private: boolean;
	exists_ok: boolean;
	credentials?: Credentials;
	hubUrl?: string;
	/**
	 * Custom fetch function to use instead of the default one, for example to use a proxy or edit headers.
	 */
	fetch?: typeof fetch;
}): Promise<Collection> {
	checkCredentials(params.credentials);
	/*// const userInfo = await whoAmI({
		credentials: { accessToken: params.credentials?.accessToken ?? TEST_ACCESS_TOKEN },
		hubUrl: params.hubUrl ?? HUB_URL,
	});*/
	if (params.namespace == null) {
		// params.namespace = userInfo.name;
	}
	console.log(params.description);
	const res = await (params.fetch ?? fetch)(`${params.hubUrl ?? HUB_URL}/api/collections`, {
		method: "POST",
		body: JSON.stringify({
			title: params.title,
			namespace: params.namespace,
			description: params.description,
			private: params.private,
			exists_ok: params.exists_ok,
		} satisfies CreateCollectionPayload),
		headers: {
			Authorization: `Bearer ${params.credentials?.accessToken}`,
			"Content-Type": "application/json",
		},
	});
	console.log(res.status);
	if (!res.ok) {
		throw await createApiError(res);
	}

	const collection = await res.json();
	console.log(collection);
	return collection;
}

//
