import { args_freshable, Freshable } from "./freshable.ts";

export class Content extends Freshable {
    constructor(id: string, args: args_freshable = {}) {
        super(id, args)

        this.path = `/content/${this.id}`
    }
}
