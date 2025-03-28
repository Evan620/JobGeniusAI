import passport from 'passport';
import { Strategy as LinkedInStrategy } from 'passport-linkedin-oauth2';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as LocalStrategy } from 'passport-local';
import { User, InsertUser } from '@shared/schema';
import { storage } from '../storage';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { Request, Response, NextFunction } from 'express';

const scryptAsync = promisify(scrypt);

/**
 * Hash a password for secure storage
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

/**
 * Compare a plaintext password with its hashed version for authentication
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  const [hashed, salt] = hash.split('.');
  const hashedBuf = Buffer.from(hashed, 'hex');
  const suppliedBuf = (await scryptAsync(password, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

/**
 * Sets up all authentication strategies
 */
export function setupAuth(app: any) {
  app.use(passport.initialize());
  app.use(passport.session());

  // Local Strategy (username + password)
  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      console.log(`Attempting to authenticate user: ${username}`);
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        console.log(`User not found: ${username}`);
        return done(null, false, { message: 'Incorrect username or password' });
      }
      
      const isValid = await comparePassword(password, user.password);
      
      if (!isValid) {
        console.log(`Invalid password for user: ${username}`);
        return done(null, false, { message: 'Incorrect username or password' });
      }
      
      console.log(`User authenticated successfully: ${username}`);
      return done(null, user);
    } catch (err) {
      console.error('Authentication error:', err);
      return done(err);
    }
  }));

  // LinkedIn Strategy
  if (process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET) {
    passport.use(new LinkedInStrategy({
      clientID: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      callbackURL: "/auth/linkedin/callback",
      scope: ['r_emailaddress', 'r_liteprofile'],
      state: true
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        console.log(`LinkedIn login attempt for profile ID: ${profile.id}`);
        
        // Check if user exists by LinkedIn ID
        let user = await storage.getUserByEmail(profile.emails?.[0]?.value || '');
        
        if (user) {
          // Update LinkedIn tokens
          user = await storage.updateUser(user.id, {
            linkedinId: profile.id,
            linkedinAccessToken: accessToken,
            linkedinRefreshToken: refreshToken || null
          });
          console.log(`Updated existing user with LinkedIn data: ${user.username}`);
        } else {
          // Create new user from LinkedIn profile
          const newUser: InsertUser = {
            username: `linkedin_${profile.id}`,
            password: await hashPassword(randomBytes(16).toString('hex')),
            name: profile.displayName,
            email: profile.emails?.[0]?.value || `${profile.id}@linkedin.user`,
            profilePicture: profile.photos?.[0]?.value || null,
            linkedinId: profile.id,
            linkedinAccessToken: accessToken,
            linkedinRefreshToken: refreshToken || null
          };
          
          user = await storage.createUser(newUser);
          console.log(`Created new user from LinkedIn: ${user.username}`);
        }
        
        return done(null, user);
      } catch (err) {
        console.error('LinkedIn authentication error:', err);
        return done(err as Error);
      }
    }));
  }

  // GitHub Strategy
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    passport.use(new GitHubStrategy({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: "/auth/github/callback",
      scope: ['user:email']
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        console.log(`GitHub login attempt for profile ID: ${profile.id}`);
        
        // Get primary email from GitHub
        const primaryEmail = profile.emails?.find(e => e.primary)?.value || 
                            profile.emails?.[0]?.value;
        
        if (!primaryEmail) {
          console.log('GitHub account has no accessible email');
          return done(null, false, { message: 'No email found in GitHub profile' });
        }
        
        // Check if user exists by GitHub ID or email
        let user = await storage.getUserByEmail(primaryEmail);
        
        if (user) {
          // Update GitHub tokens
          user = await storage.updateUser(user.id, {
            githubId: profile.id,
            githubAccessToken: accessToken,
            githubRefreshToken: refreshToken || null
          });
          console.log(`Updated existing user with GitHub data: ${user.username}`);
        } else {
          // Create new user from GitHub profile
          const newUser: InsertUser = {
            username: profile.username || `github_${profile.id}`,
            password: await hashPassword(randomBytes(16).toString('hex')),
            name: profile.displayName || profile.username || 'GitHub User',
            email: primaryEmail,
            profilePicture: profile.photos?.[0]?.value || null,
            githubId: profile.id,
            githubAccessToken: accessToken,
            githubRefreshToken: refreshToken || null
          };
          
          user = await storage.createUser(newUser);
          console.log(`Created new user from GitHub: ${user.username}`);
        }
        
        return done(null, user);
      } catch (err) {
        console.error('GitHub authentication error:', err);
        return done(err as Error);
      }
    }));
  }

  // Session serialization
  passport.serializeUser((user: User, done) => {
    console.log(`Serializing user: ${user.id}`);
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      console.log(`Deserializing user: ${id}`);
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      console.error('Error deserializing user:', err);
      done(err, null);
    }
  });
}

// Middleware to ensure a user is authenticated
export function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Not authenticated' });
}