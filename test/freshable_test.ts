import { Freshable } from "../mod.ts";
import { PAGE_DEFAULT } from "../objects/freshable.ts";
import { assertEquals, assertNotEquals, assertThrows, v4 } from "../deps.ts";

Deno.test("construct", async () => {
  const id: string = v4.generate();
  const fresh: Freshable = new Freshable(id);

  assertEquals(fresh.id, id);
  assertEquals(fresh.page_size, PAGE_DEFAULT);
});

Deno.test("data", async () => {
  const data: any = { foo: v4.generate() };
  const fresh: Freshable = new Freshable("", { data });

  assertEquals((await fresh.data)["foo"], data.foo);
});

Deno.test("client", async () => {
  const fresh: Freshable = new Freshable("");

  assertNotEquals(fresh.client, undefined);
});

Deno.test("no client throws", async () => {
  const fresh: Freshable = new Freshable("", { no_client: true });

  assertThrows(
    () => fresh.client,
    Error,
    "no client to return",
  );
});
