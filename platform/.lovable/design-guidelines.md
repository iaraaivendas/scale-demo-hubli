# I.ARA Scale - Design Guidelines

## LAYOUT GERAL
- Grid responsivo com gaps consistentes (gap-4 ou gap-6)
- Padding: p-6/p-8 desktop, p-4 mobile
- max-w-7xl mx-auto para conteúdo principal
- Espaçamento vertical: space-y-6 ou space-y-8

## DASHBOARDS
- Cards: shadow-md, rounded-xl, bordas semânticas (border-border)
- Hierarquia visual: métricas principais em destaque
- Gráficos: min-h-[300px] ou min-h-[400px]
- Grid responsivo: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
- Headers com títulos claros e ações à direita
- Empty states com ícones e mensagens amigáveis

## TIPOGRAFIA
- Títulos: text-2xl/text-3xl font-bold text-foreground
- Subtítulos: text-xl font-semibold text-foreground
- Corpo: text-base text-foreground
- Labels: text-sm text-muted-foreground
- Legendas: text-xs text-muted-foreground
- Line-height: leading-relaxed para blocos de texto
- Max-width: max-w-prose para parágrafos

## CORES
- NUNCA usar cores diretas (text-gray-700, bg-black, etc.)
- SEMPRE usar tokens semânticos: text-foreground, text-muted-foreground, bg-card, bg-background, etc.
- Verde I.ARA APENAS para CTAs, ícones e destaques (primary)
- Contraste mínimo 4.5:1
- Dark/Light mode via CSS variables

## COMPONENTES INTERATIVOS
- Botões: estados hover, active, disabled definidos
- Inputs: labels visíveis, placeholders descritivos
- Feedback: loading states, success/error via toast
- Tooltips para informações adicionais
- Modais: overlay bg-black/50, centralizados

## RESPONSIVIDADE
- Mobile-first
- Breakpoints: sm(640), md(768), lg(1024), xl(1280)
- Navegação adaptável (hamburger em mobile)
- Tabelas: overflow-x-auto em mobile
- Formulários: col única mobile, múltiplas desktop

## ACESSIBILIDADE
- Labels em todos os inputs (htmlFor)
- Cores não como único indicador
- Navegação por teclado (focus-visible)
- Mensagens de erro claras
- Ícones + texto sempre que possível

## PERFORMANCE VISUAL
- Skeleton loaders durante carregamento
- Animações: transition-all duration-200
- Evitar layout shifts
- Lazy loading para imagens pesadas

## TOKENS CSS (index.css)
- --background, --foreground
- --card, --card-foreground
- --primary, --primary-foreground
- --secondary, --secondary-foreground
- --muted, --muted-foreground
- --accent, --accent-foreground
- --destructive, --destructive-foreground
- --border, --input, --ring
- --success, --warning, --info
