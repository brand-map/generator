# @brand-map/generator

A powerful file generation library that creates files from templates using template engines like Vento or Handlebars.

## Installation

```bash
npm install -D @brand-map/generator
# or
bun add -D @brand-map/generator
```

## Quick Start

```typescript
import { Genrator } from "@brand-map/generator";
import { loadTemplates } from "@brand-map/generator";

const generator = new Genrator({
  out: "./components/ui",
  cwd: process.cwd(),
})
  .addContext(await loadTemplates("./templates"))
  .addContext({ data: [{ name: "Button" }, { name: "Input" }, { name: "Text" }] });

await generator.render();
await generator.write();
```

## API Reference

### `Genrator`

The main class for generating files from templates.

#### Constructor

```typescript
new Genrator(config?: {
  engine?: "vento" | "handlebars";   // Default: "vento"
  out?: string;                      // Default: process.cwd()
  cwd?: string;                      // Default: process.cwd()
})
```

**Parameters:**

- `engine` - The template engine to use. Options: `"vento"` (default) or `"handlebars"`
- `out` - The directory where generated files will be written
- `cwd` - The current working directory for resolving relative paths

#### Methods

##### `addContext(setter)`

Adds context data to the generator. Can be called multiple times to merge context.

**Parameters:**

- `setter` - Either an object to merge into context, or a function that receives the current context and returns a partial context object

**Returns:** The generator instance (for chaining)

**Example:**

```typescript
// Using an object
generator.addContext({ data: [{ name: "Button" }] });

// Using a function
generator.addContext(() => ({ data: [{ name: "Button" }] }));
generator.addContext((ctx) => ({ data: { isDark: ctx.theme === "dark" } }));

// loadTemplates is a special actions that returns callback
generator.addContext(await loadTemplates("./templates"));
```

##### `render(renderFn?)`

Renders templates with the provided context data.

**Parameters:**

- `renderFn` (optional) - A custom function that receives the context and returns an array of `{ path: string; content: string }` objects. If not provided, the generator will automatically render all templates.

**Behavior:**

- If `renderFn` is provided, it will be used to generate the rendered files
- If `context.data` is an array, each template will be rendered once for each item in the array
- If `context.data` is an object, each template will be rendered once with that object
- If `context.data` is not set, templates will be rendered with an empty data object

**Returns:** `Promise<void>`

##### `write(callback?)`

Writes the rendered files to disk.

**Parameters:**

- `callback` (optional) - A function that receives `{ path, content, writeFn }` for each rendered file. If provided, you can customize the write behavior. If not provided, files are written automatically.

**Returns:** `Promise<void>`

### `loadTemplates(templatesPath)`

Loads template files from a directory.

**Parameters:**

- `templatesPath` - The path to the directory containing template files

**Returns:** `Promise<(ctx: Record<string, any>) => { templates: Record<string, TemplateData> }>`

**Behavior:**

- Recursively walks the directory tree
- Skips files and directories that start with `_` (underscore)
- Automatically strips `.hbs` and `.vto` extensions from relative paths
- Returns a setter function that can be passed to `addContext()`

**Template File Naming:**

- Template file paths can contain template expressions (e.g., `{{name |> kebabCase}}.vto`)
- Files starting with `_` are ignored (useful for partials or examples)
- Supported extensions: `.vto` (Vento), `.hbs` (Handlebars)

## Usage Examples

### Basic Usage

```typescript
import { Genrator, loadTemplates } from "@brand-map/generator";

const generator = new Genrator({
  out: "./output",
})
  .addContext(await loadTemplates("./templates"))
  .addContext({
    data: [{ name: "Button" }, { name: "Input" }],
  });

await generator.render();
await generator.write();
```

### Using Handlebars Engine

```typescript
const generator = new Genrator({
  engine: "handlebars",
  out: "./output",
})
  .addContext(await loadTemplates("./templates"))
  .addContext({ data: { name: "Component" } });

await generator.render();
await generator.write();
```

### Custom Render Function

```typescript
await generator.render((ctx) => {
  return ctx.templates.map((template) => ({
    path: `custom/${template.relative}`,
    content: template.content,
  }));
});
```

### Custom Write Function

```typescript
await generator.write(async ({ path, content, writeFn }) => {
  // Custom logic before writing
  console.log(`Writing to ${path}`);

  // Use the provided writeFn or implement custom logic
  await writeFn({ path, content });
});
```

## Template Examples

### Vento Template

```vento
{{ "<h1>Hello, world!</h1>" |> safe }}

{{ name |> constantCase }}
```

### Dynamic File Paths

Template files can have dynamic paths that are rendered based on context data:

- `{{name |> kebabCase}}.vto` - Creates files like `button.ts`, `input.ts`
- `{{name |> constantCase}}/index.ts.vto` - Creates directories and files

## Context Structure

The generator maintains a context object with the following structure:

```typescript
{
  templates: Record<string, TemplateData>; // Loaded templates
  data: unknown; // Your data (object or array)
  rendered: Array<{
    // Rendered files
    path: string;
    content: string;
  }>;
}
```
