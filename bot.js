import whatsapp from 'whatsapp-web.js';
const { Client, LocalAuth } = whatsapp;

import qrcode from 'qrcode-terminal';
import * as db from './services/database.js';
import { askLLM } from './services/llmClient.js';

// CONFIGURAÇÕES

// Comandos fora da IA
const PREFIX = '!';

// Prompt-sistema padrão
const DEFAULT_SYS =
  'Você é um assistente amigável que ajuda pessoas no WhatsApp. Dê respostas curtas e úteis, limite exemplos a 2-3 itens, e seja conversacional. Evite formatações complexas ou respostas muito longas.';

// Mensagens fixas
const TYPING_MSG  = '⏳ Estou pensando…';
const WELCOME_MSG =
`👋 Olá! Eu sou o Assistente IA.
Envie !ajuda para ver todos os comandos disponiveis.`;

// === LISTAS DE PERMISSÃO ===
const ALLOWED_CONTACTS = new Set([
  '5516999967801@c.us',
]);

const ALLOWED_GROUPS = new Set([
  // '45661321656651@g.us',
]);

// CLIENTE WHATSAPP

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
});

// EVENTOS BÁSICOS

client.on('qr', qr => qrcode.generate(qr, { small: true }));
client.on('ready', () => console.log('✅ Bot conectado e pronto!'));

// MANIPULAÇÃO DE MENSAGENS

client.on('message', async msg => {
  // Ignora mensagens enviadas pelo próprio bot
  if (msg.fromMe) return;

  // Filtro de whitelist
  const chatId  = msg.from;
  const isGroup = chatId.endsWith('@g.us');

  if (
    (!isGroup && !ALLOWED_CONTACTS.has(chatId)) ||
    (isGroup  && !ALLOWED_GROUPS.has(chatId))
  ) {
    return; // Silêncio
  }

  const text = msg.body.trim();

  // Primeira interação - manda boas-vindas
  if (!db.hasMessages(chatId)) {
    await msg.reply(WELCOME_MSG);
  }

  // Comandos fora da IA
  if (text.startsWith(PREFIX)) {
    await handleCommand(msg, text.slice(PREFIX.length).trim());
    return;
  }

  // Fluxo normal via LLM
  const sysPrompt = promptOverride.get(chatId) || DEFAULT_SYS;

  // Grava a mensagem do usuário
  db.saveMessage(chatId, 'user', text);

  // UX: envia “pensando…”
  const thinking = await msg.reply(TYPING_MSG);

  try {
    const history = db.getLastMessages(chatId, 10);
    const answer  = await askLLM(sysPrompt, history, text);

    await thinking.delete(true).catch(() => {});   // remove “pensando…”
    await msg.reply(answer);                       // responde
    db.saveMessage(chatId, 'assistant', answer);   // grava no BD

  } catch (err) {
    console.error(err);
    await thinking.edit('❌ Erro ao contatar o modelo. Tente de novo.');
  }
});

// COMANDOS CUSTOMIZADOS

const promptOverride = new Map();   // prompt personalizado por chat

async function handleCommand(msg, cmdLine) {
  const [cmd, ...args] = cmdLine.split(' ');

  switch (cmd.toLowerCase()) {

    case 'ajuda':
    case 'help':
      await msg.reply(
`📖 *Comandos disponíveis*
!ajuda / !help          – mostra esta ajuda
!historico [n=5]        – exibe as *n* últimas mensagens
!prompt <texto>         – define novo prompt-sistema p/ esse chat
!prompt reset           – restaura o prompt padrão
!reiniciar              – zera todo o histórico deste chat`
      );
      break;

    case 'historico': {
      const n   = parseInt(args[0]) || 5;
      const log = db.getLastMessages(msg.from, n)
                    .map(r => `${r.role === 'user' ? '👤' : '🤖'}: ${r.content}`)
                    .join('\n');
      await msg.reply(log || 'Histórico vazio.');
      break;
    }

    case 'prompt':
      if (args[0] === 'reset') {
        promptOverride.delete(msg.from);
        await msg.reply('✅ Prompt restaurado ao padrão.');
      } else {
        const newPrompt = args.join(' ');
        promptOverride.set(msg.from, newPrompt);
        await msg.reply(`✅ Novo prompt definido:\n"${newPrompt}"`);
      }
      break;

    case 'reiniciar':
    case 'reset':
      db.clearHistory(msg.from);
      promptOverride.delete(msg.from);
      await msg.reply('♻️ Conversa reiniciada. O histórico anterior não será considerado.');
      break;

    default:
      await msg.reply('❓ Comando não reconhecido. Digite !ajuda para ver a lista.');
  }
}

client.initialize();