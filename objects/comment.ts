import { Freshable } from "./freshable.ts";
import { constructor } from "./interfaces/freshable.ts";

export class Comment extends Freshable {
  private content_id: string;

  constructor(id: string, content_id: string, args: constructor = {}) {
    super(id, args);

    this.content_id = content_id;
    this.path = `/content/${this.content_id}/comments/${this.id}`;
  }

  get data(): Promise<any> {
    return (async () => {
      return (await super.data).comment;
    })();
  }
}
