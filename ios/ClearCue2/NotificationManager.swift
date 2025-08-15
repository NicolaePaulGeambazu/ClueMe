//
//  NotificationManager.swift
//  ClearCue2
//
//  Created by ClueMe Team on 15/08/2025.
//  Pure iOS UNUserNotificationCenter implementation with UK formatting
//

import Foundation
import UserNotifications
import UIKit

@objc(NotificationManager)
class NotificationManager: NSObject {
    
    static let shared = NotificationManager()
    
    // UK locale and timezone constants
    private let ukLocale = Locale(identifier: "en_GB")
    private let ukTimeZone = TimeZone(identifier: "Europe/London")!
    
    // Date formatters for UK formatting
    private lazy var ukDateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = ukLocale
        formatter.timeZone = ukTimeZone
        formatter.dateStyle = .medium
        formatter.timeStyle = .none
        return formatter
    }()
    
    private lazy var ukTimeFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = ukLocale
        formatter.timeZone = ukTimeZone
        formatter.dateStyle = .none
        formatter.timeStyle = .short
        return formatter
    }()
    
    private lazy var ukDateTimeFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = ukLocale
        formatter.timeZone = ukTimeZone
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter
    }()
    
    override init() {
        super.init()
        setupNotificationCenter()
    }
    
    // MARK: - Setup
    
    private func setupNotificationCenter() {
        UNUserNotificationCenter.current().delegate = self
        registerNotificationCategories()
    }
    
    private func registerNotificationCategories() {
        // Define notification actions
        let markCompleteAction = UNNotificationAction(
            identifier: "MARK_COMPLETE",
            title: "Mark Complete",
            options: [.foreground]
        )
        
        let snoozeAction = UNNotificationAction(
            identifier: "SNOOZE",
            title: "Snooze 15 min",
            options: []
        )
        
        let viewAction = UNNotificationAction(
            identifier: "VIEW",
            title: "View",
            options: [.foreground]
        )
        
        // Define notification categories
        let reminderCategory = UNNotificationCategory(
            identifier: "REMINDER_CATEGORY",
            actions: [markCompleteAction, snoozeAction, viewAction],
            intentIdentifiers: [],
            options: [.customDismissAction]
        )
        
        let assignmentCategory = UNNotificationCategory(
            identifier: "ASSIGNMENT_CATEGORY",
            actions: [viewAction],
            intentIdentifiers: [],
            options: [.customDismissAction]
        )
        
        // Register categories
        UNUserNotificationCenter.current().setNotificationCategories([
            reminderCategory,
            assignmentCategory
        ])
        
        print("[NotificationManager] Notification categories registered")
    }
    
    // MARK: - Permission Management
    
    @objc func requestPermissions(_ completion: @escaping (Bool) -> Void) {
        UNUserNotificationCenter.current().requestAuthorization(
            options: [.alert, .badge, .sound, .provisional]
        ) { granted, error in
            DispatchQueue.main.async {
                if let error = error {
                    print("[NotificationManager] Permission request error: \(error)")
                    completion(false)
                } else {
                    print("[NotificationManager] Permission granted: \(granted)")
                    completion(granted)
                }
            }
        }
    }
    
    @objc func checkPermissions(_ completion: @escaping (Bool) -> Void) {
        UNUserNotificationCenter.current().getNotificationSettings { settings in
            DispatchQueue.main.async {
                let authorized = settings.authorizationStatus == .authorized || 
                               settings.authorizationStatus == .provisional
                completion(authorized)
            }
        }
    }
    
    // MARK: - Local Notification Scheduling
    
    @objc func scheduleLocalNotification(
        identifier: String,
        title: String,
        body: String,
        scheduledDate: Date,
        userInfo: [String: Any] = [:]
    ) {
        // Only schedule if the date is in the future
        guard scheduledDate > Date() else {
            print("[NotificationManager] Skipping past notification time: \(ukDateTimeFormatter.string(from: scheduledDate))")
            return
        }
        
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default
        content.badge = NSNumber(value: UIApplication.shared.applicationIconBadgeNumber + 1)
        content.userInfo = userInfo
        
        // Set category based on notification type
        if let type = userInfo["type"] as? String {
            switch type {
            case "reminder", "recurring":
                content.categoryIdentifier = "REMINDER_CATEGORY"
            case "assignment":
                content.categoryIdentifier = "ASSIGNMENT_CATEGORY"
            default:
                content.categoryIdentifier = "REMINDER_CATEGORY"
            }
        }
        
        // Create trigger
        let calendar = Calendar.current
        let components = calendar.dateComponents([.year, .month, .day, .hour, .minute], from: scheduledDate)
        let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: false)
        
        // Create request
        let request = UNNotificationRequest(
            identifier: identifier,
            content: content,
            trigger: trigger
        )
        
        // Schedule notification
        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                print("[NotificationManager] Error scheduling notification: \(error)")
            } else {
                print("[NotificationManager] Scheduled notification for \(self.ukDateTimeFormatter.string(from: scheduledDate))")
            }
        }
    }
    
    // MARK: - Notification Management
    
    @objc func cancelNotification(identifier: String) {
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: [identifier])
        print("[NotificationManager] Cancelled notification: \(identifier)")
    }
    
    @objc func cancelNotificationsForReminder(reminderId: String) {
        UNUserNotificationCenter.current().getPendingNotificationRequests { requests in
            let identifiersToCancel = requests.compactMap { request -> String? in
                if let userInfo = request.content.userInfo as? [String: Any],
                   let notificationReminderId = userInfo["reminderId"] as? String,
                   notificationReminderId == reminderId {
                    return request.identifier
                }
                return nil
            }
            
            if !identifiersToCancel.isEmpty {
                UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: identifiersToCancel)
                print("[NotificationManager] Cancelled \(identifiersToCancel.count) notifications for reminder: \(reminderId)")
            }
        }
    }
    
    @objc func cancelAllNotifications() {
        UNUserNotificationCenter.current().removeAllPendingNotificationRequests()
        UNUserNotificationCenter.current().removeAllDeliveredNotifications()
        UIApplication.shared.applicationIconBadgeNumber = 0
        print("[NotificationManager] All notifications cancelled")
    }
    
    @objc func getPendingNotificationCount(_ completion: @escaping (Int) -> Void) {
        UNUserNotificationCenter.current().getPendingNotificationRequests { requests in
            DispatchQueue.main.async {
                completion(requests.count)
            }
        }
    }
    
    // MARK: - Badge Management
    
    @objc func setBadgeCount(_ count: Int) {
        DispatchQueue.main.async {
            UIApplication.shared.applicationIconBadgeNumber = count
        }
    }
    
    @objc func clearBadge() {
        setBadgeCount(0)
    }
    
    // MARK: - Test Notification
    
    @objc func sendTestNotification() {
        let now = Date()
        let testDate = Date(timeInterval: 5, since: now) // 5 seconds from now
        
        scheduleLocalNotification(
            identifier: "test-notification-\(Int(now.timeIntervalSince1970))",
            title: "🧪 ClueMe Test",
            body: "Test notification sent at \(ukDateTimeFormatter.string(from: now))",
            scheduledDate: testDate,
            userInfo: [
                "type": "test",
                "sentAt": ukDateTimeFormatter.string(from: now)
            ]
        )
    }
    
    // MARK: - UK Date Formatting Helpers
    
    @objc func formatUKDate(_ date: Date) -> String {
        return ukDateFormatter.string(from: date)
    }
    
    @objc func formatUKTime(_ date: Date) -> String {
        return ukTimeFormatter.string(from: date)
    }
    
    @objc func formatUKDateTime(_ date: Date) -> String {
        return ukDateTimeFormatter.string(from: date)
    }
}

