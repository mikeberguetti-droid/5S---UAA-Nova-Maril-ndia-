import { 
  SensoInfo, 
  Sector, 
  Auditor, 
  ChecklistQuestion, 
  Audit, 
  ActionPlan, 
  ScheduledAudit,
  HistoryPoint 
} from '../types';

export const SENSOS_CONFIG: Record<string, SensoInfo> = {
  seiri: {
    id: 'seiri',
    nomeJapones: 'Seiri',
    nomePortugues: 'Utilização e Descarte',
    significado: 'Melhorar a organização, eliminando matérias desnecessárias, gambiarras e vazamentos.',
    corPrimaria: '#0284c7', // Sky / Blue
    corClara: '#e0f2fe',
    corBorda: '#38bdf8',
    icone: 'Trash2'
  },
  seiton: {
    id: 'seiton',
    nomeJapones: 'Seiton',
    nomePortugues: 'Organização e Ordenação',
    significado: 'Condicionamento adequado, passagens livres, locais definidos e bancadas organizadas.',
    corPrimaria: '#0d9488', // Teal
    corClara: '#ccfbf1',
    corBorda: '#2dd4bf',
    icone: 'LayoutGrid'
  },
  seiso: {
    id: 'seiso',
    nomeJapones: 'Seiso',
    nomePortugues: 'Limpeza e Inspeção',
    significado: 'Equipamentos e utensílios limpos, higiene pessoal (BPF), lixeiras e instruções de químicos.',
    corPrimaria: '#16a34a', // Emerald / Green
    corClara: '#dcfce7',
    corBorda: '#4ade80',
    icone: 'Sparkles'
  },
  seiketsu: {
    id: 'seiketsu',
    nomeJapones: 'Seiketsu',
    nomePortugues: 'Saúde e Segurança',
    significado: 'Padronização de faixas, controle de incidentes, equipamentos de emergência desobstruídos, EPIs e DSS.',
    corPrimaria: '#d97706', // Amber
    corClara: '#fef3c7',
    corBorda: '#fbbf24',
    icone: 'ShieldCheck'
  },
  shitsuke: {
    id: 'shitsuke',
    nomeJapones: 'Shitsuke',
    nomePortugues: 'Disciplina e Autodisciplina',
    significado: 'Normas cumpridas, conhecimento do 5S, reuniões de resultados e planos de ação em dia.',
    corPrimaria: '#7c3aed', // Purple / Violet
    corClara: '#f3e8ff',
    corBorda: '#a78bfa',
    icone: 'Award'
  }
};

/**
 * Official scoring scale from the AUDITORIA 5S document
 */
export const SCORING_SCALE = [
  { qtd: '0', label: '0 problemas', pontos: 100 },
  { qtd: '1', label: '1 problema', pontos: 80 },
  { qtd: '2', label: '2 problemas', pontos: 70 },
  { qtd: '3', label: '3 problemas', pontos: 50 },
  { qtd: '4', label: '4 problemas', pontos: 30 },
  { qtd: '5', label: '5 problemas', pontos: 10 },
  { qtd: '6+', label: '6 ou mais problemas', pontos: 0 },
];

export const calculatePointsFromProblems = (qtd: number): number => {
  if (qtd <= 0) return 100;
  if (qtd === 1) return 80;
  if (qtd === 2) return 70;
  if (qtd === 3) return 50;
  if (qtd === 4) return 30;
  if (qtd === 5) return 10;
  return 0; // 6 ou mais
};

/**
 * Clean slate: Empty initial sectors and auditors so user can create their own
 */
export const INITIAL_SECTORS: Sector[] = [];

export const INITIAL_AUDITORS: Auditor[] = [];

/**
 * 25 official verification criteria from the AUDITORIA 5S document
 */
