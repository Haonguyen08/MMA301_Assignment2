import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const CartItem = ({ item, onUpdateQuantity, onRemove }) => {
  return (
    <View style={styles.card}>
      {item.thumbnail ? (
        <Image source={{ uri: item.thumbnail }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={[styles.image, styles.noImage]}>
          <Ionicons name="image-outline" size={24} color="#94A3B8" />
        </View>
      )}

      <View style={styles.details}>
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => onRemove(item.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>

        <Text style={styles.price}>${Number(item.price).toFixed(2)}</Text>

        <View style={styles.actionRow}>
          <View style={styles.stepper}>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => onUpdateQuantity(item.id, item.quantity - 1)}
            >
              <Ionicons name="remove" size={16} color="#334155" />
            </TouchableOpacity>

            <Text style={styles.quantityText}>{item.quantity}</Text>

            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => onUpdateQuantity(item.id, item.quantity + 1)}
            >
              <Ionicons name="add" size={16} color="#334155" />
            </TouchableOpacity>
          </View>

          <Text style={styles.itemTotal}>
            ${(Number(item.price) * item.quantity).toFixed(2)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  image: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  noImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  details: {
    flex: 1,
    marginLeft: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
  },
  deleteButton: {
    padding: 2,
  },
  price: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  stepBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  quantityText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    paddingHorizontal: 8,
    minWidth: 28,
    textAlign: 'center',
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563EB',
  },
});
