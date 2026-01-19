# 🏃‍♂️ TimeRunner - Guia de Produção

Este documento detalha os passos necessários para colocar o TimeRunner em um ambiente de produção real, garantindo que as funcionalidades de GPS, Áudio e Compartilhamento funcionem perfeitamente em dispositivos móveis.

## 1. Requisito Obrigatório: HTTPS
As APIs modernas de navegador utilizadas neste app **não funcionam** em conexões inseguras (HTTP):
- **Geolocation API**: O rastreio de corrida será bloqueado.
- **Web Share API**: O botão de compartilhar não aparecerá.
- **Screen Wake Lock**: A tela apagará durante a corrida.
- **Service Workers**: Essenciais para funcionamento offline.

> **Ação:** Certifique-se de que seu provedor de hospedagem (Vercel, Netlify, Firebase Hosting) fornece um certificado SSL válido.

## 2. Configuração de PWA (Progressive Web App)
Para que o usuário possa "Instalar" o app no celular e ele apareça na tela inicial sem as barras do navegador:

### Criar `manifest.json`
Crie um arquivo na raiz do projeto chamado `manifest.json`:
```json
{
  "name": "TimeRunner - Treino Intervalado",
  "short_name": "TimeRunner",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#4f46e5",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Registrar no `index.html`
Adicione as seguintes tags dentro do `<head>`:
```html
<link rel="manifest" href="/manifest.json">
<link rel="apple-touch-icon" href="/icon-192.png">
```

## 3. Estratégia de Cache Offline
Como corredores podem passar por áreas sem sinal, é recomendável adicionar um **Service Worker**.
- Utilize bibliotecas como **Workbox** para fazer o cache dos scripts (React, Tailwind) e fontes do Google.
- Isso garante que o app abra instantaneamente mesmo sem internet.

## 4. Notas sobre Dispositivos Específicos

### iOS (Safari/iPhone)
- O iOS é mais restritivo com o **AudioContext**. O primeiro som de alerta *deve* ser disparado por um clique do usuário (o que já fazemos no botão "Start").
- A **Web Share API** no iOS funciona muito bem para arquivos, permitindo enviar o card diretamente para o Instagram Stories.

### Android (Chrome)
- O Chrome para Android pode exigir permissão explícita para "Notificações" se você decidir adicionar avisos em segundo plano no futuro.

## 5. Limitações do Banco de Dados Local
O app utiliza **IndexedDB** (`services/db.ts`).
- **Backup**: Os dados ficam salvos apenas no navegador do usuário. Se ele limpar o cache do navegador ou trocar de celular, os recordes serão perdidos.
- **Produção**: Para um app comercial, você precisaria de um backend (Firebase, Supabase ou Node.js) para sincronizar os treinos entre dispositivos.

## 6. Checklist de Lançamento
1. [ ] Testar em ambiente HTTPS.
2. [ ] Validar se o GPS solicita permissão ao iniciar o treino.
3. [ ] Verificar se o som de alerta toca mesmo com o celular em modo silencioso (no Android). No iOS, o usuário precisa estar com a chave física de som ligada.
4. [ ] Gerar um ícone de 192px e 512px com fundo opaco para o PWA.
5. [ ] Testar a função de compartilhar imagem em um dispositivo físico real.