export const INITIAL_QUESTIONS: ChecklistQuestion[] = [
  // SENSO DE UTILIZAÇÃO (5 itens)
  {
    id: 'q-util-1',
    senso: 'seiri',
    numero: 1,
    titulo: 'Há matérias ou objetos desnecessário no setor?',
    descricao_criterio: '1 - Há matérias ou objetos desnecessário no setor?',
    padrao_esperado: 'Apenas matérias primas, ferramentas e itens estritamente em uso na operação presentes.',
    ativo: true
  },
  {
    id: 'q-util-2',
    senso: 'seiri',
    numero: 2,
    titulo: 'Todos os objetos são utilizados para os fins aos quais se destinam? (Gambiarra)',
    descricao_criterio: '2 - Todos os objetos são utilizados para os fins aos quais se destinam? (Gambiarra)',
    padrao_esperado: 'Zero adaptações improvisadas (gambiarras). Uso exclusivo de equipamentos e ferramentas adequados.',
    ativo: true
  },
  {
    id: 'q-util-3',
    senso: 'seiri',
    numero: 3,
    titulo: 'Existe identificação nos setores?',
    descricao_criterio: '3 - Existe identificação nos setores?',
    padrao_esperado: 'Placas indicativas, identificação de salas, linhas e postos visíveis e conservadas.',
    ativo: true
  },
  {
    id: 'q-util-4',
    senso: 'seiri',
    numero: 4,
    titulo: 'Existem vazamento de ar, água, óleo ou desperdício de energia?',
    descricao_criterio: '4 - Existem vazamento de ar, água, óleo ou desperdício de energia?',
    padrao_esperado: 'Total estanqueidade das linhas industriais. Luzes e motores desligados quando ocioso.',
    ativo: true
  },
  {
    id: 'q-util-5',
    senso: 'seiri',
    numero: 5,
    titulo: 'Há algum item no setor necessitando de reparo?',
    descricao_criterio: '5 - Há algum item no setor necessitando de reparo?',
    padrao_esperado: 'Todos os itens em perfeito estado funcional; reparos imediatos com ordem de serviço aberta.',
    ativo: true
  },

  // SENSO DE ORGANIZAÇÃO (5 itens)
  {
    id: 'q-org-1',
    senso: 'seiton',
    numero: 1,
    titulo: 'Todos objetos ou itens estão condicionados de forma adequada?',
    descricao_criterio: '1 - Todos objetos ou itens estão condicionados de forma adequada?',
    padrao_esperado: 'Itens empilhados, guardados ou posicionados conforme normas de segurança e conservação.',
    ativo: true
  },
  {
    id: 'q-org-2',
    senso: 'seiton',
    numero: 2,
    titulo: 'Há objetos obstruindo a passagem?',
    descricao_criterio: '2 - Há objetos obstruindo a passagem?',
    padrao_esperado: 'Corredores, rotas de fuga, portas e passagens 100% desobstruídos.',
    ativo: true
  },
  {
    id: 'q-org-3',
    senso: 'seiton',
    numero: 3,
    titulo: 'Os equipamentos e utensílios tem local definido?',
    descricao_criterio: '3 - Os equipamentos e utensílios tem local definido?',
    padrao_esperado: 'Cada ferramenta, carrinho e utensílio possui sua vaga demarcada e identificada.',
    ativo: true
  },
  {
    id: 'q-org-4',
    senso: 'seiton',
    numero: 4,
    titulo: 'Existem papéis colados nas paredes ou informações expostas de forma desorganizadas?',
    descricao_criterio: '4 - Existem papéis colados nas paredes ou informações expostas de forma desorganizadas?',
    padrao_esperado: 'Informativos apenas nos murais padrão; sem folhas soltas com fitas adesivas ou papéis velhos.',
    ativo: true
  },
  {
    id: 'q-org-5',
    senso: 'seiton',
    numero: 5,
    titulo: 'Mesas e bancadas mantidas organizadas durante as tarefas?',
    descricao_criterio: '5 - Mesas e bancadas mantidas organizadas durante as tarefas?',
    padrao_esperado: 'Superfícies de trabalho limpas e organizadas mesmo durante a execução dos turnos.',
    ativo: true
  },

  // SENSO DE LIMPEZA (5 itens)
  {
    id: 'q-limp-1',
    senso: 'seiso',
    numero: 1,
    titulo: 'Os equipamentos e utensílios da área estão limpos?',
    descricao_criterio: '1 - Os equipamentos e utensílios da área estão limpos?',
    padrao_esperado: 'Higienização rigorosa conforme os POPs de BPF do frigorífico.',
    ativo: true
  },
  {
    id: 'q-limp-2',
    senso: 'seiso',
    numero: 2,
    titulo: 'O funcionário mantem a higiene pessoal (BPF)?',
    descricao_criterio: '2 - O funcionário mantem a higiene pessoal (BPF)?',
    padrao_esperado: 'Uniformes limpos, sem adornos, unhas aparadas, barbas protegidas e toucas bem ajustadas.',
    ativo: true
  },
  {
    id: 'q-limp-3',
    senso: 'seiso',
    numero: 3,
    titulo: 'A condição das lixeiras dos setores está de acordo (limpa/íntegra)?',
    descricao_criterio: '3 - A condição das lixeiras dos setores está de acordo (limpa/íntegra)?',
    padrao_esperado: 'Lixeiras higienizadas, com sacos plásticos corretos, tampas e pedal funcionando, sem transbordo.',
    ativo: true
  },
  {
    id: 'q-limp-4',
    senso: 'seiso',
    numero: 4,
    titulo: 'Há identificação de instrução de manuseio de produtos químicos?',
    descricao_criterio: '4 - Há identificação de instrução de manuseio de produtos químicos?',
    padrao_esperado: 'FISPQ/FISP disponível, embalagens com rótulo padrão de segurança e dosagem correta.',
    ativo: true
  },
  {
    id: 'q-limp-5',
    senso: 'seiso',
    numero: 5,
    titulo: 'Há sujeira em armários, utensílios, lâmpadas, exaustor e ventiladores?',
    descricao_criterio: '5 - Há sujeira em armários, utensílios, lâmpadas, exaustor e ventiladores?',
    padrao_esperado: 'Superfícies superiores, aletas de ventiladores e luminárias livres de poeira e teias.',
    ativo: true
  },

  // SENSO DE SAÚDE (5 itens)
  {
    id: 'q-saude-1',
    senso: 'seiketsu',
    numero: 1,
    titulo: 'Existe padronização nas faixas de segurança?',
    descricao_criterio: '1 - Existe padronização nas faixas de segurança?',
    padrao_esperado: 'Pintura visível em amarelo trânsito e zebrada para áreas de risco e emergência.',
    ativo: true
  },
  {
    id: 'q-saude-2',
    senso: 'seiketsu',
    numero: 2,
    titulo: 'Houve incidende, acidente no mês?',
    descricao_criterio: '2 - Houve incidende, acidente no mês?',
    padrao_esperado: 'Zero acidentes no setor com cumprimento total das normas de segurança do trabalho.',
    ativo: true
  },
  {
    id: 'q-saude-3',
    senso: 'seiketsu',
    numero: 3,
    titulo: 'Os equipamentos de segurança estão desobstruídos? (extintor, primeiros socorros, etc)',
    descricao_criterio: '3 - Os equipamentos de segurança estão desobstruídos? (extintor, primeiros socorros, etc)',
    padrao_esperado: 'Área de 1m livre na frente de todos os extintores, hidrantes, macas e painéis elétricos.',
    ativo: true
  },
  {
    id: 'q-saude-4',
    senso: 'seiketsu',
    numero: 4,
    titulo: 'As pessoas estão utilizando EPI?',
    descricao_criterio: '4 - As pessoas estão utilizando EPI?',
    padrao_esperado: '100% dos colaboradores com bota, protetor auricular, óculos, luvas e capacetes aplicáveis.',
    ativo: true
  },
  {
    id: 'q-saude-5',
    senso: 'seiketsu',
    numero: 5,
    titulo: 'O DSS está sendo feito toda semana?',
    descricao_criterio: '5 - O DSS está sendo feito toda semana?',
    padrao_esperado: 'Diálogo Semanal de Segurança registrado em ata com assinatura dos presentes.',
    ativo: true
  },

  // SENSO DE DISCIPLINA (5 itens)
  {
    id: 'q-disc-1',
    senso: 'shitsuke',
    numero: 1,
    titulo: 'As tarefas estão sendo executadas conforme normas e procedimento?',
    descricao_criterio: '1 - As tarefas estão sendo executadas conforme normas e procedimento?',
    padrao_esperado: 'Equipe segue os POPs e instruções de trabalho sem desvios operacionais.',
    ativo: true
  },
  {
    id: 'q-disc-2',
    senso: 'shitsuke',
    numero: 2,
    titulo: 'Os colaboradores sabem o que é o 5s?',
    descricao_criterio: '2 - Os colaboradores sabem o que é o 5s?',
    padrao_esperado: 'Operadores entrevistados demonstram conhecimento dos sensos e da importância para a UAA.',
    ativo: true
  },
  {
    id: 'q-disc-3',
    senso: 'shitsuke',
    numero: 3,
    titulo: 'É realizado reuniões para divulgação de resultados no setor?',
    descricao_criterio: '3 - É realizado reuniões para divulgação de resultados no setor?',
    padrao_esperado: 'Quadro de gestão à vista atualizado e reunião de feedback mensal com a equipe.',
    ativo: true
  },
  {
    id: 'q-disc-4',
    senso: 'shitsuke',
    numero: 4,
    titulo: 'A nota da auditoria de 5s anterior foi maior que 80%?',
    descricao_criterio: '4 - A nota da auditoria de 5s anterior foi maior que 80%?',
    padrao_esperado: 'Desempenho histórico mantido em patamar de conformidade (acima de 80%).',
    ativo: true
  },
  {
    id: 'q-disc-5',
    senso: 'shitsuke',
    numero: 5,
    titulo: 'Existe algum plano de ação 5S em atraso?',
    descricao_criterio: '5 - Existe algum plano de ação 5S em atraso?',
    padrao_esperado: 'Zero planos de ação com prazo vencido; ações encerradas com validação.',
    ativo: true
  }
];

export const INITIAL_SCHEDULED_AUDITS: ScheduledAudit[] = [];

export const INITIAL_AUDITS: Audit[] = [];

export const INITIAL_ACTION_PLANS: ActionPlan[] = [];

export const HISTORICAL_EVOLUTION: HistoryPoint[] = [];
