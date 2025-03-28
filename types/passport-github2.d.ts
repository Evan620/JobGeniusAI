/**
 * Type definitions for passport-github2
 */

declare module 'passport-github2' {
  import { Strategy as PassportStrategy } from 'passport';
  
  export interface Profile {
    id: string;
    displayName: string;
    username?: string;
    profileUrl?: string;
    emails?: Array<{ value: string; primary?: boolean; verified?: boolean }>;
    photos?: Array<{ value: string }>;
    provider: string;
    _raw: string;
    _json: any;
  }
  
  export interface StrategyOptions {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
    scope?: string[] | string;
    userAgent?: string;
    authorizationURL?: string;
    tokenURL?: string;
    customHeaders?: object;
  }
  
  export interface StrategyOptionsWithRequest extends StrategyOptions {
    passReqToCallback: true;
  }
  
  export type VerifyFunction = (
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: any, user?: any, info?: any) => void
  ) => void;
  
  export type VerifyFunctionWithRequest = (
    req: any,
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: any, user?: any, info?: any) => void
  ) => void;
  
  export class Strategy extends PassportStrategy {
    constructor(
      options: StrategyOptions,
      verify: VerifyFunction
    );
    constructor(
      options: StrategyOptionsWithRequest,
      verify: VerifyFunctionWithRequest
    );
    
    name: string;
    authenticate(req: any, options?: any): void;
  }
}