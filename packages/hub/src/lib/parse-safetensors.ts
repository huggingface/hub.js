import { Counter } from "../utils/Counter";

const SINGLE_FILE = "model.safetensors";
const INDEX_FILE = "model.safetensors.index.json";

type FileName = string;

type TensorName = string;
type Dtype = "F64" | "F32" | "F16" | "BF16" | "I64" | "I32" | "I16" | "I8" | "U8" | "BOOL";

interface TensorInfo {
	dtype: Dtype;
	shape: number[];
	data_offsets: [number, number];
}

type FileHeader = Record<TensorName, TensorInfo> & {
	__metadata__: Record<string, string>;
};

interface IndexJson {
	dtype?: string;
	/// ^there's sometimes a dtype but it looks inconsistent.
	metadata?: Record<string, string>;
	/// ^ why the naming inconsistency?
	weight_map: Record<TensorName, FileName>;
}

type ShardedHeaders = Record<FileName, FileHeader>;

type ParseFromRepo =
	| {
			sharded: false;
			header: FileHeader;
	  }
	| {
			sharded: true;
			index: IndexJson;
			headers: ShardedHeaders;
	  };

async function parseSingleFile(url: URL): Promise<FileHeader> {
	const bufLengthOfHeaderLE = await (
		await fetch(url, {
			headers: {
				Range: "bytes=0-7",
			},
		})
	).arrayBuffer();
	const lengthOfHeader = new DataView(bufLengthOfHeaderLE).getBigUint64(0, true);
	/// ^little-endian
	const header: FileHeader = await (
		await fetch(url, {
			headers: {
				Range: `bytes=8-${7 + Number(lengthOfHeader)}`,
			},
		})
	).json();
	/// no validation for now, we assume it's a valid FileHeader.
	return header;
}

async function parseShardedIndex(url: URL): Promise<{ index: IndexJson; headers: ShardedHeaders }> {
	const index: IndexJson = await (await fetch(url)).json();
	/// no validation for now, we assume it's a valid IndexJson.

	const shardedMap: ShardedHeaders = {};
	const filenames = [...new Set(Object.values(index.weight_map))];
	await Promise.all(
		filenames.map(async (filename) => {
			const singleUrl = new URL(url.toString().replace(INDEX_FILE, filename));
			shardedMap[filename] = await parseSingleFile(singleUrl);
		})
	);
	return { index, headers: shardedMap };
}

async function doesFileExistOnHub(url: URL): Promise<boolean> {
	const res = await fetch(url, {
		method: "HEAD",
		redirect: "manual",
		/// ^do not follow redirects to save some time
	});
	return res.status >= 200 && res.status < 400;
}

export async function parseSafetensorsFromModelRepo(id: string): Promise<ParseFromRepo> {
	const singleUrl = new URL(`https://huggingface.co/${id}/resolve/main/${SINGLE_FILE}`);
	const indexUrl = new URL(`https://huggingface.co/${id}/resolve/main/${INDEX_FILE}`);
	if (await doesFileExistOnHub(singleUrl)) {
		return {
			sharded: false,
			header: await parseSingleFile(singleUrl),
		};
	} else if (await doesFileExistOnHub(indexUrl)) {
		return {
			sharded: true,
			...(await parseShardedIndex(indexUrl)),
		};
	} else {
		throw new Error("model id does not seem to contain safetensors weights");
	}
}

function computeNumOfParamsByDtypeSingleFile(header: FileHeader): Counter<Dtype> {
	const n = new Counter<Dtype>();
	for (const [k, v] of Object.entries(header)) {
		if (k === "__metadata__") {
			continue;
		}
		if ((v as TensorInfo).shape.length === 0) {
			continue;
		}
		n.incr(
			(v as TensorInfo).dtype,
			(v as TensorInfo).shape.reduce((a, b) => a * b)
		);
	}
	return n;
}

function computeNumOfParamsByDtypeSharded(shardedMap: ShardedHeaders): Counter<Dtype> {
	const n = new Counter<Dtype>();
	for (const v of Object.values(shardedMap)) {
		n.add(computeNumOfParamsByDtypeSingleFile(v));
	}
	return n;
}

export function computeNumOfParamsByDtype(parse: ParseFromRepo): Counter<Dtype> {
	if (parse.sharded) {
		return computeNumOfParamsByDtypeSharded(parse.headers);
	} else {
		return computeNumOfParamsByDtypeSingleFile(parse.header);
	}
}
