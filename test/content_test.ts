import { assertEquals, assertNotEquals } from "../deps.ts";
import { Client, Content } from "../mod.ts";

const EMAIL: string | undefined = Deno.env.get("IFUNNYJS_EMAIL");
const PASSWORD: string | undefined = Deno.env.get("IFUNNYJS_PASSWORD");
const NO_AUTH: boolean = Deno.env.get("IFUNNYJS_NO_AUTH") !== undefined;

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
