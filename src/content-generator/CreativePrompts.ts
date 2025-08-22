import { MessageStyle, MessageTopic } from '../types';

/**
 * Sistema de templates e prompts para geração de conteúdo criativo
 */
export class CreativePrompts {
  /**
   * Templates base para cada estilo de mensagem
   */
  static getStyleTemplates(): Record<MessageStyle, string[]> {
    return {
      [MessageStyle.HUMOR]: [
        'Por que {tech_element}? Porque {funny_reason}! 😄',
        '{situation} é como {comparison} - {punchline}! 🤣',
        'A vida de dev: {expectation} vs {reality}. {comment}! 😅',
        'Se {tech_thing} fosse pessoa, seria {personality} porque {reason}! 🤖',
        '{number}% dos bugs acontecem quando {situation}. Os outros {percentage}% são mistério! 🐛',
      ],

      [MessageStyle.CURIOSITY]: [
        'Você sabia que {interesting_fact}? {mind_blown_detail}! 🤯',
        'Curiosidade tech: {tech_element} foi criado porque {origin_story}! 🔍',
        'Fato curioso: {surprising_stat} dos {group} fazem {action}. Surreal! 📊',
        '{famous_tech} quase se chamou {alternative_name}. Imagina {scenario}! 🤔',
        'Easter egg: {hidden_feature} existe em {product} desde {year}! 🥚',
      ],

      [MessageStyle.TIP]: [
        'Dica rápida: {shortcut} vai economizar {time_saved} do seu dia! ⚡',
        'Pro tip: {technique} + {tool} = {amazing_result}! 💡',
        'Hack de dev: quando {problem}, use {solution}. Funciona sempre! 🛠️',
        'Segredo: {expert_advice} vai mudar sua forma de {activity}! 🎯',
        'Life hack: {simple_trick} elimina {common_frustration} para sempre! ✨',
      ],

      [MessageStyle.REFLECTION]: [
        'E se {hypothetical_scenario}? {thought_provoking_question}! 🤔',
        'Paradoxo tech: {contradiction}. Como isso faz sentido? 🧠',
        'Reflexão: {current_trend} vai nos levar para {future_prediction}? 🔮',
        'Filosofia de código: {deep_question} define {broader_concept}! 💭',
        'Plot twist: {unexpected_perspective} sobre {common_topic}! 🎭',
      ],
    };
  }

  /**
   * Banco de elementos criativos para substituição nos templates
   */
  static getCreativeElements(): Record<string, string[]> {
    return {
      tech_elements: [
        'JavaScript',
        'Python',
        'Git',
        'Docker',
        'APIs',
        'Machine Learning',
        'React',
        'Node.js',
        'MongoDB',
        'AWS',
        'Kubernetes',
        'CSS',
      ],

      funny_reasons: [
        'até os bugs tem medo dele',
        'funciona por pura magia',
        'foi criado numa sexta à noite',
        'ninguém lê a documentação mesmo',
        'Stack Overflow manda',
      ],

      dev_situations: [
        'código funcionando sem você saber por quê',
        'deploy na sexta-feira',
        'código legado de 2015',
        'reunião que poderia ser um email',
        'estimativa de 2 horas virando 2 dias',
      ],

      tech_comparisons: [
        'relacionamento complicado',
        'receita de bolo mal explicada',
        'IKEA sem manual',
        'GPS que só funciona quando quer',
        'gato de Schrödinger',
      ],

      surprising_stats: ['78%', '92%', '67%', '84%', '73%', '89%', '65%', '91%'],

      productivity_hacks: [
        'Dark mode + café',
        'Rubber duck debugging',
        'Pomodoro com música lo-fi',
        'Commits pequenos e frequentes',
        'Comentários em português',
      ],

      common_frustrations: [
        'merge conflicts',
        'dependencies quebradas',
        'CSS que não coopera',
        'bugs que só aparecem em produção',
        'Internet lenta no deploy',
      ],

      future_predictions: [
        'robôs programando robôs',
        'IA que debugga nossa vida pessoal',
        'Git commits por telepatia',
        'CSS que finalmente faz sentido',
        'bugs que se consertam sozinhos',
      ],
    };
  }

