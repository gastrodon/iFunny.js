import { Client } from "../client.ts";

export interface constructor {
  client?: Client;
  data?: any;
  no_client?: boolean;
  page_size?: number;
}

export interface get {
  default?: any;
  transformer?: (it: any) => any;
}
