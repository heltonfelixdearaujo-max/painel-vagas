import { generateAIAnalysis } from '../utils/aiAnalysis';

function seedJob(job) {
  return { ...job, candidates: job.candidates.map(c => ({ ...c, aiAnalysis: c.aiAnalysis || generateAIAnalysis(c, job) })) };
}

const rawJobs = [
  {
    id: 1,
    title: "Desenvolvedor Frontend Senior",
    department: "Tecnologia",
    location: "São Paulo, SP",
    type: "CLT",
    salary: "R$ 12.000 - R$ 16.000",
    status: "Aberta",
    description: "Buscamos um desenvolvedor frontend sênior com experiência em React, TypeScript e design systems. Você irá liderar o desenvolvimento de interfaces complexas e mentorear a equipe.",
    openDate: "2026-05-01",
    screeningQuestions: [
      { id: 1, text: "Quantos anos de experiência você tem com React?", required: true, type: "text" },
      { id: 2, text: "Você já trabalhou com design systems? Descreva brevemente.", required: true, type: "text" },
      { id: 3, text: "Possui experiência com TypeScript?", required: false, type: "yesno" },
    ],
    candidates: [
      {
        id: 101,
        name: "Ana Souza",
        city: "São Paulo, SP",
        email: "ana.souza@email.com",
        whatsapp: "(11) 99999-1111",
        linkedin: "linkedin.com/in/anasouza",
        salaryClaim: "R$ 14.000",
        startAvailability: "Imediata",
        currentlyWorking: "Sim",
        resumeFileName: "Ana_Souza_CV.pdf",
        screeningAnswers: [
          { questionId: 1, answer: "5 anos de experiência com React, desde a versão 16." },
          { questionId: 2, answer: "Sim, contribuí com o design system da empresa anterior por 2 anos." },
          { questionId: 3, answer: "Sim" },
        ],
        disc: { profile: "D", scores: { D: 68, I: 42, S: 30, C: 45 }, completedAt: "2026-05-05T14:00:00" },
        aiAnalysis: null,
        status: "Entrevista",
        appliedDate: "2026-05-05",
        languages: [{ language: "Inglês", level: "Avançado", notes: "Comunicação oral fluente" }],
        interviewComments: [
          { id: 1, interviewer: "Carlos Melo", date: "2026-05-08", stage: "Entrevista Técnica", observation: "Excelente domínio de React e TypeScript. Resolveu o desafio técnico com elegância. Recomendo avançar para a etapa final." }
        ],
      },
      {
        id: 102,
        name: "Bruno Lima",
        city: "Campinas, SP",
        email: "bruno.lima@email.com",
        whatsapp: "(11) 98888-2222",
        linkedin: "linkedin.com/in/brunolima",
        salaryClaim: "R$ 12.500",
        startAvailability: "30 dias",
        currentlyWorking: "Não",
        resumeFileName: "Bruno_Lima_CV.pdf",
        screeningAnswers: [
          { questionId: 1, answer: "3 anos de experiência com React." },
          { questionId: 2, answer: "Trabalhei com o Ant Design e customizei componentes." },
          { questionId: 3, answer: "Sim" },
        ],
        disc: { profile: "C", scores: { D: 28, I: 35, S: 48, C: 72 }, completedAt: "2026-05-06T10:00:00" },
        aiAnalysis: null,
        status: "Aprovado",
        appliedDate: "2026-05-06",
        languages: [{ language: "Inglês", level: "Intermediário", notes: "" }, { language: "Espanhol", level: "Básico", notes: "" }],
        interviewComments: [],
      },
    ],
  },
  {
    id: 2,
    title: "Product Manager",
    department: "Produto",
    location: "Remoto",
    type: "PJ",
    salary: "R$ 18.000 - R$ 22.000",
    status: "Em Seleção",
    description: "Procuramos um PM experiente para liderar o roadmap de produto, trabalhar com stakeholders e guiar equipes multidisciplinares.",
    openDate: "2026-04-20",
    screeningQuestions: [
      { id: 1, text: "Qual metodologia de priorização de backlog você prefere e por quê?", required: true, type: "text" },
      { id: 2, text: "Você tem experiência com produtos B2B SaaS?", required: true, type: "yesno" },
    ],
    candidates: [
      {
        id: 201,
        name: "Diego Rocha",
        city: "Rio de Janeiro, RJ",
        email: "diego.rocha@email.com",
        whatsapp: "(21) 97777-3333",
        linkedin: "linkedin.com/in/diegorocha",
        salaryClaim: "R$ 20.000",
        startAvailability: "15 dias",
        currentlyWorking: "Sim",
        resumeFileName: "Diego_Rocha_PM.pdf",
        screeningAnswers: [
          { questionId: 1, answer: "Uso RICE scoring combinado com ICE para priorização ágil." },
          { questionId: 2, answer: "Sim" },
        ],
        disc: { profile: "I", scores: { D: 45, I: 74, S: 38, C: 28 }, completedAt: "2026-04-25T09:00:00" },
        aiAnalysis: null,
        status: "Inscrito",
        appliedDate: "2026-04-25",
        languages: [{ language: "Inglês", level: "Fluente", notes: "Negociação e apresentações internacionais" }],
        interviewComments: [],
      },
    ],
  },
  {
    id: 3,
    title: "Designer UX/UI",
    department: "Design",
    location: "Rio de Janeiro, RJ",
    type: "CLT",
    salary: "R$ 8.000 - R$ 11.000",
    status: "Aberta",
    description: "Estamos em busca de um designer criativo com foco em experiência do usuário, proficiente em Figma e com portfólio robusto.",
    openDate: "2026-05-10",
    screeningQuestions: [],
    candidates: [],
  },
];

