# Vercel Cron Job Configuration

This document explains how the cron job is configured for the Juridical Message Bot.

## Key Configuration Points

1. **Endpoint Configuration**
   - The cron job calls the `/send-message` endpoint
   - The endpoint handler accepts both GET and POST methods since Vercel cron jobs use GET

2. **Cron Schedule**
   - Schedule is set to `00 12 * * 1-5` (12:00 UTC on weekdays)
   - This corresponds to 9:00 AM BRT (UTC-3) on weekdays

3. **Routes Configuration**
   - Route `/send-message` maps to `/api/index.js`
   - This ensures proper handling of both manual calls and cron job calls

## Vercel Cron Jobs Important Notes

- Vercel cron jobs always use **UTC timezone**
- Cron jobs send **GET requests** (not POST)
- Jobs require proper routes configuration in `vercel.json`
- Jobs cannot include authentication headers in requests
- Execution might be delayed by a few minutes but should run within a reasonable timeframe

## Troubleshooting

If the cron job isn't working:

1. Check Vercel dashboard logs to verify cron execution attempts
2. Verify that the endpoint works via manual GET request
3. Ensure all environment variables are properly configured in Vercel
4. Make sure the application is correctly deployed and the function is accessible
