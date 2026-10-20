import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const notificationService = {
  async requestPermission() {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Thông báo chung',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      return {
        granted: finalStatus === 'granted',
        status: finalStatus,
      };
    } catch (error) {
      console.warn('[notificationService.requestPermission] Lỗi xin quyền:', error.message);
      return {
        granted: false,
        status: 'error',
        error: error.message,
      };
    }
  },

  async checkPermissionStatus() {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status;
    } catch (error) {
      return 'undetermined';
    }
  },

  async notifyOrderSuccess(orderId, totalAmount) {
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
