import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';

// Placeholder สำหรับแผนที่เมื่อใช้ Expo Go
export default function MapPlaceholder({ 
  onMarkerDrag, 
  markerCoordinate, 
  markerTitle,
  style 
}) {
  const simulateMarkerDrag = () => {
    // จำลองการลากปิ่นด้วยค่าพิกัดใหม่
    const newCoordinate = {
      latitude: markerCoordinate.latitude + (Math.random() - 0.5) * 0.001,
      longitude: markerCoordinate.longitude + (Math.random() - 0.5) * 0.001
    };
    
    if (onMarkerDrag) {
      onMarkerDrag({
        nativeEvent: {
          coordinate: newCoordinate
        }
      });
    }
  };

  return (
    <View style={[styles.container, style]}>
      <Card style={styles.card}>
        <Card.Content style={styles.content}>
          <Text variant="headlineSmall" style={styles.title}>
            🗺️ แผนที่
          </Text>
          
          <Text variant="bodyMedium" style={styles.description}>
            สำหรับการใช้งานแผนที่เต็มรูปแบบ
            ต้องสร้าง Development Build
          </Text>
          
          <View style={styles.coordinateInfo}>
            <Text variant="bodyMedium" style={styles.coordinateLabel}>
              ตำแหน่งปัจจุบัน:
            </Text>
            <Text variant="bodySmall" style={styles.coordinate}>
              {markerCoordinate.latitude.toFixed(6)}, {markerCoordinate.longitude.toFixed(6)}
            </Text>
          </View>
          
          <Button
            mode="contained"
            onPress={simulateMarkerDrag}
            style={styles.button}
            icon="map-marker"
          >
            จำลองการปรับตำแหน่ง
          </Button>
          
          <Text variant="bodySmall" style={styles.note}>
            หมายเหตุ: ใน Development Build จริง 
            จะสามารถลากปิ่นบนแผนที่ได้
          </Text>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
  },
  content: {
    alignItems: 'center',
  },
  title: {
    color: '#2196F3',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  coordinateInfo: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    width: '100%',
  },
  coordinateLabel: {
    fontWeight: '500',
    marginBottom: 4,
  },
  coordinate: {
    fontFamily: 'monospace',
    color: '#2196F3',
  },
  button: {
    marginBottom: 16,
  },
  note: {
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});