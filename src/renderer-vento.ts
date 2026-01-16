import vento from "ventojs";

import { textHelpers } from "./lib";
import { RendererAbstract } from "./types";

export class VentoRenderer extends RendererAbstract {
  #env = vento();

  constructor() {
    super();

    for (const [key, fn] of Object.entries(textHelpers)) {
      Object.assign(this.#env.filters, { [key]: fn });
    }
  }

  public override async renderString(params: { template: string; data: Record<string, unknown> }): Promise<string> {
    const result = await this.#env.runString(params.template, params.data);
    return result.content;
  }
}
