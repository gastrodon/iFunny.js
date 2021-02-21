export interface add_comment {
  text?: string;
  content?: string; // content id
  mentions?: add_comment_mention[];
  // this can be done manually,
  // but it's really here for mentions to marshal into
  user_mentions?: string;
}

export interface add_comment_mention {
  id: string;
  start: number;
  stop: number;
}

export interface constructor {
  prefix?: string | string[] | ((it: any) => string) | ((it: any) => string[]);
  page_size?: number;
  notification_interval?: number;
}

export interface login {
  grant_type: string;
  password: string;
  username: string;
}

export interface upload_content {
  publish_at?: number; // future Unix timestamp
  tags?: string[];
  type?: string;
  visibility?: string;
  // separate because these are ifunnyjs options
  timeout?: number;
  wait?: boolean;
}

export interface update_profile {
  about?: string;
  birth_date?: string; // YYYY-MM-DD
  is_private?: boolean | number; // sent as an int representing a bool
  nick?: string;
  sex?: string; // male, female, other
}