  /**
   * Prompts específicos para cada tópico
   */
  static getTopicPrompts(): Record<MessageTopic, string[]> {
    return {
      [MessageTopic.TECH_HUMOR]: [
        'Crie uma piada inteligente sobre alguma linguagem de programação ou ferramenta famosa',
        'Faça uma observação engraçada sobre situações típicas do desenvolvimento',
        'Invente uma analogia hilária comparando programação com situações do dia a dia',
      ],

      [MessageTopic.DEV_LIFE]: [
        'Descreva de forma cômica uma situação real que todo desenvolvedor já viveu',
        'Crie humor sobre a diferença entre expectativa vs realidade na programação',
        'Faça uma piada sobre hábitos peculiares dos desenvolvedores',
      ],

      [MessageTopic.CODE_WISDOM]: [
        "Compartilhe uma 'sabedoria' de programação de forma engraçada mas útil",
        'Dê um conselho sobre boas práticas com tom bem-humorado',
        'Explique um conceito técnico usando analogias divertidas',
      ],

      [MessageTopic.TECH_FACTS]: [
        'Revele um fato surpreendente sobre tecnologia que poucos conhecem',
        'Conte uma história maluca por trás de alguma tecnologia famosa',
        'Compartilhe uma estatística ou curiosidade tech que vai impressionar',
      ],

      [MessageTopic.LEGAL_TECH]: [
        'Faça humor inteligente sobre LGPD, compliance ou direito digital',
        'Crie uma piada sobre a interseção entre tecnologia e legislação',
        'Comente de forma engraçada sobre como a tecnologia criou novos problemas jurídicos',
      ],

      // Tópicos de compatibilidade
      [MessageTopic.DEVELOPMENT]: [
        'Crie humor sobre desenvolvimento de software, linguagens ou frameworks',
        'Faça uma piada sobre debugging, deploy ou situações de desenvolvimento',
        'Invente algo engraçado sobre a vida de programador',
      ],

      [MessageTopic.PROJECT_MANAGEMENT]: [
        'Una gestão de projetos com humor sobre realidade de desenvolvedor',
        'Faça piadas sobre sprints, deadlines ou estimativas de tempo',
        'Crie humor sobre a comunicação entre PMs e desenvolvedores',
      ],

      [MessageTopic.AGILE]: [
        'Conecte metodologias ágeis com situações divertidas do dia a dia',
        'Faça humor sobre Scrum, Kanban ou cerimônias ágeis',
        'Crie piadas sobre retrospectivas ou daily meetings',
      ],

      [MessageTopic.MIXED]: [
        'Seja completamente criativo misturando qualquer tema tech de forma surpreendente',
        'Invente algo original que conecte tecnologia com situações inesperadas',
        'Crie conteúdo inovador que vai fazer a equipe parar para pensar e rir',
      ],
    };
  }

  /**
   * Prompts especiais para dias específicos
   */
  static getDaySpecificPrompts(): Record<number, string[]> {
    return {
      1: [
        // Segunda
        'Motive a equipe para começar a semana com energia tech positiva',
        "Crie algo engraçado sobre 'segunda-feira de desenvolvedor'",
        'Faça uma piada sobre voltar ao trabalho depois do fim de semana',
      ],

      2: [
        // Terça
        'Compartilhe algo produtivo mas divertido para manter o ritmo',
        'Dê uma dica útil com humor para impulsionar a terça',
        'Faça uma curiosidade tech que anime o meio da semana',
      ],

      3: [
        // Quarta
        'Crie conteúdo criativo para o meio da semana - seja inovador',
        'Faça uma reflexão engraçada sobre estar no meio da jornada semanal',
        'Compartilhe algo que desperte curiosidade técnica',
      ],

      4: [
        // Quinta
        'Anime a equipe para a reta final da semana com algo inspirador',
        "Crie humor sobre 'quinta-feira de sprint final'",
        'Faça uma observação inteligente sobre produtividade tech',
      ],

      5: [
        // Sexta
        'Celebre o fim da semana com humor tech de alta qualidade',
        'Faça uma piada sobre deploy de sexta ou fim de sprint',
        'Crie algo engraçado sobre merecer o descanso depois de uma semana de código',
      ],
    };
  }

  /**
   * Instruções de criatividade por contexto
   */
  static getCreativityInstructions(): {
    high_energy: string;
    balanced: string;
    thoughtful: string;
    celebrative: string;
  } {
    return {
      high_energy: 'Seja SUPER energético! Use exclamações, emojis e linguagem que anime a galera!',

      balanced: 'Mantenha equilíbrio entre humor e utilidade. Seja criativo mas relevante!',

      thoughtful: 'Seja mais reflexivo e inteligente. Use humor sutil que faça pensar!',

      celebrative: 'É hora de comemorar! Seja festivo, positivo e contagiante!',
    };
  }

  /**
   * Palavras-chave que devem aparecer com frequência para manter relevância
   */
  static getTechKeywords(): string[] {
    return [
      // Linguagens
      'JavaScript',
      'Python',
      'TypeScript',
      'Java',
      'C++',
      'Go',
      'Rust',

      // Frameworks
      'React',
      'Vue',
      'Angular',
      'Node.js',
      'Express',
      'Next.js',

      // Ferramentas
      'Git',
      'Docker',
      'Kubernetes',
      'AWS',
      'GitHub',
      'VS Code',

      // Conceitos
      'API',
      'microservices',
      'DevOps',
      'CI/CD',
      'database',
      'frontend',
      'backend',

      // Metodologias
      'Agile',
      'Scrum',
      'Kanban',
      'TDD',
      'clean code',
      'refactoring',

      // Problemas comuns
      'bug',
      'debug',
      'deploy',
      'merge conflict',
      'dependency',
      'performance',
    ];
  }

  /**
   * Frases que criam conexão emocional com desenvolvedores
   */
  static getConnectionPhrases(): string[] {
    return [
      'todo dev já passou por isso',
      'se você nunca fez isso, não é dev de verdade',
      'a realidade que ninguém fala',
      'o que todo PM deveria saber',
      'a verdade que dói mas precisa ser dita',
      'se isso não te representa, você não é humano',
      'plot twist que todo desenvolvedor conhece',
      'a lei universal da programação',
    ];
  }
}
