# 🎉 Deployment Complete!

## Application Successfully Deployed

**Application ID:** `76a60e819936e7e475293b97d8ae9fd2f5b45b37332fb968fe5d1a3abd832a29`

## What's Been Configured

✅ **Linera Application Deployed** to local network  
✅ **Environment Variables** configured:
   - `backend/.env` - Application ID and network settings
   - `frontend/.env.local` - Application ID for frontend

## Next Steps

### 1. Verify Your Deployment

Check your application is running:
```bash
# In WSL
linera query application 76a60e819936e7e475293b97d8ae9fd2f5b45b37332fb968fe5d1a3abd832a29
```

### 2. Access GraphQL IDE

Your Linera application's GraphQL interface is available at:
```
http://localhost:8080/
```

### 3. Test Your Application

**Start Backend:**
```bash
cd backend
npm install  # If not already done
npm start
```

**Start Frontend:**
```bash
cd frontend
npm install  # If not already done
npm run dev
```

### 4. Test Queries via GraphQL

You can test your application directly via the GraphQL IDE at `http://localhost:8080/`:

```graphql
query {
  getSignals(limit: 10, offset: 0) {
    id
    influencer
    token
    sentiment
    confidence
  }
}
```

Or using curl:
```bash
curl -X POST http://localhost:8080/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ getSignals(limit: 10, offset: 0) { id token sentiment } }"}'
```

## Environment Variables Summary

### Backend (`backend/.env`)
- `LINERA_APP_ID` - Your deployed application ID
- `LINERA_NETWORK` - Set to "local"
- `LINERA_RPC_URL` - Local network endpoint

### Frontend (`frontend/.env.local`)
- `NEXT_PUBLIC_LINERA_APP_ID` - Application ID (exposed to browser)
- `NEXT_PUBLIC_LINERA_NETWORK` - Set to "local"
- `NEXT_PUBLIC_API_URL` - Backend API endpoint

## Important Notes

1. **Local Network Lifetime:** Your wallet and application are only valid while `linera net up` is running. If you stop it, you'll need to redeploy.

2. **Network Address:** The local network uses:
   - Storage: Built-in with `linera net up`
   - Validator: `http://localhost:13001`
   - GraphQL: `http://localhost:8080`

3. **Application ID:** Save this ID - you'll need it whenever you reference your deployed application:
   ```
   76a60e819936e7e475293b97d8ae9fd2f5b45b37332fb968fe5d1a3abd832a29
   ```

## Testing Your Deployment

### Test Signal Submission

```bash
# Using Linera CLI
linera service query-mutation \
  --query 'mutation { executeOperation(operation: "{\"SubmitSignal\":{\"signal\":{\"influencer\":\"test\",\"token\":\"SOL\",\"contract\":\"So11111111111111111111111111111111111111112\",\"sentiment\":\"positive\",\"confidence\":0.8,\"timestamp\":1699999999,\"tweet_url\":\"https://twitter.com/test/123\"}}}") }'
```

Or via your backend API (once running).

## Troubleshooting

**"Application not found"**
- Make sure `linera net up` is still running in Terminal 1
- Verify the application ID is correct

**"GraphQL not responding"**
- Check that the GraphQL service is accessible at `http://localhost:8080`
- Verify the network is fully initialized (wait 30-60 seconds after `linera net up`)

**Frontend can't connect**
- Ensure `NEXT_PUBLIC_LINERA_APP_ID` is set correctly in `frontend/.env.local`
- Check browser console for connection errors
- Verify the Linera network is accessible from your browser (localhost)

## Success Checklist

- [x] Application deployed to local network
- [x] Application ID captured and saved
- [x] Environment variables configured
- [ ] Test GraphQL queries
- [ ] Test signal submission
- [ ] Test frontend connection
- [ ] Verify backend integration

## What to Do Next

1. **Test the deployment** using the GraphQL IDE
2. **Start your backend** and test API endpoints
3. **Start your frontend** and verify it connects to Linera
4. **Test the full flow**: Submit a signal → Create a strategy → Execute trades

Congratulations! Your Linera application is now deployed and ready to use! 🚀

