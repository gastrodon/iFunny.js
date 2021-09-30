import { assertEquals } from "../deps.ts";

import { Client, Comment } from "../mod.ts";

import {
  CLIENT,
  COMMENT_ID,
  CONTENT_ID,
  EMAIL,
  NO_AUTH,
  PASSWORD,
} from "./const.ts";

import { json } from "../objects/interfaces/request.ts";

async function random_comment(): Promise<Comment> {
  // TODO this will also pull from collective
  // when collective is implemented
  return new Comment(COMMENT_ID, CONTENT_ID, { client: CLIENT! });
}

Deno.test({
  name: "data at root",
  ignore: CLIENT === undefined,
  async fn() {
    const data: json = await (await random_comment()).fresh.data;

    assertEquals(data.comment, undefined);
  },
});
