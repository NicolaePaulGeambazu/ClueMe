#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import <Firebase.h>
#import <UserNotifications/UserNotifications.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  // Initialize Firebase
  [FIRApp configure];
  
  // Initialize the new iOS notification system
  [self setupNotificationSystem];
  
  self.moduleName = @"ClearCue2";
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};

  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

- (void)setupNotificationSystem
{
  // Use direct iOS notification APIs to avoid Swift bridging issues
  NSLog(@"[AppDelegate] Setting up native iOS notification system");
  [self setupFallbackNotificationSystem];
}

- (void)setupFallbackNotificationSystem
{
  // Native iOS notification setup using UNUserNotificationCenter
  UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
  
  [center requestAuthorizationWithOptions:(UNAuthorizationOptionAlert + UNAuthorizationOptionBadge + UNAuthorizationOptionSound)
                        completionHandler:^(BOOL granted, NSError * _Nullable error) {
    if (granted) {
      NSLog(@"[AppDelegate] Native iOS notification permissions granted");
      dispatch_async(dispatch_get_main_queue(), ^{
        [[UIApplication sharedApplication] registerForRemoteNotifications];
      });
    } else {
      NSLog(@"[AppDelegate] Native iOS notification permissions denied");
    }
  }];
  
  NSLog(@"[AppDelegate] Native iOS notification system initialized");
}

// MARK: - Remote Notifications

- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken
{
  NSLog(@"[AppDelegate] Successfully registered for remote notifications");
  // Firebase will handle the token automatically
}

- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error
{
  NSLog(@"[AppDelegate] Failed to register for remote notifications: %@", error);
}

// Handle remote notification received while app is running
- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
{
  NSLog(@"[AppDelegate] Received remote notification: %@", userInfo);
  
  // Firebase messaging will handle this automatically
  completionHandler(UIBackgroundFetchResultNewData);
}

/*
- (void)registerBackgroundTasks {
  // Register background fetch task
  [[BGTaskScheduler sharedScheduler] registerForTaskWithIdentifier:@"org.reactjs.native.example.clueme2.background-fetch"
                                                         usingQueue:nil
                                                      launchHandler:^(__kindof BGTask * _Nonnull task) {
    [self handleBackgroundFetch:task];
  }];
  
  // Register background processing task
  [[BGTaskScheduler sharedScheduler] registerForTaskWithIdentifier:@"org.reactjs.native.example.clueme2.background-processing"
                                                         usingQueue:nil
                                                      launchHandler:^(__kindof BGTask * _Nonnull task) {
    [self handleBackgroundProcessing:task];
  }];
  
  // Register reminder processing task
  [[BGTaskScheduler sharedScheduler] registerForTaskWithIdentifier:@"org.reactjs.native.example.clueme2.reminder-processing"
                                                         usingQueue:nil
                                                      launchHandler:^(__kindof BGTask * _Nonnull task) {
    [self handleReminderProcessing:task];
  }];
  
  // Register notification processing task
  [[BGTaskScheduler sharedScheduler] registerForTaskWithIdentifier:@"org.reactjs.native.example.clueme2.notification-processing"
                                                         usingQueue:nil
                                                      launchHandler:^(__kindof BGTask * _Nonnull task) {
    [self handleNotificationProcessing:task];
  }];
}

- (void)handleBackgroundFetch:(BGTask *)task {
  // Schedule the next background fetch
  [self scheduleBackgroundFetch];
  
  // Perform background fetch operations
  // This will be handled by React Native background job
  task.expirationHandler = ^{
    [task setTaskCompletedWithSuccess:NO];
  };
  
  // Mark task as completed
  [task setTaskCompletedWithSuccess:YES];
}

- (void)handleBackgroundProcessing:(BGTask *)task {
  // Schedule the next background processing
  [self scheduleBackgroundProcessing];
  
  // Perform background processing operations
  // This will be handled by React Native background job
  task.expirationHandler = ^{
    [task setTaskCompletedWithSuccess:NO];
  };
  
  // Mark task as completed
  [task setTaskCompletedWithSuccess:YES];
}

- (void)handleReminderProcessing:(BGTask *)task {
  // Schedule the next reminder processing
  [self scheduleReminderProcessing];
  
  // Perform reminder processing operations
  // This will be handled by React Native background job
  task.expirationHandler = ^{
    [task setTaskCompletedWithSuccess:NO];
  };
  
  // Mark task as completed
  [task setTaskCompletedWithSuccess:YES];
}

- (void)handleNotificationProcessing:(BGTask *)task {
  // Schedule the next notification processing
  [self scheduleNotificationProcessing];
  
  // Perform notification processing operations
  // This will be handled by React Native background job
  task.expirationHandler = ^{
    [task setTaskCompletedWithSuccess:NO];
  };
  
  // Mark task as completed
  [task setTaskCompletedWithSuccess:YES];
}

- (void)scheduleBackgroundFetch {
      BGAppRefreshTaskRequest *request = [[BGAppRefreshTaskRequest alloc] initWithIdentifier:@"org.reactjs.native.example.clueme2.background-fetch"];
  request.earliestBeginDate = [NSDate dateWithTimeIntervalSinceNow:15 * 60]; // 15 minutes from now
  
  NSError *error = nil;
  [[BGTaskScheduler sharedScheduler] submitTaskRequest:request error:&error];
  if (error) {
    NSLog(@"Could not schedule background fetch: %@", error);
  }
}

- (void)scheduleBackgroundProcessing {
      BGProcessingTaskRequest *request = [[BGProcessingTaskRequest alloc] initWithIdentifier:@"org.reactjs.native.example.clueme2.background-processing"];
  request.requiresNetworkConnectivity = YES;
  request.requiresExternalPower = NO;
  
  NSError *error = nil;
  [[BGTaskScheduler sharedScheduler] submitTaskRequest:request error:&error];
  if (error) {
    NSLog(@"Could not schedule background processing: %@", error);
  }
}

- (void)scheduleReminderProcessing {
      BGProcessingTaskRequest *request = [[BGProcessingTaskRequest alloc] initWithIdentifier:@"org.reactjs.native.example.clueme2.reminder-processing"];
  request.requiresNetworkConnectivity = YES;
  request.requiresExternalPower = NO;
  
  NSError *error = nil;
  [[BGTaskScheduler sharedScheduler] submitTaskRequest:request error:&error];
  if (error) {
    NSLog(@"Could not schedule reminder processing: %@", error);
  }
}

- (void)scheduleNotificationProcessing {
      BGProcessingTaskRequest *request = [[BGProcessingTaskRequest alloc] initWithIdentifier:@"org.reactjs.native.example.clueme2.notification-processing"];
  request.requiresNetworkConnectivity = YES;
  request.requiresExternalPower = NO;
  
  NSError *error = nil;
  [[BGTaskScheduler sharedScheduler] submitTaskRequest:request error:&error];
  if (error) {
    NSLog(@"Could not schedule notification processing: %@", error);
  }
}
*/

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

@end
