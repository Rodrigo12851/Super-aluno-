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
function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = trimmed.match(regExp);
  if (match && match[2] && match[2].length === 11) {
    return match[2];
  }
  if (trimmed.length === 11 && !trimmed.includes('/') && !trimmed.includes('.')) {
    return trimmed;
  }
  return null;
}

// Fetch YouTube Transcript and Video Metadata
async function getYouTubeTranscriptAndInfo(youtubeUrlOrId: string) {
  const videoId = extractYouTubeVideoId(youtubeUrlOrId);
  if (!videoId) {
    throw new Error('URL ou ID do vídeo do YouTube inválido.');
  }

  let videoTitle = `Aula do YouTube (${videoId})`;
  let transcriptText = '';
  let hasCaption = false;

  // 1. Try fetching transcript in Portuguese or default language
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
    // Quiet catch
  }

  // 2. Try fetching video page title from YouTube metadata
  try {
    const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });
    if (pageRes.ok) {
      const html = await pageRes.text();
      const titleMatch = html.match(/<title>(.*?)<\/title>/i);
      if (titleMatch && titleMatch[1]) {
        videoTitle = titleMatch[1].replace('- YouTube', '').trim();
      }
    }
  } catch (metaErr) {
    console.warn('Could not fetch YouTube video title:', metaErr);
  }

  return {
    videoId,
    videoTitle,
    transcriptText,
    hasCaption,
    youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`
  };
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
1. Gere pelo menos 4 a 6 Conceitos Chave relevantes.
2. Gere entre 5 e 8 Flashcards de alta qualidade com perguntas front/back enriquecedoras.
3. Gere de 3 a 5 Questões de Quiz Múltipla Escolha com 4 opções e explicações detalhadas.
4. Gere um Plano de Estudos de 5 dias estruturado.
5. Todo o texto DEVE estar em Português fluente, correto e didático.
6. Retorne APENAS o JSON puro, sem marcações markdown extra de início ou fim se possível.
`;

    contentsParts.push({ text: promptText });

    // Call Gemini API using gemini-2.5-flash
    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: contentsParts },
        config: {
          responseMimeType: 'application/json',
          temperature: 0.4,
        },
      });
    } catch (modelErr) {
      console.warn('Fallback to gemini-2.0-flash due to error:', modelErr);
      response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: { parts: contentsParts },
        config: {
          responseMimeType: 'application/json',
          temperature: 0.4,
        },
      });
    }

    const responseText = response.text || '';
    
    let parsedData;
    try {
      // Clean potential json codeblock wrappers if any
      const cleanedJson = responseText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      parsedData = JSON.parse(cleanedJson);
    } catch (parseErr) {
      console.error('Failed to parse Gemini JSON response:', responseText);
      return res.status(500).json({
        error: 'Erro ao processar o formato da resposta da IA. Tente novamente.',
        raw: responseText,
      });
    }

    // Assign IDs to concepts, cards, quiz questions
    if (parsedData.summary?.keyConcepts) {
      parsedData.summary.keyConcepts = parsedData.summary.keyConcepts.map(
        (kc: any, idx: number) => ({
          ...kc,
          id: `kc-${Date.now()}-${idx}`,
        })
      );
    }

    if (parsedData.flashcards) {
      parsedData.flashcards = parsedData.flashcards.map((fc: any, idx: number) => ({
        ...fc,
        id: `fc-${Date.now()}-${idx}`,
        status: 'learning',
      }));
    }

    if (parsedData.quiz) {
      parsedData.quiz = parsedData.quiz.map((q: any, idx: number) => ({
        ...q,
        id: `qz-${Date.now()}-${idx}`,
      }));
    }

    const sessionData = {
      id: `session-${Date.now()}`,
      title: title || parsedData.summary?.title || fileName || 'Sessão de Estudos',
      createdAt: new Date().toISOString(),
      fileType,
      fileName: fileName || 'Texto / Entrada Direta',
      target,
      difficulty,
      summary: parsedData.summary,
      flashcards: parsedData.flashcards || [],
      quiz: parsedData.quiz || [],
      studyPlan: parsedData.studyPlan || [],
      chatHistory: [
        {
          id: `chat-${Date.now()}`,
          sender: 'ai',
          text: `Olá! Seu material **"${title || parsedData.summary?.title || fileName}"** foi processado com sucesso! Já estruturei o resumo, os flashcards, o quiz simulado e o cronograma de estudos. Como posso te ajudar a revisar esse tema hoje?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
      contentExcerpt: rawText ? rawText.substring(0, 300) : 'Material multimodal processado por IA',
    };

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
      response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: historyParts,
        config: {
          systemInstruction,
          temperature: 0.5,
        },
      });
    } catch (chatErr) {
      console.warn('Fallback to gemini-2.0-flash for chat:', chatErr);
      response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: historyParts,
        config: {
          systemInstruction,
          temperature: 0.5,
        },
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
    const modelsToTry = ['gemini-2.5-flash', 'gemini-3.1-flash-tts-preview', 'gemini-2.0-flash'];
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
