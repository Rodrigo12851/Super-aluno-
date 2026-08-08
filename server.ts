import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, Modality } from '@google/genai';
import { YoutubeTranscript } from 'youtube-transcript';

const app = express();
const PORT = 3000;

// Increase body parser limit to support base64 audio/video/pdf uploads up to 100MB
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Helper to extract YouTube video ID
// Helper to extract YouTube video ID from any valid YouTube URL format
function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // Standard regex matching YouTube ID patterns (watch?v=, shorts/, live/, embed/, youtu.be/, etc.)
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|live\/|watch\?v=|\&v=)([^#\&\?\s\/]*).*/;
  const match = trimmed.match(regExp);
  if (match && match[2] && match[2].length === 11) {
    return match[2];
  }

  // Fallback URL parsing
  try {
    const urlObj = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
      const v = urlObj.searchParams.get('v');
      if (v && v.length === 11) return v;

      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      for (const part of pathParts) {
        if (part.length === 11 && !part.includes('.')) {
          return part;
        }
      }
    }
  } catch {}

  // Direct 11-char ID
  if (trimmed.length === 11 && !trimmed.includes('/') && !trimmed.includes('.') && !trimmed.includes(' ')) {
    return trimmed;
  }

  return null;
}

// Fetch YouTube Transcript and Video Metadata (oEmbed + YoutubeTranscript)
async function getYouTubeTranscriptAndInfo(youtubeUrlOrId: string) {
  const videoId = extractYouTubeVideoId(youtubeUrlOrId);
  if (!videoId) {
    throw new Error('URL do vídeo do YouTube inválida. Verifique se o link está correto (ex: https://www.youtube.com/watch?v=...).');
  }

  let videoTitle = `Aula do YouTube (${videoId})`;
  let channelName = '';
  let thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  let transcriptText = '';
  let hasCaption = false;

  // 1. Fetch Official YouTube oEmbed metadata for accurate title, channel and thumbnail
  try {
    const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    if (oembedRes.ok) {
      const oembedData = await oembedRes.json() as any;
      if (oembedData && oembedData.title) {
        videoTitle = oembedData.title;
      }
      if (oembedData && oembedData.author_name) {
        channelName = oembedData.author_name;
      }
      if (oembedData && oembedData.thumbnail_url) {
        thumbnailUrl = oembedData.thumbnail_url;
      }
    }
  } catch (oembedErr) {
    console.warn('Could not fetch oEmbed metadata:', oembedErr);
  }

  // 2. Fetch transcript via YoutubeTranscript
  try {
    let transcriptItems: any[] | null = null;
    try {
      transcriptItems = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'pt' });
    } catch {
      try {
        transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
      } catch {
        transcriptItems = null;
      }
    }

    if (transcriptItems && transcriptItems.length > 0) {
      hasCaption = true;
      transcriptText = transcriptItems.map((item) => {
        const totalSeconds = Math.floor((item.offset || 0) / 1000);
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        const timeStr = `[${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}]`;
        return `${timeStr} ${item.text}`;
      }).join('\n');
    }
  } catch (err) {
    console.warn('Transcript notice for video ID:', videoId);
  }

  // 3. Page title check fallback if title still default
  if (videoTitle.startsWith('Aula do YouTube')) {
    try {
      const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
        }
      });
      if (pageRes.ok) {
        const html = await pageRes.text();
        const ogTitleMatch = html.match(/<meta\s+property="og:title"\s+content="(.*?)"/i) || html.match(/<title>(.*?)<\/title>/i);
        if (ogTitleMatch && ogTitleMatch[1]) {
          const cleanTitle = ogTitleMatch[1].replace('- YouTube', '').trim();
          if (cleanTitle && cleanTitle !== 'YouTube') {
            videoTitle = cleanTitle;
          }
        }
      }
    } catch (metaErr) {
      console.warn('Could not fetch YouTube video HTML title:', metaErr);
    }
  }

  return {
    videoId,
    videoTitle,
    channelName,
    thumbnailUrl,
    transcriptText,
    hasCaption,
    youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`
  };
}

// Helper function for calling Gemini with model fallback cascade
async function generateContentWithFallback(ai: GoogleGenAI, requestParams: any) {
  const modelsToTry = [
    'gemini-3.6-flash',
    'gemini-flash-latest',
    'gemini-3.1-flash-lite',
  ];
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        ...requestParams,
        model: modelName,
      });
      if (response && response.text) return response;
    } catch (err: any) {
      console.warn(`Gemini model '${modelName}' attempt notice:`, err?.message || err);
      lastError = err;
    }
  }

  throw lastError || new Error('Não foi possível obter resposta dos modelos Gemini.');
}

// Helper to wrap raw 16-bit mono PCM bytes into a valid WAV file Buffer
function pcmToWav(pcmBuffer: Buffer, sampleRate = 24000, numChannels = 1, bitDepth = 16): Buffer {
  const header = Buffer.alloc(44);
  const dataSize = pcmBuffer.length;
  const fileSize = dataSize + 36;
  const byteRate = (sampleRate * numChannels * bitDepth) / 8;
  const blockAlign = (numChannels * bitDepth) / 8;

  header.write('RIFF', 0);
  header.writeUInt32LE(fileSize, 4);
  header.write('WAVE', 8);

  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size
  header.writeUInt16LE(1, 20);  // AudioFormat (PCM = 1)
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitDepth, 34);

  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

// Lazy initialization helper for Google GenAI client
let genAIClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY environment variable is missing.');
    }
    genAIClient = new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Super Aluno Backend', timestamp: new Date().toISOString() });
});

// YouTube Transcript & Info Extraction Endpoint
app.post('/api/youtube-info', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL do vídeo do YouTube é obrigatória.' });
    }
    const info = await getYouTubeTranscriptAndInfo(url);
    return res.json({ success: true, info });
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Falha ao buscar informações do vídeo do YouTube.' });
  }
});

// Process Study Material Endpoint
app.post('/api/process-study', async (req, res) => {
  try {
    let {
      title,
      fileType,
      fileName,
      fileBase64,
      mimeType,
      rawText,
      youtubeUrl,
      target = 'geral',
      difficulty = 'medio',
      customInstructions = '',
    } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        error: 'Chave GEMINI_API_KEY não configurada no servidor. Por favor, adicione sua API Key nas configurações.',
      });
    }

    // Process YouTube link if passed as youtubeUrl or in rawText/fileType
    const possibleYtUrl = youtubeUrl || (fileType === 'youtube' ? (title || rawText) : null) || (rawText && extractYouTubeVideoId(rawText) ? rawText : null);
    
    if (possibleYtUrl) {
      try {
        const ytInfo = await getYouTubeTranscriptAndInfo(possibleYtUrl);
        fileType = 'youtube';
        if (!title || title === 'Material de Estudo' || title.startsWith('http') || title === 'Aula de Estudos') {
          title = ytInfo.videoTitle;
        }
        if (ytInfo.transcriptText) {
          rawText = `AULA DO YOUTUBE - TRANSCRIÇÃO EXTRAÍDA DO VÍDEO (${ytInfo.videoTitle}):\n\n${ytInfo.transcriptText}\n\n${rawText && !rawText.includes('http') ? `Anotações extras do aluno:\n${rawText}` : ''}`;
        } else {
          // If YouTube captions/transcripts are disabled on YouTube for this video, fallback gracefully using the video title and topic so Gemini generates a complete study kit!
          rawText = `AULA DO YOUTUBE (LEGENDA AUTOMÁTICA DESATIVADA NO YOUTUBE):\nTítulo da Aula: "${ytInfo.videoTitle}"\nURL do Vídeo: ${ytInfo.youtubeUrl}\n\nInstrução especial: O criador desativou as legendas públicas deste vídeo no YouTube. Como assistente de IA Super Aluno, elabore um resumo conceitual completo, aprofundado e pedagógico sobre o tema desta aula ("${ytInfo.videoTitle}"), abordando os tópicos fundamentais, alertas de prova, conceitos-chave, flashcards e simulado de fixação.\n\n${rawText && !rawText.includes('http') ? `Anotações do aluno sobre a aula:\n${rawText}` : ''}`;
        }
      } catch (ytErr: any) {
        console.warn('YouTube processing notice:', ytErr);
      }
    }

    const ai = getGenAI();

    // Prepare content parts for Gemini
    const contentsParts: any[] = [];

    if (fileBase64) {
      // Determine default mime type if missing
      let inferredMimeType = mimeType;
      if (!inferredMimeType) {
        if (fileType === 'pdf') inferredMimeType = 'application/pdf';
        else if (fileType === 'audio') inferredMimeType = 'audio/mp3';
        else if (fileType === 'video') inferredMimeType = 'video/mp4';
        else if (fileType === 'image') inferredMimeType = 'image/png';
        else inferredMimeType = 'text/plain';
      }

      contentsParts.push({
        inlineData: {
          mimeType: inferredMimeType,
          data: fileBase64,
        },
      });
    }

    if (!rawText && !fileBase64) {
      if (youtubeUrl) {
        rawText = `AULA DO YOUTUBE:\nURL: ${youtubeUrl}\nTítulo/Tema da Aula: "${title || 'Aula do YouTube'}"\n\nElabore um kit de estudos completo e aprofundado com resumo conceitual, tópicos principais, alertas de prova, flashcards e simulado de questões sobre esta aula/tema.`;
      } else if (title && title.trim().length > 0) {
        rawText = `TEMA SOLICITADO PELO ALUNO:\nTítulo/Assunto: "${title.trim()}"\n\nElabore um kit de estudos completo e aprofundado com resumo conceitual, tópicos principais, alertas de prova, flashcards e simulado de questões sobre este assunto.`;
      } else {
        return res.status(400).json({
          error: 'Por favor, insira o link de uma aula do YouTube, digite o título do assunto ou envie um arquivo/texto de estudos.',
        });
      }
    }

    if (rawText) {
      contentsParts.push({
        text: `CONTEÚDO TEXTUAL DO MATERIAL DE ESTUDO:\n${rawText}`,
      });
    }

    // Prompt construction
    const promptText = `
Você é o "Super Aluno", o assistente de inteligência artificial definitivo para produtividade acadêmica, vestibulandos e concurseiros.
Analise o material fornecido (vídeo, áudio, PDF, imagem ou texto) e crie um KIT COMPLETO DE ESTUDOS altamente estruturado, rico em detalhes e pedagógico.

Parâmetros do aluno:
- Título do Material: ${title || fileName || 'Material de Estudo'}
- Tipo de Arquivo: ${fileType}
- Foco de Estudo: ${target} (ex: concurso, vestibular, faculdade, revisão rápida)
- Nível de Dificuldade Desejado: ${difficulty} (iniciante, medio, avançado)
${customInstructions ? `- Instruções Especiais do Aluno: ${customInstructions}` : ''}

Por favor, responda estritamente em formato JSON válido contendo a estrutura abaixo:

{
  "summary": {
    "title": "Título claro e atrativo do assunto",
    "subject": "Matéria ou disciplina principal (ex: Biologia, Direito Constitucional, História, Engenharia)",
    "overview": "Resumo geral abrangente do conteúdo (3 a 5 parágrafos bem explicados em Português)",
    "keyConcepts": [
      {
        "title": "Nome do Conceito",
        "description": "Explicação precisa e clara do conceito",
        "importance": "alta" | "media" | "normal",
        "timestampOrRef": "Trecho/Minuto/Página de referência aproximada"
      }
    ],
    "outline": [
      {
        "title": "Tópico / Seção 1",
        "keyPoints": ["Ponto chave 1", "Ponto chave 2", "Ponto chave 3"],
        "timestampOrRef": "Ref/Minuto"
      }
    ],
    "keyQuotes": [
      "Frase ou citação marcante/definição exata contida no material"
    ],
    "examWarnings": [
      "Dica de prova / Pegadinha frequente / O que a banca/professor costuma cobrar"
    ],
    "studyTips": [
      "Dica prática de estudo ou estratégia de memorização para este tópico"
    ]
  },
  "flashcards": [
    {
      "front": "Pergunta ou conceito no lado da frente do card",
      "back": "Resposta direta, clara e explicativa no verso",
      "category": "Subtópico ou categoria",
      "difficulty": "fácil" | "médio" | "difícil",
      "hint": "Dica sutil para ajudar antes de virar o card"
    }
  ],
  "quiz": [
    {
      "question": "Pergunta objetiva de múltipla escolha para testar o aprendizado",
      "options": [
        "Opção A",
        "Opção B",
        "Opção C",
        "Opção D"
      ],
      "correctAnswerIndex": 0,
      "explanation": "Explicação detalhada do porquê a opção correta é essa e por que as outras estão erradas",
      "topic": "Subtópico testado"
    }
  ],
  "studyPlan": [
    {
      "day": 1,
      "title": "Foco do Dia 1",
      "tasks": ["Atividade 1", "Atividade 2"],
      "estimatedMinutes": 30,
      "focusArea": "Área de Foco"
    }
  ]
}

REGRAS OBRIGATÓRIAS:
1. AULA COMPLETA: Estruture a seção 'overview', 'keyConcepts' (6 a 10 conceitos) e 'outline' (seções da aula com explicações aprofundadas em tópicos) como se estivesse ministrando uma aula completa do assunto.
2. MUITOS FLASHCARDS: Gere OBRIGATORIAMENTE ENTRE 12 E 18 FLASHCARDS de alta qualidade com perguntas front/back abrangendo todos os pontos importantes, fórmulas, nomenclaturas e definições do tema.
3. PROVA / SIMULADO EXTENSO: Gere OBRIGATORIAMENTE ENTRE 8 E 12 QUESTÕES de múltipla escolha (estilo prova de concurso/vestibular) com 4 opções e explicações minuciosas para cada resposta.
4. PLANO DE ESTUDOS: Gere um Cronograma de Estudos estruturado de 5 a 7 dias.
5. IDIOMA: Todo o texto DEVE estar estritamente em Português do Brasil fluente, correto, didático e motivador.
6. FORMATO: Retorne APENAS o JSON puro e válido, sem explicações adicionais fora do JSON.
`;

    contentsParts.push({ text: promptText });

    // Call Gemini API with model fallback cascade
    let response;
    try {
      response = await generateContentWithFallback(ai, {
        contents: { parts: contentsParts },
        config: {
          responseMimeType: 'application/json',
          temperature: 0.4,
        },
      });
    } catch (modelErr: any) {
      console.error('Gemini generateContent error in process-study:', modelErr);
      const errStr = modelErr?.message || '';
      if (errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED')) {
        return res.status(429).json({
          error: 'O serviço de IA está temporariamente com alto tráfego (cota por minuto atingida). Por favor, aguarde de 15 a 30 segundos e tente gerar novamente.',
        });
      }
      return res.status(500).json({
        error: 'Não foi possível gerar o kit de estudos pela IA. Verifique se o conteúdo ou vídeo enviado é válido e tente novamente.',
      });
    }

    const responseText = response.text || '';
    
    let parsedData;
    try {
      // Clean potential json codeblock wrappers and slice from first '{' to last '}'
      let cleanedJson = responseText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      const firstBrace = cleanedJson.indexOf('{');
      const lastBrace = cleanedJson.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleanedJson = cleanedJson.substring(firstBrace, lastBrace + 1);
      }

      parsedData = JSON.parse(cleanedJson);
    } catch (parseErr) {
      console.error('Failed to parse Gemini JSON response:', responseText);
      return res.status(500).json({
        error: 'Erro ao processar o formato da resposta da IA. Tente novamente.',
        raw: responseText,
      });
    }

    // Helper to sanitize and normalize study session payload
function normalizeStudySessionData(
  parsedData: any,
  defaultTitle: string,
  fileType: string,
  fileName: string,
  target: string,
  difficulty: string,
  rawText?: string
) {
  const summary = parsedData?.summary || {};
  const normalizedSummary = {
    title: summary.title || defaultTitle || 'Aula de Estudos',
    subject: summary.subject || 'Geral / Multidisciplinar',
    overview: summary.overview || 'Resumo geral dos principais conceitos e objetivos desta aula.',
    keyConcepts: Array.isArray(summary.keyConcepts)
      ? summary.keyConcepts.map((kc: any, idx: number) => ({
          id: kc.id || `kc-${Date.now()}-${idx}`,
          title: kc.title || `Conceito ${idx + 1}`,
          description: kc.description || 'Definição e aplicação prática do conceito.',
          importance: ['alta', 'media', 'normal'].includes(kc.importance) ? kc.importance : 'normal',
          timestampOrRef: kc.timestampOrRef || 'Tópico principal',
        }))
      : [],
    outline: Array.isArray(summary.outline)
      ? summary.outline.map((out: any) => ({
          title: out.title || 'Seção do Conteúdo',
          keyPoints: Array.isArray(out.keyPoints) ? out.keyPoints : [],
          timestampOrRef: out.timestampOrRef || '',
        }))
      : [],
    keyQuotes: Array.isArray(summary.keyQuotes) ? summary.keyQuotes : [],
    examWarnings: Array.isArray(summary.examWarnings) ? summary.examWarnings : [],
    studyTips: Array.isArray(summary.studyTips) ? summary.studyTips : [],
  };

  const flashcards = Array.isArray(parsedData?.flashcards)
    ? parsedData.flashcards.map((fc: any, idx: number) => ({
        id: fc.id || `fc-${Date.now()}-${idx}`,
        front: fc.front || 'Pergunta para revisão',
        back: fc.back || 'Resposta explicativa',
        category: fc.category || 'Geral',
        difficulty: fc.difficulty || 'médio',
        hint: fc.hint || '',
        status: 'learning',
      }))
    : [];

  const quiz = Array.isArray(parsedData?.quiz)
    ? parsedData.quiz.map((q: any, idx: number) => ({
        id: q.id || `qz-${Date.now()}-${idx}`,
        question: q.question || 'Pergunta do simulado',
        options: Array.isArray(q.options) && q.options.length >= 2 ? q.options : ['Opção A', 'Opção B', 'Opção C', 'Opção D'],
        correctAnswerIndex: typeof q.correctAnswerIndex === 'number' ? q.correctAnswerIndex : 0,
        explanation: q.explanation || 'Explicação detalhada da alternativa correta.',
        topic: q.topic || 'Geral',
      }))
    : [];

  const studyPlan = Array.isArray(parsedData?.studyPlan)
    ? parsedData.studyPlan.map((sp: any, idx: number) => ({
        day: sp.day || idx + 1,
        title: sp.title || `Dia ${idx + 1}`,
        tasks: Array.isArray(sp.tasks) ? sp.tasks : ['Revisar material'],
        estimatedMinutes: sp.estimatedMinutes || 30,
        focusArea: sp.focusArea || 'Revisão Ativa',
      }))
    : [];

  return {
    id: `session-${Date.now()}`,
    title: normalizedSummary.title,
    createdAt: new Date().toISOString(),
    fileType: fileType || 'youtube',
    fileName: fileName || 'Aula do YouTube / Material',
    target: target || 'geral',
    difficulty: difficulty || 'medio',
    summary: normalizedSummary,
    flashcards,
    quiz,
    studyPlan,
    chatHistory: [
      {
        id: `chat-${Date.now()}`,
        sender: 'ai',
        text: `Olá! Seu material **"${normalizedSummary.title}"** foi processado com sucesso! Já estruturei o resumo, os flashcards, o quiz simulado e o cronograma de estudos. Como posso te ajudar a revisar esse tema hoje?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ],
    contentExcerpt: rawText ? rawText.substring(0, 300) : 'Material multimodal de estudos',
  };
}

