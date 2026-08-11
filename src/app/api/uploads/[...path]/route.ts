import { readFile } from "node:fs/promises";
import path from "node:path";
import { getUploadContentType, getUploadRootDir } from "@/lib/uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isSafePathSegment(segment: string) {
  return !!segment && segment !== "." && segment !== ".." && !segment.includes("/") && !segment.includes("\\");
}

export async function GET(_request: Request, context: RouteContext<"/api/uploads/[...path]">) {
  const { path: pathSegments } = await context.params;

  if (!pathSegments?.length || pathSegments.some((segment) => !isSafePathSegment(segment))) {
    return new Response("Not found", { status: 404 });
  }

  const rootDir = getUploadRootDir();
  const absolutePath = path.join(rootDir, ...pathSegments);
  const normalizedRoot = path.resolve(rootDir);
  const normalizedFile = path.resolve(absolutePath);

  if (!normalizedFile.startsWith(`${normalizedRoot}${path.sep}`) && normalizedFile !== normalizedRoot) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const file = await readFile(normalizedFile);

    return new Response(file, {
      headers: {
        "Content-Type": getUploadContentType(normalizedFile),
        "Cache-Control": "private, max-age=0, must-revalidate",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
