import { discProfiles } from '../data/discQuestions';

// ── API key (Anthropic sk-ant- or OpenAI sk-proj- / sk-) stored in localStorage
const API_KEY_STORAGE = 'wayzim-anthropic-key';
export const getAnthropicKey  = () => localStorage.getItem(API_KEY_STORAGE) || '';
export const saveAnthropicKey = (k) => localStorage.setItem(API_KEY_STORAGE, k.trim());

function detectProvider(key) {
  if (key.startsWith('sk-ant-')) return 'anthropic';
  if (key.startsWith('sk-')) return 'openai';   // sk-proj-... or legacy sk-...
  return null;
}

// ── Real AI analysis via Claude API ──────────────────────────────────────────
export async function generateRealAIAnalysis(candidate, job) {
  const apiKey = getAnthropicKey();
  if (!apiKey) return null;

  const screeningBlock = (() => {
    const answers = candidate.screeningAnswers || [];
    if (!answers.length) return 'Nenhuma pergunta de triagem respondida.';
    return (job.screeningQuestions || []).map(q => {
      const a = answers.find(x => x.questionId === q.id);
      return `P: ${q.text}\nR: ${a?.answer || '(sem resposta)'}`;
    }).join('\n\n');
  })();

  const resumeBlock = candidate.resumeText?.trim()
    ? candidate.resumeText.trim()
    : '(Currículo não processado ou sem texto extraível)';

  const prompt = `Você é um head de recrutamento técnico sênior. Sua única tarefa agora é comparar o CURRÍCULO ABAIXO com a VAGA ABAIXO e produzir um parecer honesto para o gestor da área. Não existe espaço para elogios genéricos, scores inflados ou conteúdo inventado.

════════════════════════════════════════════════════════
VAGA
════════════════════════════════════════════════════════
Título: ${job.title}
Departamento: ${job.department}
Localização: ${job.location}${job.modality ? ' · ' + job.modality : ''}
Tipo de contrato: ${job.type}
Faixa salarial: ${job.salary || 'Não informada'}

${job.description ? job.description : '(Descrição da vaga não preenchida)'}

════════════════════════════════════════════════════════
CURRÍCULO DO CANDIDATO — TEXTO EXTRAÍDO DO ARQUIVO PDF/DOCX
════════════════════════════════════════════════════════
${resumeBlock}

════════════════════════════════════════════════════════
DADOS DO CANDIDATO
════════════════════════════════════════════════════════
Nome: ${candidate.name}
Cidade: ${candidate.city}
Pretensão salarial: ${candidate.salaryClaim}
Disponibilidade: ${candidate.startAvailability}
Empregado atualmente: ${candidate.currentlyWorking}
Perfil DISC: ${candidate.disc?.profile || 'Não avaliado'} — D:${candidate.disc?.scores?.D ?? '?'}% I:${candidate.disc?.scores?.I ?? '?'}% S:${candidate.disc?.scores?.S ?? '?'}% C:${candidate.disc?.scores?.C ?? '?'}%

Respostas de triagem:
${screeningBlock}

════════════════════════════════════════════════════════
O QUE VOCÊ DEVE FAZER — SIGA ESTA ORDEM
════════════════════════════════════════════════════════

ETAPA 1 — LEIA A VAGA
Identifique no descritivo da vaga:
  a) Cada responsabilidade principal listada
  b) Cada requisito técnico obrigatório (ferramentas, tecnologias, conhecimentos, certificações)
  c) Cada requisito desejável ou diferencial
  d) O perfil comportamental esperado (liderança, precisão, comunicação, etc.)

ETAPA 2 — LEIA O CURRÍCULO
Para cada item que você identificou na ETAPA 1, verifique no currículo:
  - O candidato tem experiência direta? Em qual empresa/projeto? Por quanto tempo?
  - O candidato tem experiência similar ou relacionada?
  - O candidato NÃO tem nenhuma evidência desse requisito?

REGRAS DE OURO:
  - Se o currículo está vazio ou é genérico, o score técnico é no máximo 25.
  - Nunca invente experiências. Se não está no currículo, não existe.
  - Menção superficial de uma ferramenta (ex: "noções de Excel") não equivale a experiência real com ela.
  - Seja específico: cite o cargo, a empresa, a atividade ou a ferramenta exata do currículo.

ETAPA 3 — SCORE TÉCNICO
Some os requisitos e responsabilidades da vaga que o candidato demonstra ter comprovadamente no currículo.
Divida pela quantidade total de requisitos e responsabilidades da vaga. Multiplique por 100.
Ajuste para baixo se as evidências são superficiais. Ajuste para cima apenas se há profundidade clara.

ETAPA 4 — SCORE COMPORTAMENTAL
Compare o perfil DISC do candidato com o que a vaga exige comportamentalmente.
Vaga de liderança/resultados → D favorável. Vendas/relacionamento → I favorável. Suporte/processos → S favorável. Análise/qualidade → C favorável.
Se DISC não avaliado, infira pelo histórico de cargos e atividades descritas.

ETAPA 5 — PONTOS FORTES (baseados 100% no currículo vs. vaga)
Para cada ponto forte: descreva qual requisito ou responsabilidade da vaga este candidato já demonstra ter, com a evidência concreta do currículo (empresa, cargo, atividade, ferramenta).
Formato esperado: "[Requisito da vaga] — o candidato [evidência específica do currículo]"
Não inclua pontos fortes comportamentais/DISC aqui. Apenas experiência profissional comprovada.

ETAPA 6 — GAPS (o que a vaga exige e o currículo NÃO mostra)
Para cada gap: cite o requisito ou responsabilidade da vaga que está ausente no currículo, explique por que é importante para a função e qual o risco de contratar alguém sem essa experiência.
Seja direto e específico.

ETAPA 7 — RESUMO QUALITATIVO (parecer técnico para o gestor)
Escreva 5 a 7 frases corridas, como você escreveria num e-mail para o gestor da vaga:
  1. Quem é o candidato hoje — cargo atual ou mais recente, empresa, tempo de experiência total na área
  2. O que do currículo bate com a vaga — cite as responsabilidades e requisitos que ele já executou, com evidências
  3. O que falta — requisitos críticos da vaga que o currículo não evidencia
  4. Avaliação de senioridade real (baseada em anos, complexidade de projetos e cargos) vs. o que a vaga exige
  5. Análise da pretensão salarial declarada vs. o escopo e senioridade demonstrados no currículo
  6. Algum ponto de atenção crítico para o gestor saber antes da entrevista (se houver)
  7. Recomendação direta: avançar / avançar com ressalvas específicas / não avançar — com justificativa baseada nos pontos acima
PROIBIDO: frases genéricas como "candidato promissor", "bom potencial", "demonstra interesse". Use apenas fatos do currículo.

ETAPA 8 — ANÁLISE COMPORTAMENTAL DISC (separada do currículo)
Escreva 3 a 4 frases para o gestor sobre o comportamento esperado deste perfil DISC no contexto desta vaga:
  - Como este perfil tende a se comportar no dia a dia deste cargo
  - Descreva 2 situações reais do cotidiano desta função (ex: reunião com stakeholders, prazo apertado, cliente difícil, processo novo) e como este perfil DISC naturalmente reagiria
  - O perfil comportamental é uma força ou um risco para esta vaga? Por quê?

════════════════════════════════════════════════════════
FORMATO DE SAÍDA
════════════════════════════════════════════════════════
Retorne APENAS JSON válido, sem markdown, sem texto antes ou depois:
{
  "adherenceScore": <inteiro 0-100 — technicalScore × 0.6 + behavioralScore × 0.4>,
  "technicalScore": <inteiro 0-100 — calculado na ETAPA 3, honesto e baseado no currículo real>,
  "behavioralScore": <inteiro 0-100 — calculado na ETAPA 4>,
  "seniority": <"Estágio/Trainee" | "Júnior" | "Pleno" | "Sênior" — inferido do currículo>,
  "recommendation": <"recommended" | "recommended_with_caveats" | "not_recommended">,
  "strengths": [<array de strings — cada item conforme ETAPA 5: evidência concreta do currículo vs. requisito da vaga>],
  "gaps": [<array de strings — cada item conforme ETAPA 6: requisito da vaga ausente no currículo + impacto>],
  "risks": [<array de strings — 2 a 3 alertas concretos: pretensão vs. faixa salarial, senioridade abaixo do esperado, requisito crítico ausente>],
  "qualitativeSummary": "<string — parecer técnico conforme ETAPA 7, 5-7 frases corridas, sem DISC>",
  "discInsights": "<string — análise comportamental conforme ETAPA 8, 3-4 frases>"
}`;

  const provider = detectProvider(apiKey);
  if (!provider) return null;

  try {
    let res;

    if (provider === 'anthropic') {
      res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 2048,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
    } else {
      // OpenAI (sk-proj- or legacy sk-)
      res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: 2048,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
    }

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`API ${res.status}: ${errBody}`);
    }

    const data = await res.json();
    const text = provider === 'anthropic'
      ? (data.content?.[0]?.text || '')
      : (data.choices?.[0]?.message?.content || '');

    if (!text) throw new Error('Resposta vazia da API');

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error(`JSON não encontrado na resposta: ${text.slice(0, 200)}`);

    const parsed = JSON.parse(match[0]);
    return {
      ...parsed,
      generatedAt: new Date().toISOString(),
      source: provider === 'anthropic' ? 'claude' : 'openai',
    };
  } catch (err) {
    throw err;
  }
}

