# SRS Quick Reference

## Key Files

| File | Purpose |
|------|---------|
| `lib/srs/algorithm.ts` | SM-2 algorithm implementation |
| `lib/srs/service.ts` | Database operations and business logic |
| `app/api/review/srs/route.ts` | API endpoints for frontend |
| `prisma/schema.prisma` | ReviewCard model definition |

## API Quick Start

### Get pending review cards
```bash
GET /api/review/srs?limit=10
```

### Get just statistics
```bash
GET /api/review/srs?stats=true
```

Response:
```json
{
  "totalCards": 50,
  "dueCards": 5,
  "masteredCards": 20,
  "learningCards": 30
}
```

### Record a review result
```bash
POST /api/review/srs
Content-Type: application/json

{
  "questionId": "cuid123",
  "isCorrect": true,
  "timeSpent": 45
}
```

## Algorithm Reference

### Quality Scoring
| Condition | Quality | Interval |
|-----------|---------|----------|
| Wrong answer | 1 | Reset to 1 day |
| Correct, >2min | 3 | 1 day |
| Correct, 1-2min | 4 | 3 days |
| Correct, <1min | 5 | 7 days |

### Ease Factor Range
- Minimum: 1.3 (very difficult)
- Default: 2.5 (normal)
- Maximum: 5.0 (very easy)

### When is a card "mastered"?
- When its `interval >= 30` days

## Database Schema

```prisma
model ReviewCard {
  id            String   @id
  userId        String   // Who is learning
  questionId    String   // What to learn

  // Algorithm state
  easeFactor    Float    // 1.3-5.0
  interval      Int      // Days until review
  repetitions   Int      // Successful reviews

  // Scheduling
  nextReviewAt  DateTime // When to show next
  lastReviewAt  DateTime?

  // Statistics
  totalReviews  Int      // Total attempts
  correctReviews Int     // Successful attempts
}
```

## Typical Flow

1. User answers question incorrectly
2. `ensureReviewCard()` creates/resets card
3. Card scheduled for tomorrow (1 day)
4. User opens review session
5. `getDueReviewCards()` fetches due cards
6. User reviews card
7. `recordReview()` updates scheduling based on result
8. If correct: interval increases to 3-7-exponential
9. If wrong: reset to 1 day

## Performance Tips

- Use `?stats=true` to check stats without fetching cards
- Review cards are lazy-loaded with questions included
- Composite index `(userId, nextReviewAt)` optimizes queries
- Fire-and-forget integration doesn't block answer flow

## Troubleshooting

### No review cards appearing?
- Check: `SELECT COUNT(*) FROM "ReviewCard" WHERE "nextReviewAt" <= NOW() AND "userId" = '...';`

### Card not updating?
- Verify `questionId` and `userId` match
- Check database for cascade delete issues

### Performance slow?
- Verify indexes exist: `@@index([userId, nextReviewAt])`
- Check: `SELECT COUNT(*) FROM "ReviewCard" WHERE "userId" = '...';`

## Testing

### Test the algorithm locally
```typescript
import { calculateSRS } from '@/lib/srs/algorithm';

// Correct fast answer
const result = calculateSRS(true, 30, 2.5, 1, 0);
console.log(result);
// { easeFactor: 2.6, interval: 1, repetitions: 1, nextReviewAt: Date }
```

### Create test card
```typescript
import { ensureReviewCard } from '@/lib/srs/service';

const card = await ensureReviewCard(userId, questionId, false);
```

### Get test statistics
```typescript
import { getSRSStats } from '@/lib/srs/service';

const stats = await getSRSStats(userId);
// { totalCards: 0, dueCards: 0, masteredCards: 0, learningCards: 0 }
```

## Deployment

### Initial setup
```bash
cd /path/to/SIMULAI-OAB
npx prisma generate          # Generate Prisma client
npx prisma migrate dev       # Create migration
npx prisma migrate deploy    # Deploy to production
```

### Verify deployment
```bash
# Check migration ran successfully
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"ReviewCard\";"

# Should return: count = 0
```

## Monitoring

### Key logs to watch
- `SRS review cards retrieved` - Normal operation
- `SRS review recorded` - Normal operation
- `SRS card creation error` - Background errors (non-blocking)
- `Review card ensured` - Card creation/update

### Dashboard metrics
- `ReviewCard.totalCards` - Total cards per user
- `ReviewCard.dueCards` - Cards due today
- `ReviewCard.masteredCards` - Learned cards (30+ day interval)

## Future Enhancements

- [ ] Batch review sessions (review multiple cards)
- [ ] Subject-specific review decks
- [ ] Retention curves and analytics
- [ ] Custom interval schedules
- [ ] Integration with study plans
