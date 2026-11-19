# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## Verificações de qualidade

Antes de abrir um Pull Request, execute as mesmas verificações usadas pelo CI:

```bash
npm ci
npm run lint
npx tsc --noEmit
npm test -- --runInBand
```

O repositório possui um workflow do GitHub Actions que executa automaticamente essas verificações em Pull Requests e em pushes para a branch `main`.

O Pull Request só deve ser integrado quando lint, verificação de tipos e testes estiverem passando.

## Banco de dados e migrations

O schema consolidado atual do Supabase está documentado em [`docs/schema-supabase.md`](docs/schema-supabase.md).

Toda alteração permanente no schema do Supabase deve ser versionada em `supabase/migrations/`. Mudanças feitas diretamente pelo Dashboard ou SQL Editor também devem receber uma migration correspondente no repositório.

Não devem ser criadas tabelas, colunas, funções, triggers, policies ou outras alterações permanentes somente no ambiente remoto sem registro no Git.
