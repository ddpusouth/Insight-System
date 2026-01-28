# Email Setup Guide (OAuth2)

## Prerequisites

1. **Google Cloud Project**: You need a project with the Gmail API enabled.
2. **OAuth Credentials**: Client ID and Client Secret.

## Environment Variables

Your `backend/.env` file should have the following Gmail OAuth2 configuration:

```env
# Email Configuration (Gmail OAuth2)
GMAIL_CLIENT_ID=your_client_id
GMAIL_CLIENT_SECRET=your_client_secret
GMAIL_REDIRECT_URI=https://developers.google.com/oauthplayground
GMAIL_REFRESH_TOKEN=your_refresh_token
EMAIL_USER=your-email@gmail.com
```

## How to Get a Refresh Token

If you are getting `invalid_grant` errors, your refresh token has expired or is invalid.

1. Run the helper script:
   ```bash
   cd backend/scripts
   node get_refresh_token.js
   ```
2. Follow the instructions to visit the URL and authorize the app.
3. Paste the code back into the terminal.
4. Copy the new Refresh Token.
5. Update `GMAIL_REFRESH_TOKEN` in your `.env` file.
6. Restart the server.

## Common Issues

- **invalid_grant**: The refresh token is invalid. Retrieve a new one using the steps above.
- **redirect_uri_mismatch**: Ensure the `GMAIL_REDIRECT_URI` in `.env` matches exactly what is configured in your Google Cloud Console credentials.
