import { mkdir } from "fs/promises";
import { writeFile } from "fs/promises";
import path, { dirname } from "path";

import { toMerged } from "es-toolkit";

import { type TemplateData } from "./actions/load-templates";
import { HandlebarsRenderer } from "./renderer-handlebars";
import { VentoRenderer } from "./renderer-vento";
import type { RendererAbstract } from "./types";

export class Genrator<const in out Context = { templates: Record<string, TemplateData>; data: unknown; rendered: { path: string; content: string }[] }> {
  #context = {
    templates: {} as Record<string, TemplateData>,
    data: null as unknown,
    rendered: [] as { path: string; content: string }[],
  };

  #renderer: RendererAbstract;

  get context(): Context {
    return this.#context as any;
  }

  out: string;

  constructor(config?: ({ engine?: "vento" } | { engine?: "handlebars" }) & { out?: string; cwd?: string }) {
    this.out = config?.out ?? process.cwd();

    const engine = config?.engine ?? "vento";
    switch (engine) {
      case "vento":
        this.#renderer = new VentoRenderer();
        break;

      case "handlebars":
        this.#renderer = new HandlebarsRenderer();
        break;

      default:
        throw new Error(`Invalid render engine provided: ${engine}`);
    }
  }

  addContext<Setter extends (args: Context) => any>(setter: Setter): Genrator<ReturnType<Setter> & Context>;
  addContext<Setter extends Record<string, any>>(setter: Setter): Genrator<Setter & Context>;
  addContext(setter: any) {
    if (typeof setter === "function") {
      const context = setter(this.#context);
      this.#context = toMerged(this.#context as any, context);
      return this as any;
    }
    this.#context = toMerged(this.#context as any, setter);
    return this as any;
  }

  async render(
    renderFn?: (ctx: Context) => {
      path: string;
      content: string;
    }[],
  ): Promise<void> {
    switch (true) {
      case typeof renderFn === "function":
        {
          // @ts-expect-error: hard to type
          const result = renderFn(this.#context);
          this.#context.rendered.push(...result);
        }
        break;

      case !this.#context.data:
        {
          for (const template of Object.values(this.#context.templates)) {
            const content = await this.#renderer.renderString({ template: template.content, data: {} });
            const savePath = await this.#renderer.renderString({ template: template.relative, data: {} });

            this.#context.rendered.push({ content, path: path.resolve(this.out, savePath) });
          }
        }
        break;

      case Array.isArray(this.#context.data):
        {
          for (const data of this.#context.data) {
            for (const template of Object.values(this.#context.templates)) {
              const content = await this.#renderer.renderString({ template: template.content, data });
              const savePath = await this.#renderer.renderString({ template: template.relative, data });

              this.#context.rendered.push({ content, path: path.resolve(this.out, savePath) });
            }
          }
        }
        break;

      case typeof this.#context.data === "object":
        {
          for (const template of Object.values(this.#context.templates)) {
            const content = await this.#renderer.renderString({ template: template.content, data: this.#context.data });
            const savePath = await this.#renderer.renderString({ template: template.relative, data: this.#context.data });

            this.#context.rendered.push({ content, path: path.resolve(this.out, savePath) });
          }
        }
        break;

      default: {
        console.log(
          "Data to render in `.context.data` is not object or array and you didnt provide `renderFn` to `render()` call. So I cant render your stuff...",
        );
      }
    }
  }

  async write(
    callback?: (params: { path: string; content: string; writeFn: (params: { path: string; content: string }) => Promise<void> }) => void | Promise<void>,
  ): Promise<void> {
    if (typeof callback === "function") {
      for (const renderConfig of this.#context.rendered) {
        await callback({ ...renderConfig, writeFn });
      }
      return;
    }

    for (const renderConfig of this.#context.rendered) {
      await writeFn(renderConfig);
    }
  }
}

async function writeFn({ path, content }: { path: string; content: string }): Promise<void> {
  try {
    await mkdir(dirname(path), { recursive: true });
  } catch (error) {
    console.error({ path, content, error });
  }
  await writeFile(path, new TextEncoder().encode(content), {});
}
