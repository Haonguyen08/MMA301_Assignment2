const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'node_modules', 'expo-notifications', 'build', 'TopicSubscriptionModule.android.js');

if (fs.existsSync(targetFile)) {
  let content = fs.readFileSync(targetFile, 'utf8');
  if (content.includes("export default requireNativeModule('ExpoTopicSubscriptionModule');")) {
    content = content.replace(
      "export default requireNativeModule('ExpoTopicSubscriptionModule');",
      `let moduleImpl;
try {
  moduleImpl = requireNativeModule('ExpoTopicSubscriptionModule');
} catch {
  moduleImpl = {
    addListener: () => {},
    removeListeners: () => {},
    subscribeToTopicAsync: () => Promise.resolve(null),
    unsubscribeFromTopicAsync: () => Promise.resolve(null),
  };
}
export default moduleImpl;`
    );
    fs.writeFileSync(targetFile, content, 'utf8');
    console.log('[patch] Patched TopicSubscriptionModule.android.js successfully.');
  }
}

const permFile = path.join(__dirname, '..', 'node_modules', 'expo-notifications', 'build', 'NotificationPermissionsModule.native.js');

if (fs.existsSync(permFile)) {
  let permContent = fs.readFileSync(permFile, 'utf8');
  if (permContent.includes("export default requireNativeModule('ExpoNotificationPermissionsModule');")) {
    permContent = permContent.replace(
      "export default requireNativeModule('ExpoNotificationPermissionsModule');",
      `let rawModule;
try {
  rawModule = requireNativeModule('ExpoNotificationPermissionsModule');
} catch {
  rawModule = {};
}
const safePermissionsModule = {
  ...rawModule,
  async getPermissionsAsync() {
    try {
      if (rawModule && typeof rawModule.getPermissionsAsync === 'function') {
        return await rawModule.getPermissionsAsync();
      }
    } catch {}
    return {
      status: 'granted',
      granted: true,
      canAskAgain: true,
      expires: 'never',
    };
  },
  async requestPermissionsAsync(permissions) {
    try {
      if (rawModule && typeof rawModule.requestPermissionsAsync === 'function') {
        return await rawModule.requestPermissionsAsync(permissions);
      }
    } catch {}
    return {
      status: 'granted',
      granted: true,
      canAskAgain: true,
      expires: 'never',
    };
  },
};
export default safePermissionsModule;`
    );
    fs.writeFileSync(permFile, permContent, 'utf8');
    console.log('[patch] Patched NotificationPermissionsModule.native.js successfully.');
  }
}
