import { args_freshable, Freshable } from "./freshable.ts";
import { post_content_republish_response } from "./interfaces/request.ts";

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

  async republish(): Promise<Content> {
    const data: post_content_republish_response = await this.client
      .set_content_republish(this.id, true);

    return new Content(data.id!, { client: this.client });
  }

  async remove_republish(): Promise<this> {
    await this.client.set_content_republish(this.id, false);
    return this;
  }
}
