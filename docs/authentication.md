# Authentication System

This project supports **three levels of authentication security**:

## 1. 🔓 No Authentication (Public Routes)

```typescript
@Controller('public')
export class PublicController {
  @Get('health')
  getHealth() {
    return { status: 'ok' };
  }
}
```

## 2. 🔐 JWT Authentication (Standard)

- **Use for**: Normal app operations, data fetching, non-sensitive updates
- **Benefits**: Fast, user-friendly, supports sessions

```typescript
@UseGuards(JwtAuthGuard)
@Get('profile')
async getProfile(@Request() req) {
  return req.user;
}
```

**Flow:**

1. User signs a nonce once during login
2. Receives JWT token (valid for 24h)
3. Uses token for subsequent requests

## 3. 🔒 Fresh Signature Required (High Security)

- **Use for**: Financial transactions, sensitive data changes, account modifications
- **Benefits**: Prevents token theft attacks, ensures user presence

```typescript
@UseGuards(CombinedAuthGuard)
@Put('transfer-funds')
async transferFunds(@Body() transferDto: TransferDto) {
  return this.transferService.execute(transferDto);
}
```

**Flow:**

1. User must have valid JWT token
2. **AND** provide fresh Aptos signature for this specific action
3. Double protection against unauthorized access

## API Endpoints

### Authentication Routes

```bash
# 1. Get nonce for signing
POST /auth/nonce
{
  "aptosPublicKey": "0x..."
}

# 2. Register new user
POST /auth/register
{
  "username": "alice",
  "aptosPublicKey": "0x...",
  "nonce": "abc123...",
  "signature": "0x..."
}

# 3. Login existing user
POST /auth/login
{
  "aptosPublicKey": "0x...",
  "nonce": "abc123...",
  "signature": "0x..."
}

# 4. Get current user (requires JWT)
GET /auth/me
Authorization: Bearer <jwt_token>
```

### High Security Operations

For operations requiring fresh signatures, include these fields in request body:

```json
{
  "signatureHex": "0x...",
  "messageHex": "specific message for this action",
  "publicKeyHex": "0x..."
  // ... other request data
}
```

## Why This Hybrid Approach?

| Feature            | Global Middleware     | JWT Only            | Hybrid (Our Choice)          |
| ------------------ | --------------------- | ------------------- | ---------------------------- |
| User Experience    | ❌ Sign every request | ✅ Sign once        | ✅ Sign once + critical ops  |
| Security           | ✅ Always fresh       | ⚠️ Token theft risk | ✅ Best of both              |
| Performance        | ❌ Slow               | ✅ Fast             | ✅ Fast + secure when needed |
| Session Management | ❌ None               | ✅ Full support     | ✅ Full support              |
| Replay Protection  | ✅ With nonces        | ❌ JWT reuse        | ✅ Nonces + JWT              |

## Environment Variables

```bash
JWT_SECRET=your-super-secret-key-change-in-production
DATABASE_URL=mysql://user:pass@localhost:3306/paytos
```
