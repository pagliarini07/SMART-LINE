import { Text, TextInput, View } from "react-native";

export default function Index() {
  return (
    <View>
      <Text>SmartLine</Text>

      <Text>Olá, Lucas!</Text>

      <Text>
        Encontre o serviço que precisa e acompanhe sua fila.
      </Text>

      <TextInput
        placeholder="Buscar órgão ou serviço"
      />
    </View>
  );
}