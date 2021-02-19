export interface add_comment {
  text?: string;
  attachment?: string; // content id
  // mentions?: any[]; // I don't know yet
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
