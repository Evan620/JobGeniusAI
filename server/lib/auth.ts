import passport from 'passport';
import { Strategy as LinkedInStrategy } from 'passport-linkedin-oauth2';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as LocalStrategy } from 'passport-local';
import { User, InsertUser } from '@shared/schema';
import { storage } from '../storage';
import * as bcrypt from 'bcryptjs';

// Define profile interfaces for better type safety
interface OAuthProfile {
  id: string;
  displayName: string;
  username?: string;
  emails?: Array<{ value: string; primary?: boolean }>;
  photos?: Array<{ value: string }>;
  _json?: any;
}

// Utility function to hash passwords
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// Utility function to compare passwords
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Setup passport strategies
export function setupAuth() {
  // Serialize user to session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
  
  // Local Strategy for username/password authentication
  passport.use(new LocalStrategy(
    { usernameField: 'email', passwordField: 'password' },
    async (email, password, done) => {
      try {
        // Find user by email
        const user = await storage.getUserByEmail(email);
        
        if (!user) {
          return done(null, false, { message: 'Invalid email or password' });
        }
        
        // Check if it's an OAuth user without a password
        if (!user.password) {
          return done(null, false, { message: 'Please use social login for this account' });
        }
        
        // Verify password
        const isMatch = await comparePassword(password, user.password);
        
        if (!isMatch) {
          return done(null, false, { message: 'Invalid email or password' });
        }
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  ));

  // LinkedIn Strategy
  passport.use(new LinkedInStrategy({
    clientID: process.env.LINKEDIN_CLIENT_ID!,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
    callbackURL: '/auth/linkedin/callback',
    scope: ['r_emailaddress', 'r_liteprofile'],
    state: true
  }, async (
    accessToken: string, 
    refreshToken: string, 
    profile: OAuthProfile, 
    done: (error: any, user?: any) => void
  ) => {
    console.log('LinkedIn authentication callback received');
    console.log('LinkedIn profile:', JSON.stringify({
      id: profile.id,
      displayName: profile.displayName,
      emails: profile.emails,
      photos: profile.photos
    }, null, 2));
    
    try {
      // Check if the profile has email
      if (!profile.emails || profile.emails.length === 0) {
        console.error('No email found in LinkedIn profile');
        return done(new Error('No email found in LinkedIn profile'));
      }

      const email = profile.emails[0].value;
      console.log('Using email:', email);

      // Check if user already exists
      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        console.log('Creating new user for LinkedIn login');
        // Create new user if not found
        const newUser: InsertUser = {
          name: profile.displayName,
          email: email,
          username: `linkedin_${profile.id}`, // Using prefix to avoid conflicts
          password: '', // Empty password for OAuth users
          profilePicture: profile.photos?.[0]?.value || null,
          linkedinId: profile.id,
          linkedinAccessToken: accessToken,
          linkedinRefreshToken: refreshToken || null,
          githubId: null,
          githubAccessToken: null,
          githubRefreshToken: null
        };
        
        user = await storage.createUser(newUser);
        console.log('Created new user with ID:', user.id);
      } else {
        console.log('Updating existing user:', user.id);
        // Update user with LinkedIn data
        await storage.updateUser(user.id, {
          linkedinId: profile.id,
          linkedinAccessToken: accessToken,
          linkedinRefreshToken: refreshToken || null
        });
      }
      
      return done(null, user);
    } catch (error) {
      console.error('LinkedIn authentication error:', error);
      return done(error as Error);
    }
  }));

  // GitHub Strategy
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    callbackURL: '/auth/github/callback',
    scope: ['user:email']
  }, async (
    accessToken: string, 
    refreshToken: string, 
    profile: OAuthProfile, 
    done: (error: any, user?: any) => void
  ) => {
    console.log('GitHub authentication callback received');
    console.log('GitHub profile:', JSON.stringify({
      id: profile.id,
      displayName: profile.displayName,
      username: profile.username,
      emails: profile.emails,
      photos: profile.photos
    }, null, 2));
    
    try {
      // Get primary email from GitHub
      const primaryEmail = profile.emails?.[0]?.value;
      if (!primaryEmail) {
        console.error('No email found from GitHub profile');
        return done(new Error('No email found from GitHub profile'));
      }
      
      console.log('Using email:', primaryEmail);
      
      // Check if user already exists
      let user = await storage.getUserByEmail(primaryEmail);
      
      if (!user) {
        console.log('Creating new user for GitHub login');
        // Create new user if not found
        const username = profile.username || `github_${profile.id}`;
        console.log('Using username:', username);
        
        const newUser: InsertUser = {
          name: profile.displayName || username,
          email: primaryEmail,
          username: username,
          password: '', // Empty password for OAuth users
          profilePicture: profile.photos?.[0]?.value || null,
          githubId: profile.id,
          githubAccessToken: accessToken,
          githubRefreshToken: refreshToken || null,
          linkedinId: null,
          linkedinAccessToken: null,
          linkedinRefreshToken: null
        };
        
        user = await storage.createUser(newUser);
        console.log('Created new user with ID:', user.id);
      } else {
        console.log('Updating existing user:', user.id);
        // Update user with GitHub data
        await storage.updateUser(user.id, {
          githubId: profile.id,
          githubAccessToken: accessToken,
          githubRefreshToken: refreshToken || null
        });
      }
      
      return done(null, user);
    } catch (error) {
      console.error('GitHub authentication error:', error);
      return done(error as Error);
    }
  }));
}

// Authentication middleware
export function ensureAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
}