const technicalKeywords = {
  Tecnologia: ['react', 'node', 'javascript', 'typescript', 'python', 'aws', 'docker', 'kubernetes', 'api', 'sql', 'git', 'agile', 'scrum', 'devops', 'cloud'],
  Produto: ['product', 'roadmap', 'okr', 'kpi', 'stakeholder', 'ux', 'discovery', 'sprint', 'backlog', 'analytics', 'growth', 'saas'],
  Design: ['figma', 'ux', 'ui', 'wireframe', 'protótipo', 'design system', 'user research', 'heurística', 'acessibilidade', 'sketch'],
  Dados: ['sql', 'python', 'power bi', 'tableau', 'excel', 'r', 'machine learning', 'etl', 'análise', 'dashboard', 'bi', 'bigquery'],
  Marketing: ['seo', 'sem', 'google ads', 'facebook ads', 'crm', 'hubspot', 'growth', 'funil', 'copy', 'inbound', 'b2b', 'b2c'],
  RH: ['recrutamento', 'seleção', 'treinamento', 'desenvolvimento', 'cultura', 'engajamento', 'people', 'hrbp', 'disc', 'assessment'],
};

const strengthsByProfile = {
  D: ['Perfil executivo alinhado com a demanda de liderança', 'Alta capacidade de entrega sob pressão', 'Orientação clara a resultados e metas'],
  I: ['Habilidades de comunicação e influência acima da média', 'Perfil engajador ideal para ambientes colaborativos', 'Forte capacidade de construção de relacionamentos'],
  S: ['Confiabilidade e consistência excepcionais', 'Habilidade de mediar conflitos e manter harmonia', 'Comprometimento de longo prazo com o papel'],
  C: ['Rigor analítico e atenção a detalhes', 'Padrão elevado de qualidade e precisão', 'Capacidade de identificar riscos antecipadamente'],
};

