import {
    assertEquals,
} from "../deps.ts"

import { Comment, Client } from "../mod.ts"

const EMAIL: string | undefined = Deno.env.get("IFUNNYJS_EMAIL");
const PASSWORD: string | undefined = Deno.env.get("IFUNNYJS_PASSWORD");
const NO_AUTH: boolean = Deno.env.get("IFUNNYJS_NO_AUTH") !== undefined;

let COMMENT_ID: string = "602f4bb55d82992e3275511e";
let CONTENT_ID: string = "5VRu6KHI7";
let CLIENT: Client | undefined = undefined;

if (EMAIL) {
  CLIENT = (await (new Client()).login(EMAIL!)).fresh;
} else if (PASSWORD && !NO_AUTH) {
  CLIENT = (await (new Client()).login(EMAIL!, PASSWORD!)).fresh;
}

async function random_comment(): Promise<Comment> {
    // TODO this will also pull from collective
    // when collective is implemented
    return new Comment(COMMENT_ID, CONTENT_ID, { client: CLIENT! });
}
