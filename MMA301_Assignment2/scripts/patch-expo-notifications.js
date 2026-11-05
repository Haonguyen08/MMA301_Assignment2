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

const tsconfigFile = path.join(__dirname, '..', 'node_modules', 'expo-notifications', 'tsconfig.json');
if (fs.existsSync(tsconfigFile)) {
  fs.writeFileSync(tsconfigFile, '{}\n', 'utf8');
  console.log('[patch] Replaced expo-notifications tsconfig.json with clean config.');
}

const baseDir = path.join(__dirname, '..', 'node_modules', 'expo-module-scripts');
if (!fs.existsSync(baseDir)) {
  fs.mkdirSync(baseDir, { recursive: true });
}
fs.writeFileSync(
  path.join(baseDir, 'package.json'),
  JSON.stringify({ name: 'expo-module-scripts', version: '1.0.0', main: 'index.js' }, null, 2),
  'utf8'
);
fs.writeFileSync(
  path.join(baseDir, 'tsconfig.base.json'),
  JSON.stringify({ compilerOptions: { target: 'ESNext', module: 'commonjs', skipLibCheck: true } }, null, 2),
  'utf8'
);
console.log('[patch] Ensured expo-module-scripts/tsconfig.base exists.');

