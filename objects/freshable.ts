import { Client } from "./client.ts";
import { APIError } from "./error.ts";

export const PAGE_DEFAULT: number = 30;

interface args_constructor {
  client?: Client;
  data?: any;
  no_client?: boolean;
  page_size?: number;
}

interface args_get {
  default?: any;
  transformer?: (it: any) => any;
}

export class Freshable {
  private _client: Client | undefined = undefined; // TODO
  private data_cache: any;
  protected update: boolean = false;
  readonly api: string = "https://api.ifunny.mobi/v4";
  readonly id: string;
  readonly page_size: number;
  readonly path: string = "/";

  constructor(id: string | number | null, args: args_constructor = {}) {
    this.id = id as string;
    this.data_cache = args.data ?? {};
    this.page_size = args.page_size ?? PAGE_DEFAULT;

    if (args.no_client !== true) {
      this._client = args.client ?? new Client(); // TODO
    }
  }

  async get(key: string, args: args_get = {}) {
    let value: any = (await this.data)[key];

    if (value === undefined) {
      value = (await this.fresh.data)[key];
    }

    return args.transformer
      ? await args.transformer!(value ?? args.default)
      : value ?? args.default;
  }

  async request(path: string, args: any = {}): Promise<Response> {
    return await fetch(
      `${this.api}${path}`,
      {
        ...args,
        headers: {
          ...(await this.headers),
          ...(args.headers || {}),
        },
      },
    );
  }

  async request_json(path: string, args: any = {}): Promise<any> {
    const data: any = await (await this.request(path, args)).json();
    if (data.error !== undefined) {
      throw new APIError(
        `${data.error}: ${data.error_description ?? "No error_description"}`,
      );
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
      if (this.update) {
        this.update = false;
        this.data_cache = await this.request_json(this.path);
      }

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
