import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { Text } from 'react-native-paper';

// Web-based map component ที่ใช้ได้กับ Expo Go
export default function WebMapView({ 
  initialRegion, 
  onMarkerDrag, 
  markerCoordinate, 
  markerTitle,
  style 
}) {
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, style]}>
        <Text>แผนที่ (รองรับเฉพาะ Native Build)</Text>
      </View>
    );
  }

  const mapHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Simple Map</title>
      <style>
        body { margin: 0; padding: 0; height: 100vh; }
        #map { height: 100%; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        function initMap() {
          const lat = ${initialRegion?.latitude || 15.0};
          const lng = ${initialRegion?.longitude || 104.0};
          
          const map = new google.maps.Map(document.getElementById("map"), {
            zoom: 15,
            center: { lat: lat, lng: lng }
          });
          
          const marker = new google.maps.Marker({
            position: { lat: lat, lng: lng },
            map: map,
            draggable: true,
            title: "${markerTitle || 'ตำแหน่งการจับปลา'}"
          });
          
          marker.addListener('dragend', function(e) {
            const newLat = e.latLng.lat();
            const newLng = e.latLng.lng();
            
            // ส่งข้อมูลกลับไปยัง React Native
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'markerDrag',
              coordinate: { latitude: newLat, longitude: newLng }
            }));
          });
        }
      </script>
      <script async defer
        src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&callback=initMap">
      </script>
    </body>
    </html>
  `;

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'markerDrag' && onMarkerDrag) {
        onMarkerDrag({
          nativeEvent: {
            coordinate: data.coordinate
          }
        });
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  return (
    <WebView
      style={[styles.container, style]}
      source={{ html: mapHTML }}
      onMessage={handleMessage}
      javaScriptEnabled={true}
      domStorageEnabled={true}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
});