// Assign IDs to concepts, cards, quiz questions
    const sessionData = normalizeStudySessionData(
      parsedData,
      title || 'Aula de Estudos',
      fileType,
      fileName,
      target,
      difficulty,
      rawText
    );

    return res.json({ success: true, session: sessionData });
  } catch (error: any) {
    console.error('Error processing study material:', error);
    return res.status(500).json({
      error: error.message || 'Erro interno no servidor ao processar material de estudo.',
    });
  }
});

// Chat with Material Endpoint
app.post('/api/chat-material', async (req, res) => {
  try {
    const { contextPrompt, conversationHistory = [], userMessage } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        error: 'Chave GEMINI_API_KEY não encontrada.',
      });
    }

    const ai = getGenAI();

    const systemInstruction = `
Você é o "Super Aluno Tutor IA", um tutor de estudos altamente especializado, encorajador, paciente e focado em aprovações acadêmicas e concursos.
Você possui acesso ao contexto do material de estudos do aluno.

Sua missão:
1. Responder dúvidas sobre o conteúdo de forma didática, usando analogias simples quando necessário.
2. Fornecer exemplos práticos e criar mnemônicas para facilitar a memorização quando solicitado.
3. Se o aluno pedir para testá-lo, crie perguntas rápidas e dê feedback imediato.
4. Mantenha as respostas bem formatadas com listas e destaques em negrito.
5. Sempre responda em Português.

Contexto do Material Atual:
${contextPrompt || 'Material de estudo geral.'}
`;

    // Build chat contents
    const historyParts = conversationHistory.map((msg: any) => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    }));

    historyParts.push({
      role: 'user',
      parts: [{ text: userMessage }],
    });

    let response;
    try {
      response = await generateContentWithFallback(ai, {
        contents: historyParts,
        config: {
          systemInstruction,
          temperature: 0.5,
        },
      });
    } catch (chatErr: any) {
      console.error('Error in chat-material:', chatErr);
      return res.status(500).json({
        error: 'Não foi possível obter resposta do tutor IA no momento. Tente novamente em alguns instantes.',
      });
    }

    const responseText = response.text || 'Desculpe, não consegui processar sua dúvida neste momento.';

    return res.json({
      success: true,
      reply: responseText,
    });
  } catch (error: any) {
    console.error('Error in chat-material:', error);
    return res.status(500).json({
      error: error.message || 'Erro ao processar mensagem do chat.',
    });
  }
});

