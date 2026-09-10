import { Redirect, Stack } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="locais" />
      <Stack.Screen name="servicos" />
      <Stack.Screen name="fila" />
      <Stack.Screen name="minha-senha" />
      <Stack.Screen name="perfil" />
    </Stack>
  );
}
