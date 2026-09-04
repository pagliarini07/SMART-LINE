import { Stack } from "expo-router";

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="locais" />
      <Stack.Screen name="servicos" />
      <Stack.Screen name="fila" />
    </Stack>
  );
}
