declare module 'passport-linkedin-oauth2' {
  import { Strategy as PassportStrategy } from 'passport';

  export class Strategy extends PassportStrategy {
    constructor(
      options: {
        clientID: string;
        clientSecret: string;
        callbackURL: string;
        scope?: string[] | string;
        state?: boolean;
      },
      verify: (
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: (error: any, user?: any, info?: any) => void
      ) => void
    );
  }
}