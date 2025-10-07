# Testing Web Search Feature

This guide helps you test the new web search capability.

---

## 🧪 Test Scenarios

### Test 1: Regular Email (No Web Search Needed)

**Send this email**:
```
To: mail@llmbox.pro
Subject: Hello
Body: Can you help me understand how email works?
```

**Expected**:
- ✅ Response received
- ✅ Log shows `usedWebSearch: false`
- ✅ Response is based on LLM knowledge

---

### Test 2: Current Events (Web Search Triggered)

**Send this email**:
```
To: mail@llmbox.pro
Subject: Latest AI News
Body: What are the latest developments in AI as of October 2025?
```

**Expected**:
- ✅ Response received
- ✅ Log shows `usedWebSearch: true`
- ✅ Response includes current information
- ✅ Response may include citations/sources

---

### Test 3: Real-Time Data

**Send this email**:
```
To: mail@llmbox.pro
Subject: Current Weather
Body: What's the weather like in San Francisco right now?
```

**Expected**:
- ✅ Response received
- ✅ Log shows `usedWebSearch: true`
- ✅ Response includes current weather data

---

### Test 4: Web Search Disabled

**Setup**:
```bash
supabase secrets set ENABLE_WEB_SEARCH=false --project-ref nopocimtfthppwssohty
deno task deploy
```

**Send this email**:
```
To: mail@llmbox.pro
Subject: Latest News
Body: What's happening in the world today?
```

**Expected**:
- ✅ Response received
- ✅ Log shows `webSearchEnabled: false`
- ✅ Response is based on LLM knowledge cutoff date
- ✅ No web search performed

---

## 📊 Checking Logs

### View Logs in Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/nopocimtfthppwssohty/logs/edge-functions
2. Look for these events:
   - `openai_api_called` - Shows `webSearchEnabled: true/false`
   - `web_search_enabled` - Confirms web search is available
   - `openai_api_response_received` - Shows `usedWebSearch: true/false`

### Example Log Output

**With Web Search**:
```json
{
  "event": "openai_api_called",
  "messageId": "<msg@example.com>",
  "model": "gpt-4o-mini",
  "webSearchEnabled": true
}

{
  "event": "web_search_enabled",
  "messageId": "<msg@example.com>"
}

{
  "event": "openai_api_response_received",
  "messageId": "<msg@example.com>",
  "model": "gpt-4o-mini",
  "tokenCount": 1234,
  "usedWebSearch": true,
  "responseLength": 567
}
```

**Without Web Search**:
```json
{
  "event": "openai_api_called",
  "messageId": "<msg@example.com>",
  "model": "gpt-4o-mini",
  "webSearchEnabled": true
}

{
  "event": "openai_api_response_received",
  "messageId": "<msg@example.com>",
  "model": "gpt-4o-mini",
  "tokenCount": 456,
  "usedWebSearch": false,
  "responseLength": 234
}
```

---

## ✅ Success Criteria

### Functional Tests

- [ ] Regular emails work (no web search)
- [ ] Current events trigger web search
- [ ] Web search can be disabled via config
- [ ] Response times are acceptable (< 30s)
- [ ] All responses are professional and accurate

### Technical Tests

- [ ] Logs show `webSearchEnabled` status
- [ ] Logs show `usedWebSearch` when triggered
- [ ] No errors in Supabase logs
- [ ] Token counts are reasonable
- [ ] Error handling works (if web search fails)

---

## 🐛 Troubleshooting

### Web Search Not Working

**Check**:
1. `ENABLE_WEB_SEARCH=true` in environment
2. Model is `gpt-4o` or `gpt-4o-mini`
3. OpenAI API key is valid
4. Logs show `web_search_enabled` event

**Fix**:
```bash
# Verify environment variable
supabase secrets list --project-ref nopocimtfthppwssohty

# Set if missing
supabase secrets set ENABLE_WEB_SEARCH=true --project-ref nopocimtfthppwssohty

# Redeploy
deno task deploy
```

### Web Search Always Triggers

**Explanation**: This is normal! The LLM decides when web search is needed. If you want to reduce usage:

1. Adjust system instructions in `llmClient.ts`
2. Or disable web search entirely: `ENABLE_WEB_SEARCH=false`

### Increased Latency

**Explanation**: Web search adds 2-5 seconds to response time. This is expected behavior.

**Monitor**:
- Check `completionTimeMs` in logs
- Look for `usedWebSearch: true` correlation

---

## 📈 Performance Expectations

| Scenario | Expected Time | Token Usage |
|----------|--------------|-------------|
| Regular email (no search) | 2-5 seconds | 200-500 tokens |
| With web search | 5-10 seconds | 500-1500 tokens |
| Complex query + search | 10-15 seconds | 1000-2000 tokens |

---

## 🎯 Next Steps After Testing

1. ✅ Verify all test scenarios pass
2. ✅ Monitor logs for 24 hours
3. ✅ Check OpenAI usage dashboard for costs
4. ✅ Adjust `ENABLE_WEB_SEARCH` if needed
5. ✅ Update documentation with findings

---

## 📞 Support

If you encounter issues:

1. Check [OPENAI-MIGRATION.md](./OPENAI-MIGRATION.md) for detailed info
2. Review [TROUBLESHOOTING-401.md](./docs/TROUBLESHOOTING-401.md)
3. Check Supabase logs for error details
4. Verify all environment variables are set correctly

---

**Happy Testing!** 🚀
