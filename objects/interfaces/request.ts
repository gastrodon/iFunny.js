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
