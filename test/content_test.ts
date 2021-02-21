import {
  assertEquals,
  assertNotEquals,
  assertThrowsAsync,
  v4,
} from "../deps.ts";

import { APIError, Client, Comment, Content } from "../mod.ts";

const EMAIL: string | undefined = Deno.env.get("IFUNNYJS_EMAIL");
const PASSWORD: string | undefined = Deno.env.get("IFUNNYJS_PASSWORD");
const NO_AUTH: boolean = Deno.env.get("IFUNNYJS_NO_AUTH") !== undefined;

const CONTENT_ID_PIN: string = "mave1lj07"; // pinned by test@gastrodon.io
let CONTENT_ID: string = "5VRu6KHI7";
let CLIENT: Client | undefined = undefined;

if (EMAIL) {
  CLIENT = (await (new Client()).login(EMAIL!)).fresh;
} else if (PASSWORD && !NO_AUTH) {
  CLIENT = (await (new Client()).login(EMAIL!, PASSWORD!)).fresh;
}

async function random_content(): Promise<Content> {
  // TODO this will pull from collective
  // when collective is implemented
  return new Content(CONTENT_ID, { client: CLIENT! });
}

Deno.test({
  name: "modify smiles",
  ignore: CLIENT === undefined,
  async fn() {
    const content: Content = await random_content();
    const smiles: number = (await content.get("num")).smiles;

    await content.smile();
    assertEquals((await content.fresh.get("num")).smiles, smiles + 1);

    await content.remove_smile();
    assertEquals((await content.fresh.get("num")).smiles, smiles);
  },
});

Deno.test({
  name: "modify unsmiles",
  ignore: CLIENT === undefined,
  async fn() {
    const content: Content = await random_content();
    const unsmiles: number = (await content.get("num")).unsmiles;

    await content.unsmile();
    assertEquals((await content.fresh.get("num")).unsmiles, unsmiles + 1);

    await content.remove_unsmile();
    assertEquals((await content.fresh.get("num")).unsmiles, unsmiles);
  },
});

Deno.test({
  name: "modify repub",
  ignore: CLIENT === undefined,
  async fn() {
    const content: Content = await random_content();
    const republished: number = (await content.get("num")).republished;

    await content.republish();
    assertEquals((await content.fresh.get("num")).republished, republished + 1);

    await content.remove_republish();
    assertEquals((await content.fresh.get("num")).republished, republished);
  },
});

Deno.test({
  name: "modify repub",
  ignore: CLIENT === undefined,
  async fn() {
    const content: Content = await random_content();
    const republished: Content = await content.republish();

    assertNotEquals(content.id, republished.id);

    await content.remove_republish();
  },
});

Deno.test({
  name: "set tags",
  ignore: CLIENT === undefined,
  async fn() {
    let data: Blob = new Blob([await Deno.readFile("./test/test.png")]);
    let content: Content = await CLIENT!.upload_content(
      data,
      { wait: true },
    ) as Content;

    let tags: string[] = [
      v4.generate().replaceAll("-", ""),
      v4.generate().replaceAll("-", ""),
    ];

    await content.set_tags(tags);

    assertEquals(await content.fresh.get("tags"), tags);

    await content.set_tags([]);

    assertEquals(await content.fresh.get("tags"), []);

    await content.delete();
  },
});

Deno.test({
  name: "delete",
  ignore: CLIENT === undefined,
  async fn() {
    let data: Blob = new Blob([await Deno.readFile("./test/test.png")]);
    let content: Content = await CLIENT!.upload_content(
      data,
      { wait: true },
    ) as Content;

    assertNotEquals(await content.fresh.data, {});

    await content.delete();

    await assertThrowsAsync(
      async () => {
        await content.fresh.data;
      },
      APIError,
      "not_found",
    );
  },
});

Deno.test({
  name: "add comment",
  ignore: CLIENT === undefined,
  async fn() {
    const content: Content = await random_content();
    const text: string = `real content ${v4.generate().slice(8)}`;
    const comment: Comment = await content.add_comment({ text });

    assertNotEquals("000000000000000000000000", comment.id);
    assertEquals(content.id, await comment.get("cid"));
  },
});

Deno.test({
  name: "add comment attachment",
  ignore: CLIENT === undefined,
  async fn() {
    const text: string = `real attached content ${v4.generate().slice(8)}`;
    const content: Content = await random_content();
    const comment: Comment = await content.add_comment({
      text,
      content: CONTENT_ID_PIN,
    });

    assertNotEquals("000000000000000000000000", comment.id);

    const attachment: any = (await comment.get("attachments")).content[0];
    assertNotEquals(undefined, attachment);
    assertEquals(CONTENT_ID_PIN, attachment.id);
  },
});

Deno.test({
  name: "add comment mention",
  ignore: CLIENT === undefined,
  async fn() {
    const nick: string = "gastrodon";
    const text: string = `${nick} ${v4.generate().slice(8)}`;
    const content: Content = await random_content();
    const id: string = await content.get(
      "creator",
      { transformer: (it: any) => it.id },
    );

    const comment: Comment = await content.add_comment({
      text,
      mentions: [{ id, start: 0, stop: nick.length }],
    });

    assertNotEquals("000000000000000000000000", comment.id);

    const attachment: any = (await comment.get("attachments")).mention_user[0];
    assertNotEquals(undefined, attachment);
    assertEquals(comment.id, attachment.id);
    assertEquals(id, attachment.user_id);
  },
});
