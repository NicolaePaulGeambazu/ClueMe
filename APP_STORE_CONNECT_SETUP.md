# App Store Connect Metadata Setup

## 🚨 **Current Issue: MISSING_METADATA**

Your products have `MISSING_METADATA` status in App Store Connect, which needs to be fixed for testing.

## 🔧 **Step-by-Step Fix:**

### **1. Go to App Store Connect**
1. Visit [App Store Connect](https://appstoreconnect.apple.com/)
2. Select your **ClearCue** app
3. Go to **Features** → **In-App Purchases**

### **2. Fix Each Product**

#### **Product: com.clearcue.pro.weekly**
1. Click on the product
2. Go to **App Information** tab
3. Fill in:
   - **Display Name**: `ClearCue Pro Weekly`
   - **Description**: `Weekly subscription to ClearCue Premium features including unlimited reminders, advanced scheduling, and priority support.`
   - **Review Information**: `Weekly subscription plan for individual users.`

#### **Product: com.clearcue.pro.yearly**
1. Click on the product
2. Go to **App Information** tab
3. Fill in:
   - **Display Name**: `ClearCue Pro Yearly`
   - **Description**: `Annual subscription to ClearCue Premium features including unlimited reminders, advanced scheduling, and priority support. Save 17% compared to weekly billing.`
   - **Review Information**: `Annual subscription plan for individual users with savings.`

#### **Product: com.clearcue.team.weekly**
1. Click on the product
2. Go to **App Information** tab
3. Fill in:
   - **Display Name**: `ClearCue Team Weekly`
   - **Description**: `Weekly family subscription to ClearCue Premium features. Share with up to 6 family members including unlimited reminders, advanced scheduling, and priority support.`
   - **Review Information**: `Weekly family subscription plan with family sharing enabled.`

#### **Product: com.clearcue.team.yearly**
1. Click on the product
2. Go to **App Information** tab
3. Fill in:
   - **Display Name**: `ClearCue Team Yearly`
   - **Description**: `Annual family subscription to ClearCue Premium features. Share with up to 6 family members including unlimited reminders, advanced scheduling, and priority support. Save 17% compared to weekly billing.`
   - **Review Information**: `Annual family subscription plan with family sharing enabled and savings.`

### **3. Submit for Review**
1. After adding metadata to all products
2. Click **Save** for each product
3. The status should change from `MISSING_METADATA` to `Ready to Submit`

## 🧪 **Testing After Metadata Setup:**

### **Option 1: Simulator Testing (Recommended)**
- Use the StoreKit configuration file we created
- No need to wait for App Store review
- Perfect for development and testing

### **Option 2: Sandbox Testing**
- Requires metadata to be approved
- Test with real App Store sandbox accounts
- More realistic testing environment

## 📝 **Metadata Guidelines:**

### **Display Names:**
- Keep under 30 characters
- Be clear and descriptive
- Include plan type (Weekly/Yearly)

### **Descriptions:**
- Explain the value proposition
- Mention key features
- Include pricing benefits (for yearly plans)

### **Review Information:**
- Brief description for App Review team
- Explain the subscription model
- Mention family sharing if applicable

## ✅ **After Setup:**

1. **Metadata Status**: Should show `Ready to Submit`
2. **Simulator Testing**: Works immediately with StoreKit config
3. **Sandbox Testing**: Available after metadata approval
4. **Production**: Ready for App Store review

## 🚀 **Next Steps:**

1. Add metadata to all 4 products
2. Test in simulator with StoreKit configuration
3. Submit for review when ready for production 