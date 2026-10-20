/**
 * =========================================================================
 * SETTINGS SCREEN - MÀN HÌNH CÀI ĐẶT, THÔNG BÁO & KIỂM THỬ ĐÁNH GIÁ
 * =========================================================================
 * 1. Purpose (Trách nhiệm):
 *    - Quản lý và kiểm tra quyền thông báo (Notification Permission Status).
 *    - Cung cấp các nút kiểm thử nghiệp vụ thông báo (Flash Sale Push).
 *    - Cung cấp công cụ Giả lập lỗi Firebase (Error Simulation Switch) phục vụ
 *      Test Case #10 và Test Case #11 cho buổi chấm vấn đáp trực tiếp.
 *    - Hiển thị thông tin sinh viên và phiên bản đồ án.
 * 
 * 2. Input:
 *    - Trạng thái quyền từ notificationService.
 *    - Trạng thái giả lập lỗi từ firebaseService.
 * 
 * 3. Trigger:
 *    - Bấm nút "Xin quyền thông báo", "Gửi thông báo thử nghiệm", "Bật/tắt mô phỏng lỗi".
 * 
 * 4. Transform:
 *    - Cập nhật cờ trong firebaseService và gọi notificationService.
 * 
 * 5. Output / Failure:
 *    - Hiển thị trạng thái cấp quyền (Granted / Denied) trực quan, có giải thích rõ ràng.
 * =========================================================================
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { notificationService } from '../api/notificationService';
import { firebaseService } from '../api/firebaseService';
import { CONFIG } from '../config/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SettingsScreen = () => {
  const [permissionStatus, setPermissionStatus] = useState('undetermined');
  const [simulateFirebaseError, setSimulateFirebaseError] = useState(
    firebaseService.isSimulatingError()
  );

  // Kiểm tra trạng thái quyền thông báo khi mở màn hình
  const checkPermission = async () => {
    const status = await notificationService.checkPermissionStatus();
    setPermissionStatus(status);
  };

  useEffect(() => {
    checkPermission();
  }, []);

  // Xin quyền thông báo
  const handleRequestPermission = async () => {
    const res = await notificationService.requestPermission();
    setPermissionStatus(res.status);
    if (res.granted) {
      Alert.alert('Thành công', 'Đã được cấp quyền gửi thông báo!');
    } else {
      Alert.alert(
        'Quyền bị từ chối',
        'Ứng dụng không thể gửi thông báo đơn hàng do bạn đã từ chối quyền. Hãy mở Cài đặt thiết bị nếu muốn bật lại.'
      );
    }
  };

  // Bắn thông báo thử nghiệm
  const handleTestNotification = async () => {
    const sent = await notificationService.notifyFlashSale();
    if (!sent) {
      Alert.alert(
        'Thông báo chưa gửi được',
        'Vui lòng cấp quyền thông báo trước bằng cách bấm "Yêu cầu cấp quyền" bên trên.'
      );
    }
  };

  // Bật/tắt chế độ mô phỏng lỗi Firebase (Dành cho buổi chấm Test Case #10)
  const handleToggleFirebaseError = (value) => {
    setSimulateFirebaseError(value);
    firebaseService.setSimulateError(value);
    Alert.alert(
      'Chế độ kiểm thử Firebase',
      value
        ? 'ĐÃ BẬT: Các thao tác lưu Wishlist và Đơn hàng sẽ cố tình báo lỗi mạng/quyền để kiểm tra khả năng phục hồi (Error Handling).'
        : 'ĐÃ TẮT: Hệ thống hoạt động bình thường.'
    );
  };

  // Xóa bộ nhớ đệm cục bộ
  const handleClearCache = async () => {
    Alert.alert('Xác nhận', 'Bạn có muốn đặt lại toàn bộ dữ liệu cục bộ?', [
      { text: 'Hủy' },
      {
        text: 'Đồng ý',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.clear();
          Alert.alert('Đã xóa', 'Bộ nhớ đệm đã được làm mới. Vui lòng khởi động lại app.');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Phần 1: Quản lý Thông báo (R09) */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Thông báo hệ thống (R09)</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Ionicons name="notifications-outline" size={22} color="#2563EB" />
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.rowTitle}>Trạng thái quyền thông báo</Text>
                  <Text style={styles.rowSubtitle}>
                    {permissionStatus === 'granted'
                      ? '✓ Đã cấp quyền (Allowed)'
                      : permissionStatus === 'denied'
                      ? '✗ Đã bị từ chối (Denied)'
                      : 'Chưa xác định (Undetermined)'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.btnSmall,
                  permissionStatus === 'granted' ? styles.btnSuccess : styles.btnPrimary,
                ]}
                onPress={handleRequestPermission}
              >
                <Text style={styles.btnSmallText}>
                  {permissionStatus === 'granted' ? 'Kiểm tra' : 'Xin quyền'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.actionRow}
              onPress={handleTestNotification}
              activeOpacity={0.7}
            >
              <Ionicons name="megaphone-outline" size={20} color="#059669" />
              <Text style={styles.actionRowText}>Bắn thông báo thử nghiệm (Flash Sale)</Text>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Phần 2: Kiểm thử lỗi Đám mây & AI (Testing & Debug Verification) */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Công cụ Kiểm thử & Đánh giá (Test Matrix)</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={[styles.rowLeft, { flex: 1 }]}>
                <Ionicons name="bug-outline" size={22} color="#DC2626" />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={styles.rowTitle}>Mô phỏng lỗi Firebase (Test #10)</Text>
                  <Text style={styles.rowSubtitle}>
                    Cố tình kích hoạt Exception khi ghi/đọc để kiểm chứng app không bị crash.
                  </Text>
                </View>
              </View>

              <Switch
                value={simulateFirebaseError}
                onValueChange={handleToggleFirebaseError}
                trackColor={{ false: '#CBD5E1', true: '#F87171' }}
                thumbColor={simulateFirebaseError ? '#DC2626' : '#F1F5F9'}
              />
            </View>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.actionRow}
              onPress={handleClearCache}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh-circle-outline" size={20} color="#D97706" />
              <Text style={styles.actionRowText}>Xóa toàn bộ Cache & AsyncStorage (Test #8)</Text>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Phần 3: Thông tin Đồ án & Cấu hình */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Thông tin sinh viên & Môn học</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Môn học:</Text>
              <Text style={styles.infoVal}>MMA301 - Multiplatform Mobile App</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Bài làm:</Text>
              <Text style={styles.infoVal}>Assignment 02 - Integrated Mobile App</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Sinh viên:</Text>
              <Text style={styles.infoVal}>{CONFIG.STUDENT_NAME}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Lớp:</Text>
              <Text style={styles.infoVal}>{CONFIG.CLASS_CODE}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Remote API:</Text>
              <Text style={styles.infoVal}>DummyJSON Products</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>AI Model:</Text>
              <Text style={styles.infoVal}>{CONFIG.GEMINI_MODEL}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  rowSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  btnSmall: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  btnPrimary: {
    backgroundColor: '#2563EB',
  },
  btnSuccess: {
    backgroundColor: '#059669',
  },
  btnSmallText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  actionRowText: {
    fontSize: 14,
    color: '#1E293B',
    marginLeft: 10,
    flex: 1,
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  infoKey: {
    fontSize: 13,
    color: '#64748B',
  },
  infoVal: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },
});
