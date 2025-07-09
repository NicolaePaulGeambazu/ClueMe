# Cloud Functions Cost Optimization Guide

## Overview
This guide provides strategies to optimize Cloud Functions costs while maintaining performance and reliability for the ClueMe notification system.

## Current Optimizations Implemented

### 1. Memory Optimization
```javascript
// Before: Default 512MB memory
exports.sendFCMNotification = functions.firestore...

// After: Optimized 256MB memory
exports.sendFCMNotification = functions
  .runWith({
    memory: '256MB', // 50% reduction in memory costs
    timeoutSeconds: 30, // Reduced from default 60s
    minInstances: 0, // Cold starts to save costs
    maxInstances: 10, // Prevent runaway scaling
  })
  .firestore...
```

### 2. Cold Start Optimization
- **`minInstances: 0`**: Use cold starts instead of always-on instances
- **Faster execution**: Reduced timeouts to minimize cold start impact
- **Efficient initialization**: Optimized code paths for quick startup

### 3. Batch Processing
```javascript
// Process notifications in batches to reduce overhead
const batchSize = 10; // Process 10 at a time
const notifications = scheduledNotificationsSnapshot.docs;

for (let i = 0; i < notifications.length; i += batchSize) {
  const batch = notifications.slice(i, i + batchSize);
  await Promise.all(batch.map(async (doc) => {
    // Process each notification
  }));
  
  // Small delay between batches to prevent rate limiting
  if (i + batchSize < notifications.length) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}
```

### 4. Concurrency Limits
- **FCM notifications**: Max 10 concurrent instances
- **Scheduled processing**: Max 5 concurrent instances
- **Cron job**: Max 1 instance (only one needed)
- **HTTP endpoints**: Max 5 concurrent instances

## Cost Breakdown & Estimates

### Monthly Cost Estimates
| Service | Estimated Cost | Optimization |
|---------|---------------|--------------|
| Cloud Functions | $15-30 | Memory limits, cold starts |
| Firestore | $10-20 | Efficient queries, batch operations |
| FCM | $2-5 | Minimal usage |
| **Total** | **$27-55** | **Optimized configuration** |

### Cost Factors
1. **Function invocations**: $0.40 per million invocations
2. **Compute time**: $0.0000025 per GB-second
3. **Memory**: $0.0000025 per GB-second
4. **Network**: $0.12 per GB

## Budget Alerts Setup

