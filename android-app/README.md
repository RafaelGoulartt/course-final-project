# TCC Usage Collector

Aplicativo Android que vincula um dispositivo filho a um token criado no dashboard do responsável e envia o uso de aplicativos para a API Flask.

## Fluxo

1. O responsável cria um token em `/dashboard-pais`.
2. No APK, informe o token, o nome do filho e o endereço da API.
3. Autorize **Acesso ao uso** nas configurações do Android.
4. Toque em **Enviar dados de hoje**.
5. A API valida o token e grava os registros em `filhos`, `apps`, `instalacoes` e `tempo_uso` no Supabase.

## API local

Em um celular na mesma rede do computador, use:

```text
http://10.204.31.171:5000/api
```

A porta 5000 precisa estar liberada no Firewall do Windows. Para produção, use HTTPS e um domínio ou IP acessível pelo celular; não mantenha `usesCleartextTraffic` habilitado.

## Build

Abra `android-app` no Android Studio e execute **Build > Build APK(s)**. O APK debug será gerado em:

```text
app/build/outputs/apk/debug/app-debug.apk
```

O app coleta apenas pacotes que tiveram tempo em primeiro plano nas últimas 24 horas. A permissão especial de uso precisa ser concedida manualmente pelo usuário.