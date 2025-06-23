import whatsapp from 'whatsapp-web.js';
const { Client, LocalAuth } = whatsapp;

import qrcode from 'qrcode-terminal';
import * as db from './services/database.js';
import { askLLM } from './services/llmClient.js';

/* =============== CONFIGURAÇÕES =============== */

// Comandos fora da IA
const PREFIX      = '!';

// Prompt-sistema padrão
const DEFAULT_SYS = 'Você é um assistente amigável que ajuda pessoas no WhatsApp. Dê respostas curtas e úteis, limite exemplos a 2-3 itens, e seja conversacional. Evite formatações complexas ou respostas muito longas.';

// Mensagem “pensando…”
const TYPING_MSG  = '⏳ Estou pensando…';

// === LISTAS DE PERMISSÃO ===
// Coloque aqui os IDs que podem conversar com o bot.
//
// Contatos individuais:   '5511998765432@c.us'
// Grupos:                 '120363025423456789@g.us'
const ALLOWED_CONTACTS = new Set([
    '5516999981818@c.us',
]);

const ALLOWED_GROUPS = new Set([
  // '120363025423456789@g.us',
]);

/* =============== CLIENTE WHATSAPP =============== */

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

/* =============== EVENTOS BÁSICOS =============== */

client.on('qr', qr => qrcode.generate(qr, { small: true }));
client.on('ready', () => console.log('✅ Bot conectado e pronto!'));

/* =============== MANIPULAÇÃO DE MENSAGENS =============== */

client.on('message', async msg => {

  /* 0) Ignora mensagens enviadas pelo próprio bot */
  if (msg.fromMe) return;

  /* 1) Filtro de whitelist */
  const chatId = msg.from;               // ex.: 5511...@c.us  ou  1203...@g.us
  const isGroup = chatId.endsWith('@g.us');

  if (
    (!isGroup && !ALLOWED_CONTACTS.has(chatId)) ||
    (isGroup  && !ALLOWED_GROUPS.has(chatId))
  ) {
    return;  // Sai silenciosamente
  }

  const text = msg.body.trim();

  /* 2) Comandos fora da IA */
  if (text.startsWith(PREFIX)) {
    await handleCommand(msg, text.slice(PREFIX.length).trim());
    return;
  }

  /* 3) Fluxo normal via LLM */
  const sysPrompt = promptOverride.get(chatId) || DEFAULT_SYS;

  // Grava a mensagem do usuário
  db.saveMessage(chatId, 'user', text);

  // UX: envia “pensando…”
  const thinking = await msg.reply(TYPING_MSG);

  try {
    const history = db.getLastMessages(chatId, 10);
    const answer  = await askLLM(sysPrompt, history, text);

    await thinking.delete(true).catch(() => {});       // remove “pensando…”
    await msg.reply(answer);                           // responde
    db.saveMessage(chatId, 'assistant', answer);       // grava no BD

  } catch (err) {
    console.error(err);
    await thinking.edit('❌ Erro ao contatar o modelo. Tente de novo.');
  }
});

/* =============== COMANDOS CUSTOMIZADOS =============== */

const promptOverride = new Map();   // prompt personalizado por chat

async function handleCommand(msg, cmdLine) {
  const [cmd, ...args] = cmdLine.split(' ');

  switch (cmd.toLowerCase()) {

    case 'ajuda':
      await msg.reply(
`Comandos disponíveis:
!ajuda                 – mostra esta ajuda
!historico [n=5]       – mostra as n últimas mensagens
!prompt <texto>        – define novo prompt-sistema p/ essa conversa
!prompt reset          – volta ao prompt padrão`
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
        await msg.reply('Prompt restaurado ao padrão.');
      } else {
        const newPrompt = args.join(' ');
        promptOverride.set(msg.from, newPrompt);
        await msg.reply(`Novo prompt definido:\n"${newPrompt}"`);
      }
      break;

    default:
      await msg.reply('Comando não reconhecido. Use !ajuda');
  }
}

client.initialize();