import { Freshable } from "./freshable.ts";
import { ensureDirSync, existsSync, sha1 } from "../deps.ts";

const ID: string = "MsOIJ39Q28";
const SECRET: string = "PTDc3H8a)Vi=UYap";
const USER_AGENT: string = "iFunny/6.20.1(21471) Android";

const HEX_SIZE: number = 16;

//deno-fmt-ignore
const HEX_POOL: string[] = [
  "A", "B", "C",
  "D", "E", "F",
  "1", "2", "3", "4", "5",
  "6", "7", "8", "9", "0",
];

interface args_constructor {
  prefix?: string | string[] | ((it: any) => string) | ((it: any) => string[])
  page_size?: number;
  notification_interval?: number;
}

interface login_data {
  grant_type: string;
  password: string;
  username: string;
}

interface login_response {
  access_token: string;
  token_type: string;
  expires_in: number;
}

async function sleep(delay: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * iFunny Client, representing a logged user or guest
 * and handling their session
 * @extends {Freshable}
 * @param {args_constructor}  opts
 * Optional constructor arguments
 * @param {string | string[] | (it: any) => string (it: any) => string[]} opts.prefix
 * Prefix that the bot should use. It should be a string, list of strings,
 * or function that returns either of those.
 * If it is a function, it will be called with the candidate message
 * @param {number} opts.page_size
 * The number of items to get at once when paginating
 * @param {number} notification_interval
 * Time in ms to wait between notification checks, if checking for notifications
 */
export class Client extends Freshable {
  private _token: string = "";
  private config_cache: any = undefined;
  private config_file: string = "config.json";
  private config_root: string;
  private token_expires: number = 0;
  readonly path: string = "/account";

  constructor(args: args_constructor = {}) {
    super("", { no_client: true, ...args });

    this.config_root = `${Deno.env.get("HOME") ?? "/root"}/.config/ifunny`;
    ensureDirSync(this.config_root);
  }

  private set_config(key: string, value: string): any {
    this.config = { ...this.config, [key]: value };
    return this.config_cache;
  }

  private get_config(key: string): string | undefined {
    return this.config[key] ?? undefined;
  }

  async login(email: string, password?: string, fresh: boolean = false) {
    const data: login_data = {
      grant_type: "password",
      password: password ?? "",
      username: email,
    };

    const response: login_response = await this.request_json(
      "/oauth2/token",
      {
        method: "POST",
        body: Object.entries(data).map((it) => `${it[0]}=${it[1]}`).join("&"),
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      },
    );

    this._token = response.access_token;
    this.token_expires = response.expires_in;
    return this.fresh;
  }

  private get config(): any {
    if (this.config_cache === undefined) {
      if (!existsSync(this.config_path)) {
        Deno.writeTextFileSync(this.config_path, "{}");
      }

      this.config_cache = JSON.parse(Deno.readTextFileSync(this.config_path));
    }

    return this.config_cache;
  }

  private set config(data: any) {
    this.config_cache = data;
    Deno.writeTextFileSync(this.config_path, JSON.stringify(data));
  }

  private get config_path(): string {
    return `${this.config_root}/${this.config_file}`;
  }

  get basic(): Promise<string> {
    return (async (): Promise<string> => {
      if (this.get_config("basic_token") !== undefined && !this.update) {
        return this.get_config("basic_token") as string;
      }

      let generated: string = "";

      for (let index: number = 0; index != 72; index++) {
        generated += HEX_POOL[Math.floor(Math.random() * HEX_SIZE)];
      }

      const hash: string = sha1(
        `${generated}:${ID}:${SECRET}`,
        "utf8",
        "hex",
      ) as string;
      const basic: string = btoa(`${generated}_${ID}:${hash}`);

      this.update = false;
      this.set_config(`basic_token`, basic);

      await (await this.request("/counters")).body?.cancel();
      await sleep(10_000);
      return basic;
    })();
  }

  get client(): Client {
    return this;
  }

  get headers(): Promise<any> {
    return (async (): Promise<any> => {
      return {
        "user-agent": USER_AGENT,
        "authorization": this.token
          ? `Bearer ${this.token}`
          : `Basic ${await this.basic}`,
      };
    })();
  }

  get token(): string {
    return this._token;
  }
}
