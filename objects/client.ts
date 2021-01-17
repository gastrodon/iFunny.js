import { Freshable } from "./freshable.ts";
import { sha1 } from "../deps.ts";

const ID: string = "MsOIJ39Q28";
const SECRET: string = "PTDc3H8a)Vi=UYap";
const USER_AGENT: string = "iFunny/6.20.1(21471) iphone/14.2 (Apple; iPhone8,1)";

const HEX_SIZE: number = 16;
const HEX_POOL: string[] = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "0",
];

interface args_constructor {
  prefix?: string;
  reconnect?: boolean;
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

export class Client extends Freshable {
  private token: string = "";
  private token_expires: number = 0;

  constructor(args: args_constructor = {}) {
    super("", { no_client: true, ...args });
  }

  async login(email: string, password?: string, fresh: boolean = false) {
    const data: login_data = {
      grant_type: "password",
      password: password ?? "",
      username: email,
    };

    const response: login_response = await this.request(
      "/oauth2/token",
      {
        method: "POST",
        body: Object.entries(data).map((it) => `${it[0]}=${it[1]}`).join("&"),
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      },
    );

    this.token = response.access_token;
    this.token_expires = response.expires_in;
    return response;
  }

  get basic(): Promise<string> {
    return (async (): Promise<string> => {
      // TODO read stored basic
      let generated: string = "";

      for (let index: number = 0; index != 72; index++) {
        generated += HEX_POOL[Math.floor(Math.random() * HEX_SIZE)];
      }

      // TODO store new basic
      const hash: string = sha1(
        `${generated}:${ID}:${SECRET}`,
        "utf8",
        "hex",
      ) as string;
      return btoa(`${generated}_${ID}:${hash}`);
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
}
