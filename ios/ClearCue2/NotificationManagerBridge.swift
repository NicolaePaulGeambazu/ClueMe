//
//  NotificationManagerBridge.swift
//  ClearCue2
//
//  React Native bridge implementation for NotificationManager
//

import Foundation
import React

@objc(NotificationManagerBridge)
class NotificationManagerBridge: RCTEventEmitter {
    
    private let notificationManager = NotificationManager.shared
    
    override init() {
        super.init()
        setupNotificationObservers()
    }
    
    // MARK: - RCTEventEmitter
    
    override func supportedEvents() -> [String]! {
        return [
            "NotificationActionMarkComplete",
            "NotificationActionSnooze",
            "NotificationActionView",
            "NotificationReceived",
            "NotificationOpened"
        ]
    }
    
    override static func requiresMainQueueSetup() -> Bool {
        return true
    }
    
    // MARK: - Notification Observers
    
    private func setupNotificationObservers() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleMarkComplete(_:)),
            name: NSNotification.Name("NotificationActionMarkComplete"),
            object: nil
        )
        
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleSnooze(_:)),
            name: NSNotification.Name("NotificationActionSnooze"),
            object: nil
        )
        
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleView(_:)),
            name: NSNotification.Name("NotificationActionView"),
            object: nil
        )
    }
    
    @objc private func handleMarkComplete(_ notification: Notification) {
        if let userInfo = notification.userInfo {
            sendEvent(withName: "NotificationActionMarkComplete", body: userInfo)
        }
    }
    
    @objc private func handleSnooze(_ notification: Notification) {
        if let userInfo = notification.userInfo {
            sendEvent(withName: "NotificationActionSnooze", body: userInfo)
        }
    }
    
    @objc private func handleView(_ notification: Notification) {
        if let userInfo = notification.userInfo {
            sendEvent(withName: "NotificationActionView", body: userInfo)
        }
    }
    
    // MARK: - Permission Methods
    
    @objc func requestPermissions(
        _ resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        notificationManager.requestPermissions { granted in
            resolve(granted)
        }
    }
    
    @objc func checkPermissions(
        _ resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        notificationManager.checkPermissions { authorized in
            resolve(authorized)
        }
    }
    
    // MARK: - Notification Scheduling Methods
    
    @objc func scheduleLocalNotification(
        _ identifier: String,
        title: String,
        body: String,
        scheduledDate: Date,
        userInfo: [String: Any],
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        notificationManager.scheduleLocalNotification(
            identifier: identifier,
            title: title,
            body: body,
            scheduledDate: scheduledDate,
            userInfo: userInfo
        )
        resolve(true)
    }
    
    // MARK: - Notification Management Methods
    
    @objc func cancelNotification(
        _ identifier: String,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        notificationManager.cancelNotification(identifier: identifier)
        resolve(true)
    }
    
    @objc func cancelNotificationsForReminder(
        _ reminderId: String,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        notificationManager.cancelNotificationsForReminder(reminderId: reminderId)
        resolve(true)
    }
    
    @objc func cancelAllNotifications(
        _ resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        notificationManager.cancelAllNotifications()
        resolve(true)
    }
    
    @objc func getPendingNotificationCount(
        _ resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        notificationManager.getPendingNotificationCount { count in
            resolve(count)
        }
    }
    
    // MARK: - Badge Management Methods
    
    @objc func setBadgeCount(
        _ count: Int,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        notificationManager.setBadgeCount(count)
        resolve(true)
    }
    
    @objc func clearBadge(
        _ resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        notificationManager.clearBadge()
        resolve(true)
    }
    
    // MARK: - Test Methods
    
    @objc func sendTestNotification(
        _ resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        notificationManager.sendTestNotification()
        resolve(true)
    }
    
    // MARK: - Date Formatting Methods
    
    @objc func formatUKDate(
        _ date: Date,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        let formattedDate = notificationManager.formatUKDate(date)
        resolve(formattedDate)
    }
    
    @objc func formatUKTime(
        _ date: Date,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        let formattedTime = notificationManager.formatUKTime(date)
        resolve(formattedTime)
    }
    
    @objc func formatUKDateTime(
        _ date: Date,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        let formattedDateTime = notificationManager.formatUKDateTime(date)
        resolve(formattedDateTime)
    }
    
    deinit {
        NotificationCenter.default.removeObserver(self)
    }
}
