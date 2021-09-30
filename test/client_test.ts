import {
  assert,
  assertEquals,
  assertNotEquals,
  assertThrowsAsync,
  v1,
  v4,
} from "../deps.ts";

import { APIError, Client, Content } from "../mod.ts";

import {
  BASIC_SIZE,
  CLIENT,
  CONFIG_ROOT,
  EMAIL,
  HOME,
  NO_AUTH,
  PASSWORD,
} from "./const.ts";

async function sleep(delay: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delay));
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
    const client: Client = new Client();
    const basic: string = await client.fresh.basic;

    assertEquals(basic.length, BASIC_SIZE);
  },
});

Deno.test({
  name: "basic stored",
  async fn() {
    const client: Client = new Client();
    const basic: string = await client.fresh.basic;

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

// WARNING: fresh auth
Deno.test({
  name: "login",
  ignore: EMAIL === "" || PASSWORD === "" || NO_AUTH,
  async fn() {
    const client: Client = new Client();
    await client.login(EMAIL!, PASSWORD!, true);
    const headers: any = await client.headers;

    assertEquals(headers.authorization, `Bearer ${client.token}`);
  },
});

// WARNING: fresh auth
Deno.test({
  name: "login fresh token",
  ignore: EMAIL === "" || PASSWORD === "" || NO_AUTH,
  async fn() {
    const client: Client = new Client();
    await client.login(EMAIL!, PASSWORD!, true);
    const headers: any = await client.headers;

    assertEquals(headers.authorization, `Bearer ${client.token}`);
  },
});

// WARNING: fresh auth
Deno.test({
  name: "login bad email",
  ignore: NO_AUTH,
  async fn() {
    const client: Client = new Client();
    await client.fresh.basic;

    await assertThrowsAsync(
      async () => {
        await client.login(`${v4.generate()}@kaffir.io`, v4.generate());
      },
      APIError,
      "invalid_grant",
    );
  },
});

// WARNING: fresh auth
Deno.test({
  name: "login bad password",
  ignore: EMAIL === undefined || NO_AUTH,
  async fn() {
    const client: Client = new Client();
    await client.fresh.basic;

    await assertThrowsAsync(
      async () => {
        await client.login(EMAIL!, v4.generate(), true);
      },
      APIError,
      "invalid_grant",
    );
  },
});

Deno.test({
  name: "login stored",
  ignore: EMAIL === undefined,
  async fn() {
    const client: Client = new Client();
    await client.login(EMAIL!);

    assertNotEquals(client.token, "");
  },
});

Deno.test({
  name: "update_profile about",
  ignore: CLIENT === undefined,
  async fn() {
    const about: string = v4.generate();
    await CLIENT!.update_profile({ about });

    assertEquals(about, await CLIENT!.fresh.about);
  },
});

Deno.test({
  name: "update_profile birth_date",
  ignore: CLIENT === undefined,
  async fn() {
    const year: number = 1922 + Math.floor(Math.random() * 78); // year 1922 -> 2000
    const month: number = 10 + Math.floor(Math.random() * 2); // month 10 -> 12
    const day: number = 10 + Math.floor(Math.random() * 17); // day 10 -> 28
    const birth_date: string = `${year}-${month}-${day}`;
    await CLIENT!.update_profile({ birth_date });

    assertEquals(birth_date, await CLIENT!.fresh.get("birth_date"));
  },
});

Deno.test({
  name: "update_profile is_private",
  ignore: CLIENT === undefined,
  async fn() {
    await CLIENT!.update_profile({ is_private: true });
    assertEquals(true, await CLIENT!.fresh.is_private);

    await CLIENT!.update_profile({ is_private: false });
    assertEquals(false, await CLIENT!.fresh.is_private);
  },
});

Deno.test({
  name: "update_profile nick",
  ignore: CLIENT === undefined,
  async fn() {
    const nick_restore: string = await CLIENT!.nick;
    const nick: string = v4.generate().replaceAll("-", "").substring(20);
    await CLIENT!.update_profile({ nick });

    try {
      assertEquals(nick, await CLIENT!.fresh.nick);
    } finally {
      await CLIENT!.update_profile({ nick: nick_restore });
    }
  },
});

Deno.test({
  name: "update_profile sex",
  ignore: CLIENT === undefined,
  async fn() {
    let sex: string = "male";
    await CLIENT!.update_profile({ sex });

    assertEquals(sex, await CLIENT!.fresh.sex);

    sex = "female";
    await CLIENT!.update_profile({ sex });

    assertEquals(sex, await CLIENT!.fresh.sex);
  },
});

Deno.test({
  name: "set_newbie",
  async fn() {
    await (new Client()).set_newbie(false);
    await (new Client()).set_newbie(true);
  },
});

Deno.test({
  name: "upload_content",
  ignore: CLIENT === undefined,
  async fn() {
    let data: Blob = new Blob([await Deno.readFile("./test/test.png")]);
    let id: string = await CLIENT!.upload_content(data) as string;

    assertEquals(v1.validate(id), true);
  },
});

Deno.test({
  name: "upload_content wait",
  ignore: CLIENT === undefined,
  async fn() {
    let data: Blob = new Blob([await Deno.readFile("./test/test.png")]);
    let content: Content = await CLIENT!.upload_content(
      data,
      { wait: true },
    ) as Content;

    assertNotEquals(await content.id, "");
    await content.delete();
  },
});

Deno.test({
  name: "getter about",
  ignore: CLIENT === undefined,
  async fn() {
    assert(await CLIENT!.about);
  },
});

Deno.test({
  name: "getter cover_color",
  ignore: CLIENT === undefined,
  async fn() {
    assert(await CLIENT!.cover_color <= 0xFFFFFF);
    assert(await CLIENT!.cover_color >= 0);
  },
});

Deno.test({
  name: "getter can_chat",
  ignore: CLIENT === undefined,
  async fn() {
    assert(await CLIENT!.can_chat);
  },
});

Deno.test({
  name: "getter cover_url",
  ignore: CLIENT === undefined,
  async fn() {
    assert(await CLIENT!.cover_url);
  },
});

Deno.test({
  name: "getter email",
  ignore: CLIENT === undefined,
  async fn() {
    assertEquals(await CLIENT!.email, EMAIL!);
  },
});

Deno.test({
  name: "getter has_unnotified_bans",
  ignore: CLIENT === undefined,
  async fn() {
    assertNotEquals(await CLIENT!.has_unnotified_bans, undefined);
  },
});

Deno.test({
  name: "getter has_unnotified_levels",
  ignore: CLIENT === undefined,
  async fn() {
    assertNotEquals(await CLIENT!.has_unnotified_levels, undefined);
  },
});

Deno.test({
  name: "getter has_unnotified_strikes",
  ignore: CLIENT === undefined,
  async fn() {
    assertNotEquals(await CLIENT!.has_unnotified_strikes, undefined);
  },
});

Deno.test({
  name: "getter is_banned",
  ignore: CLIENT === undefined,
  async fn() {
    assertEquals(await CLIENT!.is_banned, false);
  },
});

Deno.test({
  name: "getter is_blocked_in_messenger",
  ignore: CLIENT === undefined,
  async fn() {
    assertEquals(await CLIENT!.is_blocked_in_messenger, false);
  },
});

Deno.test({
  name: "getter is_deleted",
  ignore: CLIENT === undefined,
  async fn() {
    assertEquals(await CLIENT!.is_deleted, false);
  },
});

Deno.test({
  name: "getter is_ifunny_team_member",
  ignore: CLIENT === undefined,
  async fn() {
    assertEquals(await CLIENT!.is_ifunny_team_member, false);
  },
});

Deno.test({
  name: "getter is_moderator",
  ignore: CLIENT === undefined,
  async fn() {
    assertEquals(await CLIENT!.is_moderator, false);
  },
});

Deno.test({
  name: "getter is_private",
  ignore: CLIENT === undefined,
  async fn() {
    assertEquals(await CLIENT!.is_private, false);
  },
});

Deno.test({
  name: "getter is_verified",
  ignore: CLIENT === undefined,
  async fn() {
    assertEquals(await CLIENT!.is_verified, false);
  },
});

Deno.test({
  name: "getter is_safe_mode",
  ignore: CLIENT === undefined,
  async fn() {
    assertEquals(await CLIENT!.is_safe_mode, false);
  },
});

Deno.test({
  name: "getter meme_experience",
  ignore: CLIENT === undefined,
  async fn() {
    assert(await CLIENT!.meme_experience);
  },
});

Deno.test({
  name: "getter messaging_privacy",
  ignore: CLIENT === undefined,
  async fn() {
    assertEquals(await CLIENT!.messaging_privacy, "public");
  },
});

Deno.test({
  name: "getter messaging_privacy",
  ignore: CLIENT === undefined,
  async fn() {
    assert(await CLIENT!.messaging_privacy);
  },
});

Deno.test({
  name: "getter need_account_setup",
  ignore: CLIENT === undefined,
  async fn() {
    assertEquals(await CLIENT!.need_account_setup, false);
  },
});

Deno.test({
  name: "getter nick",
  ignore: CLIENT === undefined,
  async fn() {
    assert(await CLIENT!.nick);
  },
});

Deno.test({
  name: "getter achievement_count",
  ignore: CLIENT === undefined,
  async fn() {
    assert(await CLIENT!.achievement_count);
  },
});

Deno.test({
  name: "getter created_count",
  ignore: CLIENT === undefined,
  async fn() {
    assert(await CLIENT!.created_count >= 0);
  },
});

Deno.test({
  name: "getter featured_count",
  ignore: CLIENT === undefined,
  async fn() {
    assert(await CLIENT!.featured_count >= 0);
  },
});

Deno.test({
  name: "getter subscriber_count",
  ignore: CLIENT === undefined,
  async fn() {
    assert(await CLIENT!.subscriber_count >= 0);
  },
});

Deno.test({
  name: "getter subscription_count",
  ignore: CLIENT === undefined,
  async fn() {
    assert(await CLIENT!.subscription_count >= 0);
  },
});

Deno.test({
  name: "getter post_count",
  ignore: CLIENT === undefined,
  async fn() {
    assert(await CLIENT!.post_count >= 0);
  },
});

Deno.test({
  name: "getter smile_count",
  ignore: CLIENT === undefined,
  async fn() {
    assert(await CLIENT!.smile_count >= 0);
  },
});

Deno.test({
  name: "getter photo",
  ignore: CLIENT === undefined,
  async fn() {
    assert(await CLIENT!.photo); // TODO Image class
  },
});

Deno.test({
  name: "getter web_url",
  ignore: CLIENT === undefined,
  async fn() {
    assertEquals(
      await CLIENT!.web_url,
      `https://ifunny.co/user/${await CLIENT!.nick}`,
    );
  },
});

Deno.test({
  name: "getter sex",
  ignore: CLIENT === undefined,
  async fn() {
    assertNotEquals(await CLIENT!.sex, undefined);
  },
});

Deno.test({
  name: "getter birth_date",
  ignore: CLIENT === undefined,
  async fn() {
    assertNotEquals(await CLIENT!.birth_date, undefined);
  },
});
