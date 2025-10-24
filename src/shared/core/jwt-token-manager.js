/**
 * JWT Token Manager with disguised token format
 * 
 * This manager generates JWT tokens but disguises them to look like random strings
 * by using Base64 URL-safe encoding. This maintains backward compatibility with
 * existing token formats while providing stateless JWT benefits.
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class JWTTokenManager {
  constructor(config = {}) {
    // Use environment variable or provided secret
    this.secret = config.jwtSecret || process.env.JWT_SECRET || this.generateDefaultSecret();
    this.accessTokenExpiry = config.accessTokenExpiry || '1h';
    this.refreshTokenExpiry = config.refreshTokenExpiry || '30d';
    
    // Warn if using default secret
    if (!process.env.JWT_SECRET && !config.jwtSecret) {
      console.warn('[JWT] WARNING: Using default JWT secret. Set JWT_SECRET environment variable in production!');
    }
  }

  /**
   * Generate a default secret (for development only)
   */
  generateDefaultSecret() {
    return 'dewu-mock-api-default-secret-change-in-production-' + crypto.randomBytes(16).toString('hex');
  }

  /**
   * Disguise JWT token to look like a random string
   * Converts standard JWT format to a URL-safe base64 string
   */
  disguiseToken(jwtToken) {
    // Remove JWT dots and encode to base64url
    const buffer = Buffer.from(jwtToken);
    return buffer.toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Reveal JWT token from disguised format
   */
  revealToken(disguisedToken) {
    try {
      // Add padding if needed
      let base64 = disguisedToken
        .replace(/-/g, '+')
        .replace(/_/g, '/');
      
      while (base64.length % 4) {
        base64 += '=';
      }
      
      const buffer = Buffer.from(base64, 'base64');
      return buffer.toString('utf8');
    } catch (error) {
      throw new Error('Invalid token format');
    }
  }

  /**
   * Generate Access Token (disguised JWT)
   */
  generateAccessToken(payload) {
    const jwtToken = jwt.sign(
      {
        open_id: payload.open_id,
        scope: payload.scope || ['all'],
        type: 'access'
      },
      this.secret,
      {
        expiresIn: this.accessTokenExpiry,
        issuer: 'dewu-mock-api',
        subject: payload.open_id
      }
    );

    // Disguise the JWT to look like a random string
    return this.disguiseToken(jwtToken);
  }

  /**
   * Generate Refresh Token (disguised JWT)
   */
  generateRefreshToken(payload) {
    const jwtToken = jwt.sign(
      {
        open_id: payload.open_id,
        type: 'refresh'
      },
      this.secret,
      {
        expiresIn: this.refreshTokenExpiry,
        issuer: 'dewu-mock-api',
        subject: payload.open_id
      }
    );

    // Disguise the JWT to look like a random string
    return this.disguiseToken(jwtToken);
  }

  /**
   * Validate Access Token (stateless)
   */
  validateToken(disguisedToken) {
    try {
      // Reveal the JWT from disguised format
      const jwtToken = this.revealToken(disguisedToken);
      
      // Verify JWT
      const decoded = jwt.verify(jwtToken, this.secret);
      
      // Check token type
      if (decoded.type !== 'access') {
        return {
          valid: false,
          error: 'Invalid token type'
        };
      }

      return {
        valid: true,
        tokenData: {
          access_token: disguisedToken,
          open_id: decoded.open_id,
          scope: decoded.scope,
          expires_at: decoded.exp * 1000,  // Convert to milliseconds
          created_at: decoded.iat * 1000
        }
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return {
          valid: false,
          error: 'Access token has expired'
        };
      }
      if (error.name === 'JsonWebTokenError') {
        return {
          valid: false,
          error: 'Invalid access token'
        };
      }
      return {
        valid: false,
        error: error.message || 'Invalid access token'
      };
    }
  }

  /**
   * Validate Refresh Token (stateless)
   */
  validateRefreshToken(disguisedToken) {
    try {
      // Reveal the JWT from disguised format
      const jwtToken = this.revealToken(disguisedToken);
      
      // Verify JWT
      const decoded = jwt.verify(jwtToken, this.secret);
      
      // Check token type
      if (decoded.type !== 'refresh') {
        return {
          valid: false,
          error: 'Invalid token type'
        };
      }

      return {
        valid: true,
        tokenData: {
          open_id: decoded.open_id
        }
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return {
          valid: false,
          error: 'Refresh token has expired'
        };
      }
      return {
        valid: false,
        error: 'Invalid refresh token'
      };
    }
  }

  /**
   * Generate complete token response (compatible with existing format)
   */
  generateTokenResponse(open_id) {
    const accessToken = this.generateAccessToken({ open_id, scope: ['all'] });
    const refreshToken = this.generateRefreshToken({ open_id });

    // Decode to get expiration times (reveal then decode)
    const accessJwt = this.revealToken(accessToken);
    const refreshJwt = this.revealToken(refreshToken);
    const accessDecoded = jwt.decode(accessJwt);
    const refreshDecoded = jwt.decode(refreshJwt);

    const now = Math.floor(Date.now() / 1000);

    return {
      code: 200,
      msg: 'success',
      data: {
        scope: ['all'],
        open_id: open_id,
        access_token: accessToken,
        access_token_expires_in: accessDecoded.exp - now,
        refresh_token: refreshToken,
        refresh_token_expires_in: refreshDecoded.exp - now
      },
      status: 200
    };
  }

  /**
   * Create token (for backward compatibility with old TokenManager interface)
   * This method is kept for compatibility but uses JWT internally
   */
  createToken(access_token, open_id, scope = ['all']) {
    // If access_token is provided, use it as seed for consistent token generation
    // Otherwise generate new token
    const tokenData = {
      access_token: access_token || this.generateAccessToken({ open_id, scope }),
      refresh_token: `refresh_${access_token || this.generateRefreshToken({ open_id })}`,
      open_id,
      scope,
      expires_at: Date.now() + 3600 * 1000,
      created_at: Date.now()
    };

    return tokenData;
  }
}

module.exports = { JWTTokenManager };
