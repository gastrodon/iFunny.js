import { Client } from "./client.ts";

export const PAGE_DEFAULT: number = 30;

interface args_constructor {
  client?: Client;
  data?: any;
  no_client?: boolean;
  page_size?: number;
}

interface args_get {
  default: any;
  transformer?: (it: any) => any;
}

export class Freshable {
  private data_cache: any;
  private update: boolean = false;
  private _client: Client | undefined = undefined; // TODO
  readonly api: string = "https://api.ifunny.mobi/v4";
  readonly id: string;
  readonly page_size: number;
  readonly uri: string = "/";

  constructor(id: string | number | null, args: args_constructor = {}) {
    this.id = id as string;
    this.data_cache = args.data ?? {};
    this.page_size = args.page_size ?? PAGE_DEFAULT;

    if (args.no_client !== true) {
      this._client = args.client ?? new Client(); // TODO
    }
  }

  async get(key: string, args: args_get = { default: null }) {
    let value: any = (await this.data)[key];

    if (!value) {
      value = (await this.fresh.data)[key];
    }

    return args.transformer
      ? await args.transformer!(value ?? args.default)
      : value ?? args.default;
  }

  async request(path: string, args: any = {}): Promise<any> {
    const response: Response = await fetch(
      `${this.api}${path}`,
      {
        ...args,
        headers: {
          ...(await this.headers),
          ...(args.headers || {}),
        },
      },
    );

    const body_text: string = await response.text();

    try {
      return JSON.parse(body_text);
    } catch (err) {
      if (err instanceof SyntaxError) {
        return body_text;
      }

      throw err;
    }
  }

  get client(): Client {
    if (this._client === undefined) {
      throw new Error("no client to return");
    }

    return this._client!;
  }

  get data(): Promise<any> {
    return (async () => {
      return this.data_cache;
    })();
  }

  get fresh(): Freshable {
    this.update = true;
    return this;
  }

  get headers(): Promise<any> {
    if (this._client === undefined) {
      return (async () => {
        return {};
      })();
    }

    return this.client.headers;
  }
}