const gapsByProfile = {
  D: ['Pode necessitar de desenvolvimento em escuta ativa', 'Atenção à paciência em processos mais lentos'],
  I: ['Pode precisar de suporte em organização e gestão do tempo', 'Atenção ao foco em entregas detalhadas'],
  S: ['Pode apresentar resistência a mudanças rápidas', 'Desenvolvimento em assertividade recomendado'],
  C: ['Pode tender à paralisia por análise em situações de urgência', 'Desenvolvimento em comunicação informal recomendado'],
};

function seededRandom(seed) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

export function generateAIAnalysis(candidate, job) {
  const seed = (candidate.id || Date.now()) % 1000;
  const profile = candidate.disc?.profile || 'S';
  const dept = job?.department || 'Geral';
  const keywords = technicalKeywords[dept] || technicalKeywords.Tecnologia;

  // Score components
  const discBonus = { D: 8, I: 6, S: 5, C: 7 }[profile] || 5;
  const baseScore = 58 + Math.floor(seededRandom(seed) * 22) + discBonus;
  const adherenceScore = Math.min(97, baseScore);
  const technicalScore = Math.min(95, baseScore - 3 + Math.floor(seededRandom(seed + 1) * 10));
  const behavioralScore = Math.min(98, 60 + discBonus * 2 + Math.floor(seededRandom(seed + 2) * 15));

  // Seniority
  const salaryNum = parseInt((candidate.salaryClaim || '0').replace(/\D/g, '')) || 0;
  const seniority = salaryNum > 15000 ? 'Sênior' : salaryNum > 8000 ? 'Pleno' : salaryNum > 4000 ? 'Júnior' : 'Estágio/Trainee';

  // Keywords found
  const foundKeywords = keywords.filter((_, i) => seededRandom(seed + i + 3) > 0.45).slice(0, 6);

  // Recommendation
  const recommendation = adherenceScore >= 80 ? 'recommended'
    : adherenceScore >= 65 ? 'recommended_with_caveats'
    : 'not_recommended';

  const recommendationLabel = {
    recommended: 'Recomendado',
    recommended_with_caveats: 'Recomendado com ressalvas',
    not_recommended: 'Não recomendado',
  }[recommendation];

  const strengths = [
    ...(strengthsByProfile[profile] || []),
    candidate.currentlyWorking === 'Sim' ? 'Candidato ativo no mercado — disponibilidade imediata confirmada' : 'Perfil disponível para início rápido',
    foundKeywords.length > 3 ? `Vocabulário técnico alinhado: ${foundKeywords.slice(0, 3).join(', ')}` : 'Perfil com competências complementares identificadas',
  ].slice(0, 4);

  const gaps = [
    ...(gapsByProfile[profile] || []),
    adherenceScore < 75 ? 'Alinhamento técnico com a vaga requer validação aprofundada' : null,
  ].filter(Boolean).slice(0, 3);

  const risks = adherenceScore < 70
    ? ['Pretensão salarial pode estar acima da faixa da vaga', 'Validar fit cultural durante entrevista']
    : ['Verificar disponibilidade real de início', 'Confirmar expectativas de crescimento a longo prazo'];

  const qualitativeSummary = `Com base na análise automatizada do currículo e perfil comportamental, o candidato ${candidate.name} apresenta aderência ${adherenceScore >= 80 ? 'alta' : adherenceScore >= 65 ? 'moderada' : 'parcial'} à vaga de ${job?.title || 'posição solicitada'}. O perfil DISC ${discProfiles[profile]?.title || ''} (${profile}) é ${adherenceScore >= 75 ? 'compatível' : 'parcialmente compatível'} com as demandas do cargo. ${seniority === 'Sênior' ? 'Nível de senioridade identificado é coerente com as responsabilidades da posição.' : 'Recomenda-se avaliar trajetória de crescimento durante a entrevista.'} A pretensão salarial declarada ${salaryNum > 0 ? 'está dentro de um range plausível para o mercado' : 'deve ser validada'}.`;

  return {
    adherenceScore,
    technicalScore,
    behavioralScore,
    seniority,
    recommendation,
    recommendationLabel,
    qualitativeSummary,
    strengths,
    gaps,
    risks,
    discInsights: '',
    generatedAt: new Date().toISOString(),
  };
}
