import { Freshable } from "./freshable.ts";
import { ensureDirSync, existsSync, sha1 } from "../deps.ts";

const ID: string = "MsOIJ39Q28";
const SECRET: string = "PTDc3H8a)Vi=UYap";
const USER_AGENT: string = "iFunny/6.20.1(21471) Android";
const URLENCODED: any = { "Content-Type": "application/x-www-form-urlencoded" };

const HEX_SIZE: number = 16;

//deno-fmt-ignore
const HEX_POOL: string[] = [
  "A", "B", "C",
  "D", "E", "F",
  "1", "2", "3", "4", "5",
  "6", "7", "8", "9", "0",
];

interface args_client {
  prefix?: string | string[] | ((it: any) => string) | ((it: any) => string[]);
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

interface args_update_profile {
  about?: string;
  birth_date?: string; // YYYY-MM-DD
  is_private?: boolean | number; // sent as an int representing a bool
  nick?: string;
  sex?: string; // male, female, other
}

interface args_post_image {
  tags?: string[];
  type?: string;
  visibility?: string;
  // separate because these are ifunnyjs options
  timeout?: number;
  wait?: boolean;
}

interface post_image_task_result {
  cid: string;
}

interface post_image_response {
  id: string;
  result?: post_image_task_result;
  retry_after?: number;
  state: string;
  type: string;
}

function qs_string(data: { [key: string]: any }): string {
  return Object
    .entries(data)
    .map((it: [string, any]): string => {
      const key: string = encodeURIComponent(it[0]);
      const value: string = encodeURIComponent(
        it[1].toString ? it[1].toString() : `${it[1]}`,
      );

      return `${key}=${value}`;
    }).join("&");
}

async function sleep(delay: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * iFunny Client, representing a logged user or guest
 * and handling their session
 * @extends {Freshable}
 * @param {args_client}  args
 * Optional constructor arguments
 * @param {string | string[] | (it: any) => string (it: any) => string[]} args.prefix
 * Prefix that the bot should use. It should be a string, list of strings,
 * or function that returns either of those.
 * If it is a function, it will be called with the candidate message
 * @param {number} args.page_size
 * The number of items to get at once when paginating
 * @param {number} notification_interval
 * Time in ms to wait between notification checks, if checking for notifications
 */
export class Client extends Freshable {
  private bearer_token: string = "";
  private config_cache: any = undefined;
  private config_file: string = "config.json";
  private config_root: string;
  private token_expires: number = 0;
  readonly path: string = "/account";

  constructor(args: args_client = {}) {
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

  /**
   * Log into an iFunny account
   * @param   {string}  email
   * Email address associated with the account
   * @param   {string}  password=undefined
   * Password locking the account
   * May be omitted if relying on a cached auth
   * @param   {boolean} fresh=false
   * Force a fresh auth from iFunny?
   * If true, password must be included
   * @return  {Client}
   * this
   */
  async login(
    email: string,
    password?: string,
    fresh?: boolean,
  ): Promise<this> {
    const data: login_data = {
      grant_type: "password",
      password: password ?? "",
      username: email,
    };

    const from_config: string | undefined = this.get_config(`bearer ${email}`);
    if (!fresh && from_config !== undefined) {
      this.bearer_token = from_config as string;
      return this;
    }

    const response: login_response = await this.request_json(
      "/oauth2/token",
      { method: "POST", body: qs_string(data), headers: URLENCODED, raw: true },
    );

    this.bearer_token = response.access_token;
    this.token_expires = response.expires_in;

    this.set_config(`bearer ${email}`, this.bearer_token);
    return this;
  }

  /**
   * Upload an image or video
   * @param   {Blob}      args.data
   * Image data to post as a Blob
   * @param   {string[]}  args.tags=[]
   * Tags to associate with this image
   * @param   {string}    args.type=pic
   * Type of media being uploaded
   * @param   {string}    args.visibility=public
   * Visibility of the post, can be public or subscribers
   * @param   {number}    args.timeout=14
   * Time in seconds to wait for the upload, if args.wait
   * @param   {boolean}   args.wait=false
   * Wait for the post to be created and return it?
   * @return  {string}
   * The pending upload id if not args.wait,
   * otherwise the content id of the uploaded post
   */
  async post_image(data: Blob, args: args_post_image = {}): Promise<string> {
    const form: FormData = new FormData();
    form.append("image", data, "image.png");
    form.append("tags", JSON.stringify(args?.tags ?? []));
    form.append("type", args?.type ?? "pic");
    form.append("visibility", args?.visibility ?? "public");

    let response: post_image_response = await this.request_json(
      "/content",
      { method: "POST", body: form },
    );

    if (!args.wait) {
      return response.id;
    }

    let timeout = (args?.timeout || 15) * 2;
    while (timeout-- >= 0) {
      response = await this.request_json(`/tasks/${response.id}`);

      if (response.result !== undefined) {
        // TODO make a post
        return response.result!.cid;
      }

      await sleep(500);
    }

    throw new Error(`Timeout waiting to post ${response.id}`);
  }

  /**
   * Set the newbie status of this client's basic token
   * This will fail if called on an authed client
   * This is called with state=false when a fresh basic is generated
   * @param   {Boolean} state
   * Should this token be set as a newbie?
   * @return  {Client}
   * this
   */
  async set_newbie(state: boolean): Promise<this> {
    await this.request_json(
      "/clients/me",
      { method: "PUT", data: qs_string({ newbie: state }) },
    );

    return this;
  }

  /**
   * Update profile data
   * @param   {string}          args.about
   * account about section
   * @param   {string}          args.birth_date
   * birth date of the user in YYYY-MM-DD
   * Cannot be unset
   * @param   {boolean|number}  args.is_private
   * should this profile be private? Not settable in the app
   * @param   {string}          args.nick
   * account nickname
   * @param   {string}          args.sex
   * sex of the user, one of female, male, other
   * Cannot be unset
   * @return  {Client}
   * this
   */
  async update_profile(args: args_update_profile): Promise<this> {
    if (typeof args.is_private === "boolean") {
      args.is_private = args.is_private === true ? 1 : 0;
    }

    await this.request_json(
      "/account",
      { method: "PUT", body: qs_string(args), headers: URLENCODED },
    );

    return this;
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

      await this.set_newbie(false);
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
    return this.bearer_token;
  }

  get about(): Promise<string> {
    return this.get("about");
  }

  /**
   * about section
   * @type {Promise<string>}
   */
  get bans(): Promise<any[]> {
    return this.get("bans");
  }

  /**
   * cover photo background color
   * @type Promise<number>
   */
  get cover_color(): Promise<number> {
    return this.get(
      "cover_bg_color",
      { default: "ffffff", transformer: (it: string) => Number(it) },
    );
  }

  get can_chat(): Promise<boolean> {
    return this.get("is_available_for_chat");
  }

  // TODO use Image class
  /**
   * cover photo url
   * @type Promise<string>
   */
  get cover_url(): Promise<string> {
    return this.get("cover_url");
  }

  /**
   * registered email address
   * @type Promise<string>
   */
  get email(): Promise<string> {
    return this.get("email");
  }

  get has_unnotified_achievements(): Promise<boolean> {
    return this.get("have_unnotified_achievements");
  }

  get has_unnotified_bans(): Promise<boolean> {
    return this.get("have_unnotified_bans");
  }

  get has_unnotified_levels(): Promise<boolean> {
    return this.get("have_unnotified_levels");
  }

  get has_unnotified_strikes(): Promise<boolean> {
    return this.get("have_unnotified_strikes");
  }

  get is_banned(): Promise<boolean> {
    return this.get("is_banned");
  }

  get is_blocked_in_messenger(): Promise<boolean> {
    return this.get("is_blocked_in_messenger");
  }

  get is_deleted(): Promise<boolean> {
    return this.get("is_deleted");
  }

  get is_ifunny_team_member(): Promise<boolean> {
    return this.get("is_ifunny_team_member");
  }

  get is_moderator(): Promise<boolean> {
    return this.get("is_moderator");
  }

  get is_private(): Promise<boolean> {
    return this.get("is_private");
  }

  get is_verified(): Promise<boolean> {
    return this.get("is_verified");
  }

  get is_safe_mode(): Promise<boolean> {
    return this.get("safe_mode");
  }

  // TODO getters for individual fields
  // or use a class
  get meme_experience(): Promise<any> {
    return this.get("meme_experience");
  }

  get messaging_privacy(): Promise<string> {
    return this.get("messaging_privacy_status");
  }

  get messenger_active(): Promise<boolean> {
    return this.get("messenger_active");
  }

  get need_account_setup(): Promise<boolean> {
    return this.get("need_account_setup");
  }

  get nick(): Promise<string> {
    return this.get("nick");
  }

  get achievement_count(): Promise<number> {
    return this.get("num", { transformer: (it: any) => it.achievements ?? 0 });
  }

  get created_count(): Promise<number> {
    return this.get("num", { transformer: (it: any) => it.created ?? 0 });
  }

  get featured_count(): Promise<number> {
    return this.get("num", { transformer: (it: any) => it.featured ?? 0 });
  }

  get subscriber_count(): Promise<number> {
    return this.get("num", { transformer: (it: any) => it.subscribers ?? 0 });
  }

  get subscription_count(): Promise<number> {
    return this.get("num", { transformer: (it: any) => it.subscriptions ?? 0 });
  }

  get post_count(): Promise<number> {
    return this.get("num", { transformer: (it: any) => it.total_posts ?? 0 });
  }

  get smile_count(): Promise<number> {
    return this.get("num", { transformer: (it: any) => it.total_smiles ?? 0 });
  }

  get original_nick(): Promise<string> {
    return this.get("original_nick");
  }

  // TODO Image class
  get photo(): Promise<any> {
    return this.get("photo");
  }

  get web_url(): Promise<string> {
    return this.get("web_url");
  }

  get sex(): Promise<string | null> {
    return this.get("sex", { default: null });
  }

  get birth_date(): Promise<string | null> {
    return this.get("birth_date", { default: null });
  }
}
