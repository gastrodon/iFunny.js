import { args_freshable, Freshable } from "./freshable.ts";

export class Content extends Freshable {
  constructor(id: string, args: args_freshable = {}) {
    super(id, args);

    this.path = `/content/${this.id}`;
  }

  async smile(): Promise<this> {
    await this.client.set_content_smile(this.id, true);
    return this;
  }

  async remove_smile(): Promise<this> {
    await this.client.set_content_smile(this.id, false);
    return this;
  }

  async unsmile(): Promise<this> {
    await this.client.set_content_unsmile(this.id, true);
    return this;
  }

  async remove_unsmile(): Promise<this> {
    await this.client.set_content_unsmile(this.id, false);
    return this;
  }
}
