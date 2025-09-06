// Load environment variables from the .env file
require('dotenv').config();
const express = require('express');
const jsforce = require('jsforce');

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Initialize jsforce connection object with credentials from .env
const oauth2 = new jsforce.OAuth2({
  loginUrl: process.env.SF_LOGIN_URL,
  clientId: process.env.SF_CLIENT_ID,
  clientSecret: process.env.SF_CLIENT_SECRET,
  redirectUri: process.env.SF_REDIRECT_URI
});

// This will store our active Salesforce connection
let sfConnection;

// This is the first step of the OAuth flow.
// It redirects the user to the Salesforce login page.
app.get('/oauth2/auth', (req, res) => {
  const authUrl = oauth2.getAuthorizationUrl({ scope: 'api id web refresh_token' });
  res.redirect(authUrl);
});

// This is the callback URL that Salesforce redirects to after authentication.
// It receives an authorization 'code' and exchanges it for an access token.
app.get('/oauth/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send('Failed to get authorization code from callback.');
  }

  try {
    // Create a new connection
    sfConnection = new jsforce.Connection({ oauth2: oauth2 });
    
    // Authorize with the code
    await sfConnection.authorize(code);
    
    console.log('Auth successful!');
    console.log('Access Token:', sfConnection.accessToken);
    console.log('Refresh Token:', sfConnection.refreshToken);
    console.log('Instance URL:', sfConnection.instanceUrl);

    // Now, let's test it by fetching the logged-in user's identity
    const identity = await sfConnection.identity();
    console.log('Successfully connected as user:', identity.username);

    res.send(`<h1>Authentication Successful!</h1><p>You have successfully connected to Salesforce as <b>${identity.username}</b>. You can now close this browser tab and return to your terminal.</p>`);
  
  } catch (error) {
    console.error('Salesforce authentication error:', error.message);
    res.status(500).send(`Authentication failed: ${error.message}`);
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  console.log('To begin authentication, navigate to /oauth2/auth on this server.');
});