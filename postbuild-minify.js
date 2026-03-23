import { readFileSync, writeFileSync } from "fs";
import { minify } from "terser";

for (const file of ["dist/playlight-sdk.es.js", "dist/playlight-sdk.iife.js"]) {
	const result = await minify(readFileSync(file, "utf-8"), {
		ecma: 2020,
		module: file.includes(".es."),
		toplevel: true,
		compress: { passes: 2 },
		mangle: { toplevel: true },
		format: { comments: false },
		sourceMap: { content: readFileSync(`${file}.map`, "utf-8"), url: `${file.split("/").pop()}.map` },
	});
	writeFileSync(file, result.code);
	writeFileSync(`${file}.map`, result.map);
}