// Text-To-Speech Endpoint using Gemini TTS
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voice = 'Kore' } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Texto não fornecido para síntese de voz.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        error: 'Chave GEMINI_API_KEY não configurada no servidor.',
      });
    }

    const ai = getGenAI();

    // Clean markdown characters for smoother, more human reading
    const cleanText = text
      .replace(/[\#\*\_\`\~\-\>]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const promptText = `Por favor, leia o seguinte texto de forma extremamente natural, humana, clara e fluida em Português do Brasil:\n\n${cleanText.substring(0, 1200)}`;

    // Validate voice name against prebuilt voices
    const validVoices = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Aoede'];
    const chosenVoice = validVoices.includes(voice) ? voice : 'Kore';

    // Model list to try for TTS audio generation
    const modelsToTry = ['gemini-3.1-flash-tts-preview', 'gemini-3.6-flash'];
    let lastError: any = null;
    let base64Audio: string | undefined;
    let mimeType: string = 'audio/pcm;rate=24000';

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: promptText,
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: chosenVoice },
              },
            },
          },
        });

        const candidatePart = response.candidates?.[0]?.content?.parts?.[0];
        if (candidatePart?.inlineData?.data) {
          base64Audio = candidatePart.inlineData.data;
          mimeType = candidatePart.inlineData.mimeType || 'audio/pcm;rate=24000';
          break;
        }
      } catch (err) {
        lastError = err;
        console.warn(`TTS attempt failed with model ${modelName}:`, err);
      }
    }

    if (!base64Audio) {
      throw lastError || new Error('Não foi possível obter áudio a partir do Gemini TTS.');
    }

    // Convert raw PCM 24kHz to WAV format with header so browser Audio element can play it natively
    let audioDataUrl = `data:${mimeType};base64,${base64Audio}`;

    if (mimeType.includes('pcm') || !mimeType.includes('wav')) {
      const pcmBuffer = Buffer.from(base64Audio, 'base64');
      const wavBuffer = pcmToWav(pcmBuffer, 24000, 1, 16);
      const wavBase64 = wavBuffer.toString('base64');
      audioDataUrl = `data:audio/wav;base64,${wavBase64}`;
    }

    return res.json({
      success: true,
      audioUrl: audioDataUrl,
    });
  } catch (error: any) {
    console.error('Error in /api/tts:', error);
    return res.status(500).json({
      error: error.message || 'Erro ao gerar síntese de voz humana via Gemini.',
    });
  }
});

async function startServer() {
  // Vite middleware setup for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Super Aluno Server running on http://localhost:${PORT}`);
  });
}

startServer();
