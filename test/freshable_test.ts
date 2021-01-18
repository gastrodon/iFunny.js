import { Freshable } from "../mod.ts";
import { PAGE_DEFAULT } from "../objects/freshable.ts";
import { assertEquals, assertNotEquals, assertThrows, v4 } from "../deps.ts";

Deno.test({
  name: "construct",
  async fn() {
    const id: string = v4.generate();
    const fresh: Freshable = new Freshable(id);

    assertEquals(fresh.id, id);
    assertEquals(fresh.page_size, PAGE_DEFAULT);
  },
});

Deno.test({
  name: "data",
  async fn() {
    const data: any = { foo: v4.generate() };
    const fresh: Freshable = new Freshable("", { data });

    assertEquals((await fresh.data)["foo"], data.foo);
  },
});

Deno.test({
  name: "client",
  async fn() {
    const fresh: Freshable = new Freshable("");

    assertNotEquals(fresh.client, undefined);
  },
});

Deno.test({
  name: "headers",
  async fn() {
    const fresh: Freshable = new Freshable("");
    const headers: any = await fresh.headers;
    const basic: string = await fresh.client.basic;

    assertEquals(headers.authorization, `Basic ${basic}`);
    assertNotEquals(headers["user-agent"], undefined);
  },
});

Deno.test({
  name: "no client throws",
  async fn() {
    const fresh: Freshable = new Freshable("", { no_client: true });

    assertThrows(
      () => fresh.client,
      Error,
      "no client to return",
    );
  },
});

Deno.test({
  name: "get",
  async fn() {
    const data: any = { foo: v4.generate() };
    const fresh: Freshable = new Freshable("", { data });

    assertEquals(await fresh.get("foo"), data.foo);
  },
});

Deno.test({
  name: "get default",
  async fn() {
    const fresh: Freshable = new Freshable("");
  },
});

Deno.test({
  name: "get transformer",
  async fn() {
    const data: any = { foo: Math.trunc(Math.random() * 100) };
    const fresh: Freshable = new Freshable("", { data });
    const transformer: (it: any) => any = (it: number) => it * 10;

    assertEquals(
      await fresh.get("foo", { transformer }),
      transformer(data.foo),
    );
  },
});