### Manual Setup (Recommended)
1. Go to [Google Cloud Console](https://console.cloud.google.com/billing)
2. Select your ClueMe project (clueme-36fb2)
3. Navigate to **Billing > Budgets & Alerts**
4. Click **Create Budget**
5. Configure:
   - **Budget amount**: $50/month
   - **Alert thresholds**: 50%, 80%, 100%, 120%
   - **Notification emails**: Your email address

### Automated Setup
Use the provided `functions/budget-alerts.yaml` file:
```bash
gcloud billing budgets create --billing-account=YOUR_BILLING_ACCOUNT_ID --budget-file=functions/budget-alerts.yaml
```

## Monitoring & Analytics

### Firebase Console Monitoring
1. **Functions > Metrics**: Monitor execution times and memory usage
2. **Functions > Logs**: Check for errors and performance issues
3. **Usage**: Track function invocation counts

### Key Metrics to Watch
- **Execution time**: Should be under 30 seconds for most functions
- **Memory usage**: Should stay under 256MB
- **Error rate**: Should be under 1%
- **Cold start frequency**: Monitor for patterns

### Cost Monitoring Dashboard
Create a custom dashboard in Google Cloud Console:
1. Go to **Monitoring > Dashboards**
2. Create new dashboard
3. Add widgets for:
   - Cloud Functions execution time
   - Memory usage
   - Invocation count
   - Error rate
   - Cost trends

## Performance Optimization Tips

### 1. Database Optimization
```javascript
// Efficient queries with limits
const snapshot = await firestore
  .collection('scheduledNotifications')
  .where('status', '==', 'pending')
  .where('scheduledTime', '<=', now)
  .limit(50) // Prevent large result sets
  .get();
```

### 2. Error Handling
```javascript
// Graceful error handling to prevent retries
try {
  await admin.messaging().send(message);
} catch (error) {
  // Log error but don't retry immediately
  console.error('FCM send failed:', error);
  await snap.ref.update({
    status: 'failed',
    error: error.message,
  });
}
```

### 3. Connection Pooling
```javascript
// Reuse Firestore instance
const firestore = admin.firestore();
// Use throughout function execution
```

## Scaling Considerations

### Current Limits
- **Max instances**: 10 for FCM, 5 for processing, 1 for cron
- **Memory**: 256MB for most functions, 512MB for batch processing
- **Timeout**: 30-60 seconds for most functions, 5 minutes for cron

### Scaling Triggers
- **High invocation rate**: Increase maxInstances
- **Memory pressure**: Increase memory allocation
- **Timeout issues**: Increase timeout or optimize code

### Auto-scaling Behavior
- **Cold starts**: Functions start when needed
- **Warm instances**: Reused for subsequent requests
- **Scaling down**: Instances shut down after inactivity

## Cost Reduction Strategies

### 1. Function Consolidation
Consider combining similar functions to reduce invocation overhead:
```javascript
// Instead of separate functions for different notification types
// Use a single function with type parameter
exports.processNotification = functions.firestore
  .document('notifications/{notificationId}')
  .onCreate(async (snap, context) => {
    const { type, ...data } = snap.data();
    
    switch (type) {
      case 'fcm':
        return processFCMNotification(data);
      case 'scheduled':
        return processScheduledNotification(data);
      default:
        throw new Error(`Unknown notification type: ${type}`);
    }
  });
```

### 2. Caching Strategy
Implement caching for frequently accessed data:
```javascript
// Cache user data to reduce database calls
const userCache = new Map();

async function getUserData(userId) {
  if (userCache.has(userId)) {
    return userCache.get(userId);
  }
  
  const userDoc = await firestore.collection('users').doc(userId).get();
  const userData = userDoc.data();
  userCache.set(userId, userData);
  return userData;
}
```

### 3. Batch Operations
Group multiple operations to reduce function calls:
```javascript
// Batch multiple FCM notifications
const batch = firestore.batch();
notifications.forEach(notification => {
  const docRef = firestore.collection('fcmNotifications').doc();
  batch.set(docRef, notification);
});
await batch.commit();
```

## Troubleshooting High Costs

### Common Issues
1. **High invocation count**: Check for infinite loops or unnecessary triggers
2. **Long execution times**: Optimize database queries and external API calls
3. **Memory leaks**: Monitor memory usage patterns
4. **Cold start frequency**: Consider minInstances for critical functions

### Debugging Steps
1. **Check logs**: Look for errors or performance issues
2. **Monitor metrics**: Track execution time and memory usage
3. **Review triggers**: Ensure functions aren't triggered unnecessarily
4. **Analyze queries**: Optimize database operations

### Emergency Cost Control
If costs spike unexpectedly:
1. **Disable non-critical functions**: Comment out in `functions/index.js`
2. **Increase limits**: Reduce maxInstances to 1
3. **Add delays**: Increase batch processing delays
4. **Monitor closely**: Check logs every few hours

## Best Practices Summary

### ✅ Do's
- Use cold starts (`minInstances: 0`)
- Set appropriate memory limits
- Implement batch processing
- Monitor costs regularly
- Set up budget alerts
- Optimize database queries
- Handle errors gracefully

### ❌ Don'ts
- Don't use always-on instances unnecessarily
- Don't process large datasets without limits
- Don't ignore error logs
- Don't set unlimited maxInstances
- Don't skip budget monitoring
- Don't retry failed operations indefinitely

## Next Steps

1. **Deploy optimized functions**: `firebase deploy --only functions`
2. **Set up budget alerts**: Follow the manual setup guide
3. **Monitor for 1 week**: Track costs and performance
4. **Adjust as needed**: Fine-tune based on actual usage patterns
5. **Set up monitoring**: Create custom dashboards

## Support & Resources

- **Firebase Console**: [console.firebase.google.com](https://console.firebase.google.com)
- **Google Cloud Billing**: [console.cloud.google.com/billing](https://console.cloud.google.com/billing)
- **Cloud Functions Pricing**: [cloud.google.com/functions/pricing](https://cloud.google.com/functions/pricing)
- **Firebase Documentation**: [firebase.google.com/docs/functions](https://firebase.google.com/docs/functions) 