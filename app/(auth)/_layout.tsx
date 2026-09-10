import { Redirect, Stack } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return <Redirect href="/locais" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="cadastro" />
    </Stack>
  );
}
