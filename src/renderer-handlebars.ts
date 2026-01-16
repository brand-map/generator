import handlebars from "handlebars";

import { textHelpers, utilHelpers } from "./lib";
import { RendererAbstract, type Helpers, type Partials } from "./types";

export class HandlebarsRenderer extends RendererAbstract {
  #partials: Partials = {};
  #helpers: Helpers = { ...textHelpers, ...utilHelpers };

  constructor() {
    super();

    for (const [name, helper] of Object.entries(this.#helpers)) {
      handlebars.registerHelper(name, helper);
    }

    for (const [name, partial] of Object.entries(this.#partials)) {
      handlebars.registerPartial(name, partial);
    }
  }

  public override renderString(params: { template: string; data: Record<string, unknown> }): Promise<string> {
    const compiled = handlebars.compile(params.template);

    return Promise.resolve(compiled(params.data));
  }
}