export const initialJobs = rawJobs.map(seedJob);

export const departments = [
  "Tecnologia", "Engenharia", "Produto", "Design", "Dados",
  "Marketing", "Vendas", "Pós-Vendas", "Técnico",
  "RH", "Financeiro", "Operações",
];
export const jobTypes    = ["CLT", "PJ", "USD", "Estágio", "Freelance"];
export const modalities  = ["Remoto", "Híbrido", "Presencial"];
export const jobStatuses = ["Aberta", "Em Seleção", "Encerrada"];
export const candidateStatuses = ["Inscrito", "Triagem", "Entrevista", "Aprovado", "Reprovado"];
export const languageLevels = ["Básico", "Intermediário", "Avançado", "Fluente"];
export const languages = ["Inglês", "Espanhol", "Francês", "Alemão", "Italiano", "Mandarim", "Japonês", "Árabe", "Português"];
export const processStages = ["Triagem de Currículo", "Entrevista RH", "Entrevista Técnica", "Entrevista com Liderança", "Assessment", "Proposta"];

export const salaryRangesBRL = [
  "R$ 2.000 – R$ 4.000",
  "R$ 4.000 – R$ 6.000",
  "R$ 6.000 – R$ 9.000",
  "R$ 9.000 – R$ 13.000",
  "R$ 13.000 – R$ 18.000",
  "R$ 18.000 – R$ 25.000",
  "R$ 25.000 – R$ 35.000",
  "Acima de R$ 35.000",
  "A combinar",
];

export const salaryRangesUSD = [
  "$ 1.500 – $ 2.500 / mês",
  "$ 2.500 – $ 4.000 / mês",
  "$ 4.000 – $ 6.000 / mês",
  "$ 6.000 – $ 8.000 / mês",
  "$ 8.000 – $ 12.000 / mês",
  "$ 12.000 – $ 18.000 / mês",
  "Acima de $ 18.000 / mês",
  "A combinar",
];

export const locationOptions = [
  { state: "Remoto",              cities: ["Remoto"] },
  { state: "São Paulo",           cities: ["São Paulo, SP", "Campinas, SP", "Santos, SP", "São José dos Campos, SP", "Ribeirão Preto, SP", "Sorocaba, SP", "Osasco, SP"] },
  { state: "Rio de Janeiro",      cities: ["Rio de Janeiro, RJ", "Niterói, RJ", "Petrópolis, RJ", "Volta Redonda, RJ"] },
  { state: "Minas Gerais",        cities: ["Belo Horizonte, MG", "Uberlândia, MG", "Contagem, MG", "Juiz de Fora, MG"] },
  { state: "Paraná",              cities: ["Curitiba, PR", "Londrina, PR", "Maringá, PR"] },
  { state: "Rio Grande do Sul",   cities: ["Porto Alegre, RS", "Caxias do Sul, RS", "Pelotas, RS"] },
  { state: "Santa Catarina",      cities: ["Florianópolis, SC", "Joinville, SC", "Blumenau, SC"] },
  { state: "Bahia",               cities: ["Salvador, BA", "Feira de Santana, BA"] },
  { state: "Pernambuco",          cities: ["Recife, PE", "Caruaru, PE"] },
  { state: "Ceará",               cities: ["Fortaleza, CE", "Caucaia, CE"] },
  { state: "Goiás",               cities: ["Goiânia, GO", "Aparecida de Goiânia, GO"] },
  { state: "Distrito Federal",    cities: ["Brasília, DF"] },
  { state: "Espírito Santo",      cities: ["Vitória, ES", "Vila Velha, ES"] },
  { state: "Mato Grosso do Sul",  cities: ["Campo Grande, MS"] },
  { state: "Mato Grosso",         cities: ["Cuiabá, MT"] },
  { state: "Amazonas",            cities: ["Manaus, AM"] },
  { state: "Pará",                cities: ["Belém, PA"] },
];

