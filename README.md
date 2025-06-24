
# 🤖 Bot WhatsApp com IA

Um bot inteligente para WhatsApp que utiliza modelos de linguagem local (LM Studio) para responder mensagens de forma conversacional e útil.

## 📋 Características

- **Integração com WhatsApp Web**: Utiliza `whatsapp-web.js` para conectar ao WhatsApp
- **IA Local**: Integração com LM Studio para processamento de linguagem natural
- **Histórico de Conversas**: Armazena mensagens em banco SQLite para contexto
- **Sistema de Comandos**: Comandos especiais para gerenciar o bot
- **Whitelist**: Controle de acesso por contatos e grupos permitidos
- **Prompt Personalizado**: Possibilidade de definir prompts específicos por chat

## 🛠️ Tecnologias Utilizadas

- **Node.js** - Runtime JavaScript
- **whatsapp-web.js** - Biblioteca para WhatsApp Web
- **better-sqlite3** - Banco de dados SQLite
- **axios** - Cliente HTTP para requisições
- **qrcode-terminal** - Geração de QR code no terminal

## 📦 Instalação

1. **Clone o repositório**
```bash
git clone <url-do-repositorio>
cd bot
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure o LM Studio**
   - Instale o [LM Studio](https://lmstudio.ai/)
   - Carregue o modelo `phi-3-mini-4k-instruct`
   - Inicie o servidor local na porta 1234

4. **Configure os contatos permitidos**
   - Edite o arquivo `bot.js`
   - Adicione os números dos contatos na lista `ALLOWED_CONTACTS`
   - Format: `'5516999967801@c.us'`

## 🚀 Uso

1. **Inicie o bot**
```bash
node bot.js
```

2. **Escaneie o QR Code**
   - Um QR code aparecerá no terminal
   - Escaneie com o WhatsApp no seu celular

3. **Pronto!** O bot está funcionando

## 🎯 Comandos Disponíveis

| Comando | Descrição |
|---------|-----------|
| `!ajuda` ou `!help` | Mostra lista de comandos |
| `!historico [n]` | Exibe as últimas n mensagens (padrão: 5) |
| `!prompt <texto>` | Define um novo prompt-sistema para o chat |
| `!prompt reset` | Restaura o prompt padrão |
| `!reiniciar` | Zera o histórico do chat atual |

## ⚙️ Configuração

### Variáveis de Configuração (bot.js)

```javascript
// Prefixo para comandos
const PREFIX = '!';

// Prompt padrão do sistema
const DEFAULT_SYS = 'Você é um assistente amigável...';

// Mensagens do sistema
const TYPING_MSG = '⏳ Estou pensando…';
const WELCOME_MSG = '👋 Olá! Eu sou o Assistente IA...';

// Listas de permissão
const ALLOWED_CONTACTS = new Set([
  '5516999967801@c.us', // Adicione seus contatos aqui
]);

const ALLOWED_GROUPS = new Set([
  // '45661321656651@g.us', // Adicione grupos se necessário
]);
```

### Configuração do LLM (services/llmClient.js)

```javascript
const LMSTUDIO_URL = 'http://127.0.0.1:1234/v1/chat/completions';
const MODEL = 'phi-3-mini-4k-instruct';
const TEMPERATURE = 0.7;
```

## 📁 Estrutura do Projeto

```
bot/
├── bot.js                 # Arquivo principal do bot
├── package.json          # Dependências e scripts
├── db/                   # Banco de dados
│   └── chat.db          # Arquivo SQLite
└── services/            # Serviços auxiliares
    ├── database.js      # Operações de banco de dados
    └── llmClient.js     # Cliente para comunicação com LLM
```

## 🗄️ Banco de Dados

O bot utiliza SQLite para armazenar o histórico de conversas:

```sql
CREATE TABLE messages (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  chatId  TEXT,
  role    TEXT,      -- 'user' | 'assistant'
  content TEXT,
  ts      DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🔧 Funcionalidades Técnicas

### Autenticação
- Usa `LocalAuth` para manter a sessão persistente
- QR code gerado automaticamente no terminal

### Processamento de Mensagens
- Filtragem por whitelist de contatos/grupos
- Histórico contextual das últimas 10 mensagens
- Timeout de 60 segundos para respostas da IA

### Gerenciamento de Estado
- Prompts personalizados por chat
- Histórico persistente em SQLite
- Comandos para resetar contexto

## 🚨 Requisitos

- **Node.js** 18.0.0 ou superior
- **LM Studio** com modelo carregado
- **WhatsApp** instalado no celular

## 🔒 Segurança

- Lista branca de contatos para controle de acesso
- Mensagens do próprio bot são ignoradas
- Timeout configurável para evitar travamentos

## 🐛 Troubleshooting

### Bot não responde
- Verifique se o LM Studio está rodando na porta 1234
- Confirme se o contato está na lista de permitidos
- Verifique os logs no console

### Erro de conexão
- Reinstale as dependências: `npm install`
- Limpe o cache de autenticação (pasta `.wwebjs_auth`)
- Verifique a conexão com a internet

### QR Code não aparece
- Certifique-se que o terminal suporta exibição de QR codes
- Tente usar um terminal diferente

## 📄 Licença

Este projeto está sob a licença ISC.

## 🤝 Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para:
- Reportar bugs
- Sugerir melhorias
- Enviar pull requests

---

**Nota**: Este bot é para uso educacional e pessoal. Respeite os termos de uso do WhatsApp.
