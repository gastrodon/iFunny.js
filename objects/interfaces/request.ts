export interface json {
  [key: string]: string | number | boolean | null | json | json[];
}

export interface post_content_comment_response {
  id: string;
  comment: json;
}

interface post_content_task_result {
  cid: string;
}

export interface post_content_response {
  id: string;
  result?: post_content_task_result;
  retry_after?: number;
  state: string;
  type: string;
}

export interface post_content_republish_response {
  id?: string;
  num_republished: number;
}

export interface post_login_response {
  access_token: string;
  token_type: string;
  expires_in: number;
}