// ── Brazil: all 27 federative units + main cities (for candidate form) ────────
export const brazilStates = [
  {
    uf: "AC", name: "Acre",
    cities: ["Rio Branco", "Cruzeiro do Sul", "Sena Madureira", "Tarauacá", "Feijó"],
  },
  {
    uf: "AL", name: "Alagoas",
    cities: ["Maceió", "Arapiraca", "Palmeira dos Índios", "Rio Largo", "Penedo", "União dos Palmares"],
  },
  {
    uf: "AM", name: "Amazonas",
    cities: ["Manaus", "Parintins", "Itacoatiara", "Manacapuru", "Coari", "Tefé"],
  },
  {
    uf: "AP", name: "Amapá",
    cities: ["Macapá", "Santana", "Laranjal do Jari", "Oiapoque", "Mazagão"],
  },
  {
    uf: "BA", name: "Bahia",
    cities: ["Salvador", "Feira de Santana", "Vitória da Conquista", "Camaçari", "Itabuna", "Juazeiro", "Lauro de Freitas", "Ilhéus", "Jequié", "Teixeira de Freitas", "Barreiras", "Porto Seguro"],
  },
  {
    uf: "CE", name: "Ceará",
    cities: ["Fortaleza", "Caucaia", "Juazeiro do Norte", "Maracanaú", "Sobral", "Crato", "Itapipoca", "Maranguape", "Iguatu", "Quixadá"],
  },
  {
    uf: "DF", name: "Distrito Federal",
    cities: ["Brasília", "Ceilândia", "Taguatinga", "Samambaia", "Planaltina", "Gama"],
  },
  {
    uf: "ES", name: "Espírito Santo",
    cities: ["Vitória", "Vila Velha", "Serra", "Cariacica", "Cachoeiro de Itapemirim", "Linhares", "Guarapari", "São Mateus"],
  },
  {
    uf: "GO", name: "Goiás",
    cities: ["Goiânia", "Aparecida de Goiânia", "Anápolis", "Rio Verde", "Luziânia", "Águas Lindas de Goiás", "Valparaíso de Goiás", "Trindade", "Formosa", "Novo Gama"],
  },
  {
    uf: "MA", name: "Maranhão",
    cities: ["São Luís", "Imperatriz", "São José de Ribamar", "Timon", "Caxias", "Codó", "Paço do Lumiar", "Açailândia", "Bacabal", "Balsas"],
  },
  {
    uf: "MG", name: "Minas Gerais",
    cities: ["Belo Horizonte", "Uberlândia", "Contagem", "Juiz de Fora", "Betim", "Montes Claros", "Ribeirão das Neves", "Uberaba", "Governador Valadares", "Ipatinga", "Sete Lagoas", "Divinópolis", "Santa Luzia", "Ibirité", "Poços de Caldas", "Patos de Minas", "Pouso Alegre", "Teófilo Otoni", "Barbacena", "Varginha"],
  },
  {
    uf: "MS", name: "Mato Grosso do Sul",
    cities: ["Campo Grande", "Dourados", "Três Lagoas", "Corumbá", "Grande Dourados", "Ponta Porã", "Naviraí", "Nova Andradina"],
  },
  {
    uf: "MT", name: "Mato Grosso",
    cities: ["Cuiabá", "Várzea Grande", "Rondonópolis", "Sinop", "Tangará da Serra", "Cáceres", "Sorriso", "Lucas do Rio Verde"],
  },
  {
    uf: "PA", name: "Pará",
    cities: ["Belém", "Ananindeua", "Santarém", "Marabá", "Parauapebas", "Castanhal", "Abaetetuba", "Cametá", "Altamira"],
  },
  {
    uf: "PB", name: "Paraíba",
    cities: ["João Pessoa", "Campina Grande", "Santa Rita", "Patos", "Bayeux", "Sousa", "Cajazeiras", "Cabedelo"],
  },
  {
    uf: "PE", name: "Pernambuco",
    cities: ["Recife", "Caruaru", "Olinda", "Jaboatão dos Guararapes", "Paulista", "Petrolina", "Garanhuns", "Ribeirão", "Santa Cruz do Capibaribe", "Vitória de Santo Antão", "Cabo de Santo Agostinho"],
  },
  {
    uf: "PI", name: "Piauí",
    cities: ["Teresina", "Parnaíba", "Picos", "Piripiri", "Floriano", "Campo Maior"],
  },
  {
    uf: "PR", name: "Paraná",
    cities: ["Curitiba", "Londrina", "Maringá", "Ponta Grossa", "Cascavel", "São José dos Pinhais", "Foz do Iguaçu", "Colombo", "Guarapuava", "Paranaguá", "Araucária", "Toledo", "Apucarana", "Pinhais", "Campo Largo"],
  },
  {
    uf: "RJ", name: "Rio de Janeiro",
    cities: ["Rio de Janeiro", "São Gonçalo", "Duque de Caxias", "Nova Iguaçu", "Niterói", "Belford Roxo", "São João de Meriti", "Campos dos Goytacazes", "Petrópolis", "Volta Redonda", "Magé", "Itaboraí", "Macaé", "Cabo Frio", "Angra dos Reis", "Mesquita", "Nilópolis", "Queimados"],
  },
  {
    uf: "RN", name: "Rio Grande do Norte",
    cities: ["Natal", "Mossoró", "Parnamirim", "São Gonçalo do Amarante", "Ceará-Mirim", "Macaíba", "Caicó"],
  },
  {
    uf: "RO", name: "Rondônia",
    cities: ["Porto Velho", "Ji-Paraná", "Ariquemes", "Vilhena", "Cacoal", "Rolim de Moura"],
  },
  {
    uf: "RR", name: "Roraima",
    cities: ["Boa Vista", "Rorainópolis", "Caracaraí", "Alto Alegre"],
  },
  {
    uf: "RS", name: "Rio Grande do Sul",
    cities: ["Porto Alegre", "Caxias do Sul", "Canoas", "Pelotas", "Santa Maria", "Gravataí", "Viamão", "Novo Hamburgo", "São Leopoldo", "Rio Grande", "Alvorada", "Passo Fundo", "Sapucaia do Sul", "Uruguaiana", "Santa Cruz do Sul", "Cachoeirinha", "Bagé"],
  },
  {
    uf: "SC", name: "Santa Catarina",
    cities: ["Florianópolis", "Joinville", "Blumenau", "São José", "Criciúma", "Chapecó", "Itajaí", "Jaraguá do Sul", "Palhoça", "Balneário Camboriú", "Brusque", "Tubarão", "Caçador", "Lages"],
  },
  {
    uf: "SE", name: "Sergipe",
    cities: ["Aracaju", "Nossa Senhora do Socorro", "Lagarto", "Itabaiana", "São Cristóvão", "Estância"],
  },
  {
    uf: "SP", name: "São Paulo",
    cities: ["São Paulo", "Guarulhos", "Campinas", "São Bernardo do Campo", "Santo André", "São José dos Campos", "Ribeirão Preto", "Osasco", "Sorocaba", "Mauá", "São José do Rio Preto", "Mogi das Cruzes", "Santos", "Diadema", "Jundiaí", "Piracicaba", "Carapicuíba", "Bauru", "Itaquaquecetuba", "São Vicente", "Franca", "Guarujá", "Taubaté", "Praia Grande", "Limeira", "Suzano", "Taboão da Serra", "Sumaré", "Barueri", "Embu das Artes", "São Carlos", "Indaiatuba", "Araraquara", "Cotia", "Americana"],
  },
  {
    uf: "TO", name: "Tocantins",
    cities: ["Palmas", "Araguaína", "Gurupi", "Porto Nacional", "Paraíso do Tocantins"],
  },
];
