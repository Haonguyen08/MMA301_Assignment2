/**
 * =========================================================================
 * NOTIFICATION SERVICE - DỊCH VỤ THÔNG BÁO CỤC BỘ & QUẢN LÝ QUYỀN HẠN
 * =========================================================================
 * 1. Purpose (Trách nhiệm):
 *    - Quản lý xin quyền thông báo từ hệ điều hành (Android / iOS).
 *    - Kích hoạt thông báo đẩy cục bộ (Local Push Notification) gắn với nghiệp vụ:
 *      + Sự kiện 1: Đặt hàng thành công (Order Placed Event).
 *      + Sự kiện 2: Thông báo khuyến mãi Flash Sale (Promotion Event).
 * 
 * 2. Input:
 *    - title, body, data payload (mã đơn hàng, tổng tiền).
 * 
 * 3. Trigger:
 *    - Khi người dùng hoàn tất thanh toán giỏ hàng (Cart Checkout).
 *    - Khi người dùng bấm nút kiểm thử thông báo trong màn hình Cài đặt (Settings).
 * 
 * 4. Transform:
 *    - Kiểm tra trạng thái cấp quyền (Granted / Denied).
 *    - Đóng gói nội dung và lên lịch hiển thị tức thì qua Notifications.scheduleNotificationAsync().
 * 
 * 5. Output / Failure:
 *    - Hiển thị pop-up thông báo trên thanh trạng thái điện thoại.
 *    - Nếu người dùng từ chối cấp quyền (Denied): KHÔNG crash app, ghi nhận trạng thái
 *      và hướng dẫn người dùng qua giao diện ứng dụng.
 * =========================================================================
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Cấu hình cách thức hiển thị thông báo khi ứng dụng đang mở ở tiền cảnh (Foreground)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const notificationService = {
  /**
   * Yêu cầu người dùng cấp quyền nhận thông báo
   */
  async requestPermission() {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      // Cấu hình Channel cho Android để thông báo có âm thanh và độ ưu tiên cao
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

  /**
   * Kiểm tra quyền hiện tại mà không làm hiện pop-up xin quyền
   */
  async checkPermissionStatus() {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status;
    } catch (error) {
      return 'undetermined';
    }
  },

  /**
   * Bắn thông báo nghiệp vụ: Đặt hàng thành công (Order Placed)
   * @param {string} orderId 
   * @param {number} totalAmount 
   */
  async notifyOrderSuccess(orderId, totalAmount) {
    try {
      const { granted } = await this.requestPermission();
      if (!granted) {
        console.log('[notificationService] Quyền thông báo bị từ chối. Bỏ qua gửi notification.');
        return false;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🎉 Đặt hàng thành công!',
          body: `Đơn hàng #${orderId.slice(-6).toUpperCase()} trị giá $${totalAmount.toFixed(2)} đã được ghi nhận vào hệ thống.`,
          data: { orderId, totalAmount },
        },
        trigger: null, // Gửi ngay lập tức
      });

      return true;
    } catch (error) {
      console.warn('[notificationService.notifyOrderSuccess] Lỗi gửi thông báo:', error.message);
      return false;
    }
  },

  /**
   * Bắn thông báo nghiệp vụ: Khuyến mãi Flash Sale
   */
  async notifyFlashSale() {
    try {
      const { granted } = await this.requestPermission();
      if (!granted) {
        return false;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔥 Siêu Sale Hôm Nay!',
          body: 'Giảm giá lên đến 50% cho tất cả các sản phẩm làm đẹp & gia dụng.',
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
