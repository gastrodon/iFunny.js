import { Freshable } from "./freshable.ts";
import { post_content_republish_response } from "./interfaces/request.ts";
import { constructor } from "./interfaces/freshable.ts";

export class Content extends Freshable {
  constructor(id: string, args: constructor = {}) {
    super(id, args);

    this.path = `/content/${this.id}`;
  }

  // on any content

  async smile(): Promise<this> {
    await this.client.content_set_smile(this.id, true);
    return this;
  }

  async remove_smile(): Promise<this> {
    await this.client.content_set_smile(this.id, false);
    return this;
  }

  async unsmile(): Promise<this> {
    await this.client.content_set_unsmile(this.id, true);
    return this;
  }

  async remove_unsmile(): Promise<this> {
    await this.client.content_set_unsmile(this.id, false);
    return this;
  }

  // on non owned content

  async republish(): Promise<Content> {
    const data: post_content_republish_response = await this.client
      .content_set_republish(this.id, true);

    return new Content(data.id!, { client: this.client });
  }

  async remove_republish(): Promise<this> {
    await this.client.content_set_republish(this.id, false);
    return this;
  }

  // on owned content

  async delete(): Promise<this> {
    await this.client.content_delete(this.id);
    return this;
  }

  async set_tags(tags: string[]): Promise<this> {
    await this.client.content_set_tags(this.id, tags);
    return this;
  }
}
