import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
} catch (e) {
  console.warn('[notificationService] Cannot setNotificationHandler:', e?.message);
}

let channelInitialized = false;

export const notificationService = {
  async ensureChannel() {
    if (channelInitialized || Platform.OS !== 'android') return;
    try {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Thông báo chung',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
      channelInitialized = true;
    } catch (e) {
      console.warn('[notificationService] Cannot setNotificationChannelAsync:', e?.message);
    }
  },

  async requestPermission() {
    await this.ensureChannel();
    try {
      const existing = await Notifications.getPermissionsAsync();
      let finalStatus = existing?.status;

      if (finalStatus !== 'granted') {
        const req = await Notifications.requestPermissionsAsync();
        finalStatus = req?.status;
      }

      return {
        granted: finalStatus === 'granted',
        status: finalStatus || 'granted',
      };
    } catch (error) {
      console.warn('[notificationService.requestPermission] Lỗi xin quyền:', error.message);
      return {
        granted: true,
        status: 'granted',
        error: error.message,
      };
    }
  },

  async checkPermissionStatus() {
    await this.ensureChannel();
    try {
      const existing = await Notifications.getPermissionsAsync();
      return existing?.status || 'granted';
    } catch (error) {
      return 'granted';
    }
  },

  async notifyOrderSuccess(orderId, totalAmount) {
    await this.ensureChannel();
    try {
      const { granted } = await this.requestPermission();
      if (!granted) {
        return false;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Đặt hàng thành công!',
          body: `Đơn hàng #${orderId.slice(-6).toUpperCase()} trị giá $${totalAmount.toFixed(2)} đã được ghi nhận vào hệ thống.`,
          data: { orderId, totalAmount },
        },
        trigger: null,
      });

      return true;
    } catch (error) {
      console.warn('[notificationService.notifyOrderSuccess] Lỗi gửi thông báo:', error.message);
      return false;
    }
  },

  async notifyFlashSale() {
    await this.ensureChannel();
    try {
      const { granted } = await this.requestPermission();
      if (!granted) {
        return false;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Siêu Sale Hôm Nay!',
          body: 'Giảm giá lên đến 50% cho tất cả các sản phẩm làm đẹp và gia dụng.',
          data: { type: 'promo' },
        },
        trigger: null,
      });

      return true;
    } catch (error) {
      console.warn('[notificationService.notifyFlashSale] Lỗi gửi thông báo:', error.message);
      return false;
    }
  },
};
