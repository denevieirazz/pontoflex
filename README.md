# PontoFlex - Controle de Ponto, Escala 1x1 e Horas Extras (PWA Offline)

Aplicativo desenvolvido para atender exatamente à sua rotina de trabalho em escala alternada (1 dia sim, 1 dia não), com registro de ponto, horas extras, alarme inteligente e cálculo financeiro mensal para comprovação na empresa.

---

## 🚀 Por que PWA em vez de APK?

1. **Atualização Automática sem Reinstalar APK**: Você instala o app direto pelo navegador do celular ("Adicionar à tela inicial" ou "Instalar Aplicativo"). Quando houver uma versão nova, ele atualiza automaticamente em segundo plano via **Service Worker** assim que conectar à internet. Nunca mais precisa baixar arquivos `.apk` repetidamente.
2. **100% Offline First**: Funciona sem sinal de internet. Todos os pontos, configurações e relatórios ficam salvos no armazenamento local do seu aparelho (`LocalStorage` / `IndexedDB`).
3. **Sincronização de Horário Inteligente**: Se tiver internet, ele checa a hora oficial da rede para garantir precisão; se estiver sem rede, usa o relógio do aparelho sem travar.

---

## ✨ Principais Funcionalidades

- **Bater Ponto com 1 Toque**:
  - Registra horário exato de Entrada e Saída.
  - Opção para registrar intervalo de almoço/refeição.
  - Lançamento e edição manual caso esqueça de bater na hora.
- **Escala 1x1 (Dia Sim / Dia Não)**:
  - Você só precisa cadastrar uma data em que trabalhou uma única vez. O app calcula todos os dias futuros e passados automaticamente.
  - Identifica no topo se hoje é **Dia de Trabalho** (verde) ou **Dia de Folga** (azul).
- **Alarme Inteligente da Escala**:
  - **Resolve a dor de mudar o despertador todo dia**: O alarme só toca nos dias em que você trabalha.
  - No dia de folga, o alarme permanece em silêncio para você descansar.
  - Toque sonoro sintetizado em código via **Web Audio API** (funciona 100% offline, sem depender de arquivos pesados de áudio).
- **Apuração de Horas Extras e Folgas Trabalhadas**:
  - Se você trabalhar no seu dia de folga (como mencionou que tem trabalhado quase todo dia), o app calcula automaticamente **100% de Horas Extras**.
  - Se passar da carga horária normal no dia de trabalho, calcula o excedente como horas extras (50%).
- **Cálculo Financeiro e Simulador Salarial**:
  - Baseado no seu salário base e divisor mensal CLT (220h ou 180h).
  - Mostra em tempo real o valor das horas extras em R$ e o total bruto estimado a receber no mês.
- **Comprovante Formal para a Empresa**:
  - **Espelho de Ponto para Impressão / Salvar em PDF**: Layout corporativo pronto com seus dados, dados da empresa, tabela de horários dia a dia e campos para assinatura.
  - **Exportação CSV para Excel**: Planilha compatível com Excel para envio por e-mail ou WhatsApp.
  - **Backup & Restauração JSON**: Garante que você nunca perca seus dados ao trocar de celular.

---

## 📂 Estrutura de Pastas (Organizada por Domínio)

```text
escala-ponto/
├── design/                 # Camada de Design e Interface
│   ├── tokens.css          # Cores, tipografia, bordas e temas
│   ├── layout.css          # Estrutura mobile, header, bottom bar
│   ├── componentes.css     # Botão gigante de ponto, cards, relógio
│   ├── toast.css           # Notificações visuais elegantes
│   ├── relatorio.css       # Estilos @media print para PDF da empresa
│   ├── ui.js               # Controlador principal de abas e eventos
│   ├── uiRender.js         # Atualizações dinâmicas do DOM
│   ├── uiModal.js          # Modal de edição manual de ponto
│   └── toast.js            # Notificações toast
├── logica/                 # Camada de Negócio e Regras
│   ├── storage.js          # Persistência offline local
│   ├── escala.js           # Motor da escala 1x1 (dia sim, dia não)
│   ├── ponto.js            # Apuração de horas normais e extras
│   ├── calculoSalario.js   # Cálculo financeiro de salário e extras R$
│   └── alarme.js           # Monitoramento do alarme inteligente
├── ferramentas/            # Módulos Executáveis e Utilitários
│   ├── audioAlarme.js      # Sintetizador sonoro Web Audio API
│   ├── exportador.js       # Gerador de PDF, CSV e Backup JSON
│   ├── syncDataHora.js     # Sincronizador de hora e status de rede
│   └── atualizador.js      # Gerenciador de atualizações OTA do PWA
├── icons/                  # Ícones em alta resolução para celular
│   ├── icon-192.png
│   └── icon-512.png
├── index.html              # Interface visual principal
├── manifest.webmanifest    # Manifesto PWA para instalação no celular
├── sw.js                   # Service Worker para cache 100% offline
└── server.mjs              # Servidor local para execução e testes
```

*Todos os arquivos de código e estilos respeitam o limite estrito de até 400 linhas.*

---

## 📱 Como Rodar e Instalar no Celular

### Opção 1: Rodar Localmente no seu Computador / Wi-Fi
1. Abra o terminal na pasta do projeto:
   ```powershell
   cd C:\Users\dougl\.gemini\antigravity\scratch\escala-ponto
   node server.mjs
   ```
2. Abra no navegador do computador: `http://localhost:3000`
3. Para abrir no celular conectado no mesmo Wi-Fi, acesse: `http://<IP-DO-SEU-PC>:3000`
4. No Chrome do celular, toque nos 3 pontinhos e selecione **"Adicionar à tela inicial"** ou **"Instalar Aplicativo"**.

### Opção 2: Hospedar na Nuvem Grátis (1 minuto)
Você pode subir a pasta para o **Vercel**, **Netlify** ou **GitHub Pages** (é 100% gratuito e leva 1 minuto). Dessa forma, você terá um link seguro com HTTPS (ex: `https://meuponto.vercel.app`), permitindo instalar direto no celular e receber atualizações automáticas sempre que você publicar melhorias!
