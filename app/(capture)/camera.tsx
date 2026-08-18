import { CameraView, type CameraType, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconButton } from "@/src/components/IconButton";
import { PermissionGate } from "@/src/components/PermissionGate";
import { ShutterButton } from "@/src/components/ShutterButton";
import {
  ShutterFlash,
  type ShutterFlashHandle,
} from "@/src/components/ShutterFlash";
import { haptics } from "@/src/lib/haptics";
import { colors, layout, spacing } from "@/src/theme";

export default function CameraScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const [capturing, setCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const flashRef = useRef<ShutterFlashHandle>(null);

  if (!permission) {
    // Permissions still loading.
    return <View style={styles.screen} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.screen}>
        <PermissionGate
          denied={!permission.canAskAgain}
          onRequest={requestPermission}
        />
        <View style={[styles.topBar, { top: insets.top + spacing.sm }]}>
          <IconButton
            name="x"
            accessibilityLabel="Close camera"
            color={colors.textPrimary}
            background={colors.surface}
            onPress={() => router.back()}
          />
        </View>
      </View>
    );
  }

  const onCapture = async () => {
    if (capturing) return;
    setCapturing(true);
    haptics.capture();
    flashRef.current?.flash();
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 1 });
      if (!photo?.uri) throw new Error("No photo returned");
      router.replace({
        pathname: "/processing",
        params: { rawUri: photo.uri },
      });
    } catch {
      haptics.error();
      setCapturing(false);
    }
  };

  return (
    <View style={styles.screen}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing} />

      <View style={[styles.topBar, { top: insets.top + spacing.sm }]}>
        <IconButton
          name="x"
          accessibilityLabel="Close camera"
          color="#FFFFFF"
          background="rgba(0,0,0,0.35)"
          onPress={() => router.back()}
        />
        <IconButton
          name="refresh-cw"
          accessibilityLabel="Flip camera"
          color="#FFFFFF"
          background="rgba(0,0,0,0.35)"
          onPress={() =>
            setFacing((f) => (f === "back" ? "front" : "back"))
          }
        />
      </View>

      <View style={[styles.bottomBar, { bottom: insets.bottom + spacing.xl }]}>
        <ShutterButton
          variant="camera"
          size={layout.captureSize}
          disabled={capturing}
          onPress={onCapture}
        />
      </View>

      <ShutterFlash ref={flashRef} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#000000",
  },
  topBar: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
});
