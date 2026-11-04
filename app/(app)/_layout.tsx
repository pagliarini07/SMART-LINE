import { Redirect, Stack } from "expo-router";
import TelaCarregando from "../../components/TelaCarregando";
import { useAuth } from "../../hooks/useAuth";

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <TelaCarregando />;
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
      <Stack.Screen name="historico" />
      <Stack.Screen name="conquistas" />
      <Stack.Screen name="notificacoes" />
      <Stack.Screen name="recomendacao" />
    </Stack>
  );
}
