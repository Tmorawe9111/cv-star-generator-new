declare module "next/server" {
  export interface NextResponseInit {
    status?: number;
  }

  export class NextResponse {
    static json(body: any, init?: NextResponseInit): NextResponse;
  }
}
