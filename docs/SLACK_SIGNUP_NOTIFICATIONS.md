## Slack Signup Notifications

This repo sends Slack notifications when:
- a **user** signs up (triggered in `ProfileCreationModal` after successful signup)
- a **company** signs up (triggered in `CompanySignup` and the magic-link continuation in `CompanyLayout`)

### Supabase Secrets (required)
Set these in Supabase Dashboard → **Project Settings → Edge Functions → Secrets**
- `SLACK_WEBHOOK_USER` = Slack Incoming Webhook URL for user signups
- `SLACK_WEBHOOK_COMPANY` = Slack Incoming Webhook URL for company signups

Optional (for Dashboard test invoke without login):
- `SLACK_TEST_SECRET` = shared secret for `test` calls (only used when `test=true`)

### Edge Function
Function name: `slack-signup-notify`

It requires an authenticated request (it checks the `Authorization` header).

### Test (recommended)
In Supabase Dashboard → **Edge Functions → `slack-signup-notify` → Invoke**

**User test**
```json
{
  "kind": "user",
  "test": true,
  "test_secret": "<SLACK_TEST_SECRET>",
  "source": "manual-test",
  "user": {
    "firstName": "Test",
    "lastName": "Nutzer",
    "industry": "pflege",
    "zip": "10115",
    "city": "Berlin",
    "status": "Fachkraft"
  }
}
```

**Company test**
```json
{
  "kind": "company",
  "test": true,
  "test_secret": "<SLACK_TEST_SECRET>",
  "source": "manual-test",
  "company": {
    "companyName": "Test GmbH",
    "industry": "handwerk",
    "zip": "20095",
    "city": "Hamburg",
    "employeeCount": "1-10",
    "website": "https://example.com",
    "contactPerson": {
      "firstName": "Max",
      "lastName": "Mustermann",
      "email": "max@example.com",
      "phone": "+49 170 0000000"
    }
  }
}
```