// MARK: - UNUserNotificationCenterDelegate

extension NotificationManager: UNUserNotificationCenterDelegate {
    
    // Handle notifications when app is in foreground
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        print("[NotificationManager] Will present notification in foreground: \(notification.request.content.title)")
        
        // Show notification even when app is in foreground
        if #available(iOS 14.0, *) {
            completionHandler([.banner, .sound, .badge])
        } else {
            completionHandler([.alert, .sound, .badge])
        }
    }
    
    // Handle notification tap
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        let userInfo = response.notification.request.content.userInfo
        let actionIdentifier = response.actionIdentifier
        
        print("[NotificationManager] Received notification response: \(actionIdentifier)")
        print("[NotificationManager] User info: \(userInfo)")
        
        switch actionIdentifier {
        case "MARK_COMPLETE":
            handleMarkComplete(userInfo: userInfo)
        case "SNOOZE":
            handleSnooze(userInfo: userInfo)
        case "VIEW", UNNotificationDefaultActionIdentifier:
            handleView(userInfo: userInfo)
        case UNNotificationDismissActionIdentifier:
            print("[NotificationManager] Notification dismissed")
        default:
            break
        }
        
        completionHandler()
    }
    
    // MARK: - Action Handlers
    
    private func handleMarkComplete(userInfo: [AnyHashable: Any]) {
        guard let reminderId = userInfo["reminderId"] as? String else { return }
        
        print("[NotificationManager] Marking reminder complete: \(reminderId)")
        
        // Post notification to React Native
        NotificationCenter.default.post(
            name: NSNotification.Name("NotificationActionMarkComplete"),
            object: nil,
            userInfo: ["reminderId": reminderId]
        )
    }
    
    private func handleSnooze(userInfo: [AnyHashable: Any]) {
        guard let reminderId = userInfo["reminderId"] as? String else { return }
        
        print("[NotificationManager] Snoozing reminder: \(reminderId)")
        
        // Schedule a new notification 15 minutes from now
        let snoozeDate = Date(timeInterval: 15 * 60, since: Date()) // 15 minutes
        let title = userInfo["title"] as? String ?? "Reminder"
        let body = userInfo["body"] as? String ?? "Snoozed reminder"
        
        scheduleLocalNotification(
            identifier: "\(reminderId)-snoozed-\(Int(Date().timeIntervalSince1970))",
            title: "⏰ \(title)",
            body: "Snoozed: \(body)",
            scheduledDate: snoozeDate,
            userInfo: userInfo
        )
        
        // Post notification to React Native
        NotificationCenter.default.post(
            name: NSNotification.Name("NotificationActionSnooze"),
            object: nil,
            userInfo: ["reminderId": reminderId, "snoozeUntil": snoozeDate]
        )
    }
    
    private func handleView(userInfo: [AnyHashable: Any]) {
        print("[NotificationManager] Opening app to view notification")
        
        // Post notification to React Native for navigation
        NotificationCenter.default.post(
            name: NSNotification.Name("NotificationActionView"),
            object: nil,
            userInfo: userInfo
        )
    }
}
