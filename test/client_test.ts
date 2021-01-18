import {
  assertEquals,
  assertNotEquals,
  assertThrowsAsync,
  emptyDir,
  v4,
} from "../deps.ts";

import { APIError, Client } from "../mod.ts";

const EMAIL: string | undefined = Deno.env.get("IFUNNYJS_EMAIL");
const PASSWORD: string | undefined = Deno.env.get("IFUNNYJS_PASSWORD");
const NO_AUTH: string | undefined = Deno.env.get("IFUNNYJS_NO_AUTH");

const HOME: string | undefined = Deno.env.get("HOME");
const CONFIG_ROOT: string = HOME as string + "/.config/ifunny";

const BASIC_SIZE: number = 168;

if (HOME === undefined) {
  throw new Error("HOME must be set");
}

Deno.test({
  name: "construct",
  async fn() {
    let client: Client = new Client();
  },
});

Deno.test({
  name: "basic",
  async fn() {
    await emptyDir(CONFIG_ROOT);

    const client: Client = new Client();
    const basic: string = await client.basic;

    assertEquals(basic.length, BASIC_SIZE);
  },
});

Deno.test({
  name: "basic stored",
  async fn() {
    await emptyDir(CONFIG_ROOT);

    const client: Client = new Client();
    const basic: string = await client.basic;

    assertEquals(basic, await client.basic);
  },
});

Deno.test({
  name: "basic fresh",
  async fn() {
    const client: Client = new Client();
    const basic: string = await client.basic;
    const basic_fresh: string = await client.fresh.basic;

    assertNotEquals(basic, basic_fresh);
    assertEquals(basic_fresh.length, BASIC_SIZE);
  },
});

Deno.test({
  name: "client",
  async fn() {
    const client: Client = new Client();

    assertEquals(client, client.client);
  },
});

Deno.test({
  name: "login",
  ignore: EMAIL === undefined || PASSWORD === undefined ||
    NO_AUTH !== undefined,
  async fn() {
    await emptyDir(CONFIG_ROOT);

    const client: Client = new Client();
    await client.login(EMAIL!, PASSWORD!);
    const headers: any = await client.headers;

    assertEquals(headers.authorization, `Bearer ${client.token}`);
  },
});

Deno.test({
  name: "login bad email",
  ignore: NO_AUTH !== undefined,
  async fn() {
    const client: Client = new Client();

    await assertThrowsAsync(
      async () => {
        await client.login(`${v4.generate()}@kaffir.io`, v4.generate());
      },
      APIError,
      "invalid_grant: Wrong user credentials",
    );
  },
});

Deno.test({
  name: "login bad password",
  ignore: EMAIL === undefined || NO_AUTH !== undefined,
  async fn() {
    const client: Client = new Client();

    await assertThrowsAsync(
      async () => {
        await client.login(EMAIL!, v4.generate());
      },
      APIError,
      "invalid_grant: Wrong user credentials",
    );
  },
});
