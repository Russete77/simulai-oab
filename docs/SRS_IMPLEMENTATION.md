# Spaced Repetition System (SRS) Implementation

## Overview

A Spaced Repetition System has been implemented for SimulaIOAB using the SM-2 (SuperMemo-2) algorithm adapted for multiple-choice law exam questions.

## Architecture

### Database Schema
**File**: `prisma/schema.prisma`

Added `ReviewCard` model with the following fields:
- `id`: Unique identifier (CUID)
- `userId`: Foreign key to User
- `questionId`: Foreign key to Question
- `easeFactor`: Difficulty multiplier (1.3 - 5.0, default 2.5)
- `interval`: Days until next review (default 1)
- `repetitions`: Count of successful reviews (default 0)
- `nextReviewAt`: Scheduled review date
- `lastReviewAt`: Last review timestamp
- `totalReviews`: Total review attempts
- `correctReviews`: Successful review count

**Indexes**:
- Unique constraint on `(userId, questionId)` - prevents duplicate cards per user per question
- Composite index on `(userId, nextReviewAt)` - optimizes due card queries
- Index on `userId` - for user statistics

### Algorithm Layer
**File**: `lib/srs/algorithm.ts`

**Function**: `calculateSRS(isCorrect, timeSpent, currentEase, currentInterval, currentRepetitions)`

Implements SM-2 algorithm with time-based quality scoring:

```
Quality Mapping:
- isCorrect = false         → quality = 1 (failed)
- isCorrect = true, t > 2m  → quality = 3 (difficult)
- isCorrect = true, 1m-2m   → quality = 4 (good)
- isCorrect = true, t < 1m  → quality = 5 (easy)

Progression Schedule:
- Rep 1 → 1 day
- Rep 2 → 3 days
- Rep 3 → 7 days
- Rep 4+ → interval × easeFactor days

Ease Factor Adjustment:
- Failed: easeFactor - 0.2 (min 1.3)
- Success: easeFactor + (0.1 - (5-quality) × (0.08 + (5-quality) × 0.02))
- Bounded: 1.3 ≤ easeFactor ≤ 5.0
- Capped interval: max 180 days (6 months)
```

### Service Layer
**File**: `lib/srs/service.ts`

Provides business logic functions:

1. **getDueReviewCards(userId, limit=10)**
   - Returns review cards due today, ordered by next review date
   - Includes full question data with alternatives

2. **recordReview(userId, questionId, isCorrect, timeSpent)**
   - Updates card based on review result
   - Increments totalReviews and correctReviews counters
   - Calls calculateSRS for new scheduling

3. **ensureReviewCard(userId, questionId, isCorrect)**
   - Creates new card if user answers incorrectly
   - Resets existing card if user gets it wrong again
   - No-op if user answers correctly and no card exists

4. **getSRSStats(userId)**
   - Returns statistics:
     - `totalCards`: Total review cards
     - `dueCards`: Cards due today
     - `masteredCards`: Cards with 30+ day interval
     - `learningCards`: Total - mastered

5. **countDueReviews(userId)**
   - Fast count of due reviews

### API Endpoints
**File**: `app/api/review/srs/route.ts`

#### GET /api/review/srs
Retrieves pending review cards and/or statistics

**Query Parameters**:
- `limit` (optional): Max cards to return (default 10)
- `stats` (optional): If "true", return only statistics

**Response (cards mode)**:
```json
{
  "cards": [
    {
      "id": "...",
      "userId": "...",
      "questionId": "...",
      "easeFactor": 2.5,
      "interval": 3,
      "repetitions": 1,
      "nextReviewAt": "2026-03-20T00:00:00.000Z",
      "totalReviews": 1,
      "correctReviews": 1,
      "question": {
        "id": "...",
        "statement": "...",
        "alternatives": [...]
      }
    }
  ],
  "stats": {
    "totalCards": 50,
    "dueCards": 5,
    "masteredCards": 20,
    "learningCards": 30
  }
}
```

**Response (stats mode)**:
```json
{
  "totalCards": 50,
  "dueCards": 5,
  "masteredCards": 20,
  "learningCards": 30
}
```

#### POST /api/review/srs
Records review result and updates card scheduling

**Request Body**:
```json
{
  "questionId": "...",
  "isCorrect": true,
  "timeSpent": 45
}
```

**Response**:
```json
{
  "success": true,
  "nextReviewAt": "2026-03-20T00:00:00.000Z",
  "interval": 3
}
```

### Integration
**File**: `app/api/questions/answer/route.ts`

The answer route automatically creates/updates review cards:

1. After user answers a question (practice mode only, not simulations)
2. Calls `ensureReviewCard(userId, questionId, isCorrect)`
3. Fire-and-forget implementation (doesn't block response)
4. Errors logged but don't affect answer response

## Usage Examples

### Getting due reviews for a session
```typescript
const response = await fetch('/api/review/srs?limit=10');
const { cards, stats } = await response.json();

// Start review session
for (const card of cards) {
  // Show question to user
  // Get user response
  const userCorrect = /* ... */;
  const timeSpent = /* ... */;

  // Record review
  await fetch('/api/review/srs', {
    method: 'POST',
    body: JSON.stringify({
      questionId: card.questionId,
      isCorrect: userCorrect,
      timeSpent
    })
  });
}
```

### Getting SRS statistics
```typescript
const stats = await fetch('/api/review/srs?stats=true').then(r => r.json());
console.log(`${stats.dueCards} cards due today`);
console.log(`${stats.masteredCards} cards mastered`);
```

## Key Design Decisions

1. **Fire-and-forget SRS integration**: Review cards are created asynchronously after answer submission to avoid blocking API responses

2. **SM-2 with time-based quality**: Unlike standard SM-2 which uses user-provided quality (0-5), this system infers quality from correctness and response time

3. **No-op for correct answers**: Cards are only created/updated when answers are incorrect, reducing database overhead

4. **Mastery threshold at 30 days**: Cards with 30+ day intervals are considered "mastered" and excluded from learning stats

5. **6-month maximum interval**: Prevents extremely long review gaps even for well-learned material

6. **Simulation answers excluded**: Review cards only created for practice mode answers, not simulation mode

## Database Migration

To apply these changes to production:

```bash
# Generate Prisma client
npx prisma generate

# Create migration
npx prisma migrate dev --name add_srs_review_cards

# In production
npx prisma migrate deploy
```

## Performance Considerations

1. **Indexing**: `(userId, nextReviewAt)` composite index optimizes due card queries
2. **Lazy loading**: Question data included only when needed
3. **Batch operations**: Statistics queries run in parallel
4. **Fire-and-forget**: Doesn't block primary answer flow

## Monitoring

Track SRS performance via logs:
- `SRS review cards retrieved` - GET endpoint usage
- `SRS review recorded` - POST endpoint usage
- `Review card ensured` - Automatic card creation
- `SRS card creation error` - Any failures in background task

## Future Enhancements

1. **Frontend UI**: Build review session interface
2. **Statistics dashboard**: Visualize learning progress
3. **Export/import**: Allow users to sync across devices
4. **Algorithm tuning**: A/B test different ease factor adjustments
5. **Deck management**: Support topic-specific review decks
6. **Retention analysis**: Calculate and visualize retention curves
