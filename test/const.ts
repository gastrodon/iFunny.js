import { Client } from "../mod.ts";

export const EMAIL: string = Deno.env.get("IFUNNYJS_EMAIL") ?? "";
export const PASSWORD: string = Deno.env.get("IFUNNYJS_PASSWORD") ?? "";

export const NO_AUTH: boolean = Deno.env.get("IFUNNYJS_NO_AUTH") !== undefined;

export const BASIC_SIZE: number = 168;

export const COMMENT_ID: string = "602f4bb55d82992e3275511e";
export const CONTENT_ID: string = "5VRu6KHI7";
export const CONTENT_ID_PIN: string = "mave1lj07";

export const HOME: string = Deno.env.get("HOME") ?? "";
export const CONFIG_ROOT: string = HOME + "/.config/ifunny";

if (HOME === "") {
  throw new Error("HOME must be set");
}

export let CLIENT: Client | undefined = undefined;

if (EMAIL) {
  CLIENT = (await (new Client()).login(EMAIL!)).fresh;
} else if (PASSWORD && !NO_AUTH) {
  CLIENT = (await (new Client()).login(EMAIL!, PASSWORD!)).fresh;
}
