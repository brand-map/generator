import { readdir, readFile } from "node:fs/promises";
import path, { resolve } from "node:path";

export type TemplateData = {
  path: string;
  relative: string;
  content: string;
};

export async function loadTemplates(
  teamplatesPath: string,
  config?: {
    filters?: (template: any) => boolean;
    // | ((template: any) => boolean)[]
  },
): Promise<(ctx: Record<string, any>) => { templates: Record<string, TemplateData> }> {
  if (!teamplatesPath || typeof teamplatesPath !== "string") {
    throw new Error(`Invalid templates path provided. Try string`);
  }

  const record = {} as Record<string, TemplateData>;

  const resolvedPath = resolve(teamplatesPath);

  const filters = config?.filters;

  for await (const templatePath of walkDir(resolvedPath)) {
    if (path.basename(templatePath).startsWith("_")) {
      continue;
    }

    if (filters && !filters(templatePath)) {
      continue;
    }

    const relative = path.relative(resolvedPath, templatePath).replace(".hbs", "").replace(".vto", "");

    const contentRaw = await readFile(path.resolve(resolvedPath, templatePath));

    const data: TemplateData = {
      content: new TextDecoder().decode(contentRaw),
      path: templatePath,
      relative,
    };

    if (data.relative.startsWith("_")) {
      continue;
    }

    Object.assign(record, { [relative]: data });
  }

  return function setter(_ctx: Record<string, any>) {
    return { templates: record };
  };
}

async function* walkDir(dir: string): AsyncGenerator<string, void, void> {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const templatePath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      yield* walkDir(templatePath);
    } else if (entry.isFile()) {
      yield templatePath;
    }
  }
}
