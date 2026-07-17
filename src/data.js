// src/data.js (Corrected)

// I18N HELPER: A clean way to define multilingual strings.
const i18n = (en, pt) => ({ en, pt });

const holofante = {
  logoUrl: "assets/logos/holofante/logo.jpeg",
  id: "holofante",
  slug: "agentic-ai-design",
  year: i18n("2026 ∙ Holofante R&D lab", "2026 ∙ Laboratório P&D Holofante"),
  audioSrc: i18n("assets/audio/en/holofante/audio-holofante-summary.mp3", "assets/audio/pt/holofante/pt-audio-holofante-summary.mp3"),
    audioSrcRecruiter: i18n("assets/audio/en/holofante/audio-holofante-dev.mp3", "assets/audio/pt/holofante/pt-audio-holofante-dev.mp3"),
    readTime: i18n("3 min", "3 min"),
    title: i18n("Agentic AI Design", "Design de IA Agêntica"),
    shortDesc: i18n("DesignOps automation cuts delivery latency by 70%.", "Automação de DesignOps reduz a latência de entrega em 70%."),
    aiSummary: i18n("Holofante lab required a scalable post-sale portal to align clients. This solution introduced self-service scheduling and real-time tracking, vastly reducing operational overhead and account management blind spots.", "O laboratório Holofante exigia um portal pós-venda escalável para alinhar clientes. Esta solução introduziu agendamento self-service e rastreamento em tempo real, reduzindo drasticamente a carga operacional e os pontos cegos no gerenciamento de contas."),
    repositoryUrl: "https://github.com/schimanko/holofante",
    liveUrl: "https://holofante.vercel.app",
    keyIndicators: [
      { value: "18 → 5.3", label: i18n("Days to first deliverable", "Dias para a primeira entrega") },
      { value: "10h+", label: i18n("Weekly hours recovered", "Horas semanais recuperadas") },
      { value: "100%", label: i18n("UI Consistency", "Consistência de UI") },
      { value: "< 2s", label: i18n("UI Latency", "Latência da UI") }
    ],
    aiFollowUps: [
      i18n("How was latency reduced by 70%?", "Como a latência foi reduzida em 70%?"),
      i18n("Explain the DesignOps automation.", "Explique a automação de DesignOps.")
    ],
    desc: i18n(`
            <p class="p1">
    This solo product engineering project was built inside an applied R&D
    lab to solve critical post-sale delivery bottlenecks common in agency environments.
    Managing multiple parallel software builds frequently introduces communication
    blindness, client anxiety, and heavy manual alignment overhead when tracking
    updates are scattered across fragmented channels.
</p>
<h3>
    Client Portal
</h3>
<p class="p1">
    A unified mobile web portal was designed and engineered from scratch to
    establish absolute transparency. By mapping real-time operational milestones
    onto a high-contrast layout matrix, the interface delivers total status
    clarity with zero cognitive delay for the user.
</p>
<p class="p1">
    The workspace completely automates the fragile transition window immediately
    following contract signing. The system seamlessly handles post-sale paperwork
    generation, initializes secure electronic signing workflows, and maps preliminary
    financial schedules instantly—allowing clients to access their tracking
    dashboard without waiting for manual onboarding intervention.
</p>
<div class="combo-asset-card">
    <div class="combo-tabs">
        <button class="combo-tab active" data-target="tab-dashboard-view">
            Project Dashboard
        </button>
        <button class="combo-tab" data-target="tab-history-view">
            Project History
        </button>
        <button class="combo-tab" data-target="tab-download-view">
            Secure Download
        </button>
    </div>
    <div class="combo-content active" data-id="tab-dashboard-view">
        <img src="assets/cases/en/holofante/5.avif" alt="Lighthouse Score" class="case-img-fluid">
        <div class="combo-divider">
        </div>
        <p class="combo-observation">
            Observation: Consolidating complex system milestones into high-contrast,
            visual timeline nodes helps scanning users pinpoint their project's operational
            state in seconds.
        </p>
    </div>
    <div class="combo-content" data-id="tab-history-view">
        <img src="assets/cases/en/holofante/5.avif" alt="Lighthouse Score" class="case-img-fluid">
        <div class="combo-divider">
        </div>
        <p class="combo-observation">
            Observation: Maintaining a continuous, transparent event ledger establishes
            total accountability, eliminating common scope misunderstandings or alignment
            gaps.
        </p>
    </div>
    <div class="combo-content" data-id="tab-download-view">
        <div class="dark-info-card">
            <span class="case-icon-large">
                ðŸ”’
            </span>
            <strong>
                Isolated Asset Transfer Hub
            </strong>
            <p class="case-icon-subtitle">
                Dedicated interface component optimized for frictionless client access
                to finalized documentation and design packages.
            </p>
        </div>
        <div class="combo-divider">
        </div>
        <p class="combo-observation">
            Observation: Moving file distributions to a dedicated delivery hub declutters
            primary tracking workflows while reinforcing trust during major project
            handoffs.
        </p>
    </div>
</div>
<h3>
    Self Scheduling
</h3>
<p class="p1">
    To eliminate the friction of scheduling alignments over endless email
    threads, a self-service module was deeply integrated into the client dashboard.
    This feature gives users complete autonomy to view open availability grids
    and secure technical alignment syncs instantly.
</p>
<p class="p1">
    The scheduling UX balances client freedom with operational reality. To
    protect engineering focus and maintain development velocity, built-in system
    guardrails passively limit users to a single active appointment per project
    phase, preventing calendar crowding before it can happen.
</p>
        <div class="combo-asset-card">
            
            <div class="combo-divider">
            </div>
            <p class="combo-observation">
                Observation: Providing standalone, contextual booking path pathways eliminates
                coordination delays and ensures calendars stay strictly aligned with the
                current phase of work.
            </p>
        </div>
<h3>
    Tracker Ledger
</h3>
<p class="p1">
    The core application pattern uses an instantaneous request registry to
    dramatically reduce customer anxiety. Whenever a critical product ticket
    or review request is filed, the interface immediately surfaces localized
    tracking timestamps to confirm receipt.
</p>
<p class="p1">
    By using the local interface to validate that information has been successfully
    captured, the app sets clear response expectations right at the point of
    action. Secondary communication and deep file investigations are gracefully
    shifted to dedicated background channels, keeping the mobile portal incredibly
    lightweight and performant.
</p>

        <div class="combo-asset-card">
            
            <div class="combo-divider">
            </div>
            <p class="combo-observation">
                Observation: Proactively surfacing live confirmation states satisfies
                user uncertainty, drastically decreasing the volume of manual "just checking
                in" support inquiries.
            </p>
        </div>

<h3>
    Support Center
</h3>
<p class="p1">
    The support dashboard functions as a centralized directory card pattern,
    grouping essential communication channels, reference guides, and agreements.
    This architecture ensures that cross-functional stakeholders never feel
    "lost" when looking for help.
</p>
<p class="p1">
    To ensure product quality without corrupting public review channels, the
    portal uses a smart redirection loop for satisfaction assessments. This
    path seamlessly opens an isolated feedback workspace, encouraging unfiltered,
    honest customer reviews while protecting the company's external business
    profiles.
</p>
<div class="case-asset-wrapper">
    <div class="case-asset-box">
        <div class="combo-asset-card">
            <div class="dark-info-card">
                <span class="case-icon-xlarge">
                    ðŸ› ï¸ 
                </span>
                <strong>
                    Central Support Directory
                </strong>
                <p class="dark-info-desc">
                    An accessible directory hub clustering communication pathways, master
                    references, and dedicated customer feedback loops.
                </p>
            </div>
            <div class="combo-divider">
            </div>
            <p class="combo-observation">
                Observation: Grouping fallback assistance resources into an unambiguous,
                structured card pattern firmly anchors user confidence within the application
                ecosystem.
            </p>
        </div>
    </div>
</div>
`, `
<p class="p1">
    Este projeto solo de engenharia de produto foi construído dentro de um
    laboratório de P&D para resolver gargalos críticos na entrega pós-venda,
    comuns em ambientes de agência. Gerenciar múltiplas construções de software
    paralelas frequentemente introduz cegueira de comunicação, ansiedade no
    cliente e uma pesada carga manual de alinhamento quando as atualizações
    estão espalhadas por canais fragmentados.
</p>
<h3>
    Portal do Cliente
</h3>
<p class="p1">
    Um portal web mobile unificado foi projetado e construído do zero para
    estabelecer transparência absoluta. Ao mapear marcos operacionais em tempo
    real em uma matriz de layout de alto contraste, a interface oferece total
    clareza de status com zero atraso cognitivo para o usuário.
</p>
<p class="p1">
    O workspace automatiza completamente a frágil janela de transição imediatamente
    após a assinatura do contrato. O sistema lida perfeitamente com a geração
    de papelada pós-venda, inicializa fluxos de assinatura eletrônica seguros
    e mapeia cronogramas financeiros instantaneamente — permitindo que os clientes
    acessem seu painel de rastreamento sem esperar pela intervenção manual
    de onboarding.
</p>
<div class="combo-asset-card">
    <div class="combo-tabs">
        <button class="combo-tab active" data-target="tab-dashboard-view">
            Painel do Projeto
        </button>
        <button class="combo-tab" data-target="tab-history-view">
            Histórico do Projeto
        </button>
        <button class="combo-tab" data-target="tab-download-view">
            Download Seguro
        </button>
    </div>
    <div class="combo-content active" data-id="tab-dashboard-view">
        <img src="assets/cases/holofante/5.avif" alt="Lighthouse Score" class="case-img-fluid">
        <div class="combo-divider">
        </div>
        <p class="combo-observation">
            Observação: Consolidar marcos complexos do sistema em nós visuais de linha
            do tempo de alto contraste ajuda os usuários a identificar o estado operacional
            de seu projeto em segundos.
        </p>
    </div>
    <div class="combo-content" data-id="tab-history-view">
        <img src="assets/cases/holofante/5.avif" alt="Lighthouse Score" class="case-img-fluid">
        <div class="combo-divider">
        </div>
        <p class="combo-observation">
            Observação: Manter um registro de eventos contínuo e transparente estabelece
            responsabilidade total, eliminando mal-entendidos de escopo ou lacunas
            de alinhamento.
        </p>
    </div>
    <div class="combo-content" data-id="tab-download-view">
        <div class="dark-info-card">
            <span class="case-icon-large">
                ðŸ”’
            </span>
            <strong>
                Hub Isolado de Transferência de Ativos
            </strong>
            <p class="case-icon-subtitle">
                Componente de interface dedicado otimizado para o acesso sem atrito a
                documentações finalizadas e pacotes de design.
            </p>
        </div>
        <div class="combo-divider">
        </div>
        <p class="combo-observation">
            Observação: Mover as distribuições de arquivos para um hub de entrega
            dedicado desobstrui os fluxos de trabalho de rastreamento principais enquanto
            reforça a confiança.
        </p>
    </div>
</div>
<h3>
    Auto-agendamento
</h3>
<p class="p1">
    Para eliminar o atrito de agendamentos em infinitas threads de email,
    um módulo self-service foi profundamente integrado ao painel do cliente.
    Esse recurso dá aos usuários total autonomia para visualizar as disponibilidades
    e garantir sincronizações técnicas instantaneamente.
</p>
<p class="p1">
    A UX de agendamento equilibra a liberdade do cliente com a realidade operacional.
    Para proteger o foco da engenharia e manter a velocidade de desenvolvimento,
    as proteções do sistema limitam passivamente os usuários a um agendamento
    ativo por fase do projeto, impedindo a superlotação do calendário antes
    que ela aconteça.
</p>
<div class="case-asset-wrapper">
    <div class="case-asset-box">
        <div class="combo-asset-card">
            <div class="dark-info-card">
                <span class="case-icon-xlarge">
                    ðŸ“…
                </span>
                <strong>
                    Calendário Autônomo
                </strong>
                <p class="dark-info-desc">
                    Framework de seleção direta de horários que revela a disponibilidade em
                    tempo real para contornar bloqueios de coordenação.
                </p>
            </div>
            <div class="combo-divider">
            </div>
            <p class="combo-observation">
                Observação: Fornecer caminhos de reserva independentes e contextuais elimina
                atrasos de coordenação e garante que os calendários permaneçam estritamente
                alinhados com a fase atual do trabalho.
            </p>
        </div>
    </div>
</div>
<h3>
    Registro de Chamados
</h3>
<p class="p1">
    O padrão central da aplicação usa um registro de solicitações instantâneo
    para reduzir drasticamente a ansiedade do cliente. Sempre que um ticket
    de produto crítico ou solicitação de revisão é feito, a interface imediatamente
    exibe carimbos de data/hora de rastreamento localizados para confirmar
    o recebimento.
</p>
<p class="p1">
    Ao usar a interface local para validar que as informações foram capturadas
    com sucesso, o aplicativo define expectativas claras de resposta no ponto
    de ação. Comunicações secundárias são transferidas elegantemente para canais
    de fundo, mantendo o portal móvel incrivelmente leve e eficiente.
</p>
<div class="case-asset-wrapper">
    <div class="case-asset-box">
        <div class="combo-asset-card">
            <div class="dark-info-card">
                <span class="case-icon-xlarge">
                    ðŸ“‚
                </span>
                <strong>
                    Registro de Tickets de Serviço
                </strong>
                <p class="dark-info-desc">
                    Um registro de status transparente visualizando logs de envio e estados
                    de progresso atuais para combater a fadiga de follow-up.
                </p>
            </div>
            <div class="combo-divider">
            </div>
            <p class="combo-observation">
                Observação: Revelar proativamente estados de confirmação ao vivo satisfaz
                a incerteza do usuário, diminuindo drasticamente o volume de perguntas
                manuais de suporte.
            </p>
        </div>
    </div>
</div>
<h3>
    Central de Suporte
</h3>
<p class="p1">
    O painel de suporte funciona como um padrão de cartão de diretório centralizado,
    agrupando canais de comunicação essenciais, guias de referência e acordos.
    Essa arquitetura garante que as partes interessadas nunca se sintam "perdidas"
    ao procurar ajuda.
</p>
<p class="p1">
    Para garantir a qualidade do produto sem corromper os canais de revisão
    públicos, o portal usa um loop de redirecionamento inteligente para avaliações
    de satisfação. Esse caminho abre perfeitamente um espaço de feedback isolado,
    encorajando revisões honestas e sem filtros enquanto protege os perfis
    externos da empresa.
</p>
<div class="case-asset-wrapper">
    <div class="case-asset-box">
        <div class="combo-asset-card">
            <div class="dark-info-card">
                <span class="case-icon-xlarge">
                    ðŸ› ï¸ 
                </span>
                <strong>
                    Diretório Central de Suporte
                </strong>
                <p class="dark-info-desc">
                    Um hub de diretório acessível agrupando caminhos de comunicação, referências
                    mestras e loops de feedback de clientes dedicados.
                </p>
            </div>
            <div class="combo-divider">
            </div>
            <p class="combo-observation">
                Observação: Agrupar recursos de assistência em um padrão de cartão não
                ambíguo ancora firmemente a confiança do usuário no ecossistema da aplicação.
            </p>
        </div>
    </div>
</div>
`),
    descRecruiter: i18n(`
<p class="p1">
This full-stack system architecture was solo-engineered inside an applied
R&D lab environment. The custom solution decouples frontend interactive
views from asynchronous database records, optimizing execution speeds and
main-thread performance during high-concurrency multi-tenant test runs.
</p>
<div class="combo-asset-card">
<div class="live-mermaid-container" data-a11y-title="System Architecture Matrix">
graph TD

    %% Client Layer
    subgraph Client_Runtime [Client Runtime Framework]
        UI[UI Viewport Layer] --> Router[Abstract Many-to-One Router]
        Router --> Ctrl[Application Controller Core]
        Ctrl --> VirtualDOM[List Repeater Virtual DOM]
    end

    %% Security Layer
    subgraph Sandbox_Guardrails [Sandbox Guardrails]
        Ctrl --> Interceptor[Promise-Based Interceptor]
        Interceptor --> Webview[Isolated Webview Container]
    end

    %% Core Backend Layer
    subgraph Cloud_Infrastructure [Cloud Infrastructure]
        Ctrl --> API[Relational Cloud API Gateway]
        API --> Concurrency[UUID and Project Phase Constraint Layer]
        Concurrency --> SQL[(Relational Cloud Database Tables)]
        API --> Notion[(External Project State Matrix)]
    end

</div>
<div class="combo-divider">
</div>
<p class="combo-observation">
Observation: The initialization pipeline intercepts empty query sets to
map layout parameters directly to safe fallback containers, programmatically
preventing unhandled null rendering anomalies.
</p>
<div class="combo-divider">
</div>
<pre>
<code class="language-javascript">
// Client-side application controller initialization loop framework.onReady(async
function () { try { const activeRows = await dataStore.fetchActiveProjects();
if (!activeRows || activeRows.length === 0) { displayFallbackContainer("Nenhum
projeto ativo cadastrado."); } else { ui.select('#workspaceLayout').expand();
ui.select('#emptyStateContainer').collapse(); } } catch (err) { console.error("Core
Engine Runtime Exception:", err); displayFallbackContainer("Erro de comunicação
com o servidor."); } });
</code>
</pre>
</div>
<h3>
State Matrix
</h3>
<p class="p1">
The client-side controller executes explicit application lifecycle checks
to evaluate data hydration states upon initialization. When an empty project
exception is caught or an invalid user relation model is identified, the
exception handler systematically mutates the layout tree—collapsing primary
workspace nodes and expanding an isolated fallback UI container.
</p>
<div class="combo-asset-card">
<div class="telemetry-visual">
<div class="telemetry-overlay">
<span class="telemetry-pill">
    Latency: 42ms
</span>
<span class="telemetry-pill" data-metric="load">
    <span class="pulse-dot">
    </span>
    Threads: Asynchronous
</span>
</div>
</div>
<p class="combo-observation">
Observation: Orchestrating asynchronous mutation payloads with delayed
window termination frames guarantees complete state cleanup before discarding
active view memory allocations.
</p>
<div class="combo-divider">
</div>
<pre>
<code class="language-javascript">
// Scheduling transaction loop and automated memory teardown submitAppointmentRequest(payload)
.then((booking) => { if (booking.status === "PENDING" || booking.status
=== "CONFIRMED") { ui.showToastNotification('Agendado com sucesso.', ui.ToastType.SUCCESS);
} clearFormFields(); setTimeout(async () => { await navigation.closeScreenOverlay({
success: true }); }, 200); }); function clearFormFields() { ui.select('#datePickerField').value
= null; ui.select('#projectSelectionDropdown').value = null; }
</code>
</pre>
</div>
<h3>
Concurrency Control
</h3>
<p class="p1">
The booking transaction engine handles incoming scheduling vectors and
transmits data structures to relational cloud instances. To secure infrastructure
bandwidth and avoid double-booking race conditions, a backend constraint
layer evaluates row collisions against combined user UUIDs and project
identifiers, establishing a strict operational ceiling of one active appointment
per contract phase.
</p>
<div class="combo-asset-card">
<div class="telemetry-visual">
<div class="telemetry-code-block">
<span class="telemetry-title">
    [Interface Architecture - Navigation Mappings]
</span>
#actionCardContainer → navigation.routeTo() → target screen: 'marcarrequisitos'
<br/>
#secondaryIconButton → navigation.routeTo() → target screen: 'marcarrequisitos'
<br/>
#historyRowWrapper &nbsp; → navigation.routeTo() → target screen: 'minhasreunioes'
</div>
<div class="telemetry-overlay">
<span class="telemetry-pill">
    Bindings: Operational
</span>
</div>
</div>
<div class="combo-divider">
</div>
<p class="combo-observation">
Observation: Abstracting distinct user interaction targets into unified
routing functions eliminates script redundancies and optimizes client-side
package footprints.
</p>
</div>
<h3>
Routing Logic
</h3>
<p class="p1">
The client terminal uses a strict Many-to-One navigation architecture
to keep main-thread script overhead exceptionally low. Disparate UI interaction
models—including standalone cards, icon layout containers, and nested text
nodes—are bound to highly reusable, abstract routing wrappers that decouple
layout state from routing execution.
</p>
<div class="combo-asset-card">
<div class="live-mermaid-container" data-a11y-title="Data Hydration Schematic Mapping">
graph LR %% Source Layer subgraph Input_Dataset [Raw Cloud Database Records]
JSON[Raw Database Item Payload] end %% Transformation Pipeline subgraph
Parsing_Pipeline [listRepeater onItemReady Loop] Loop[Dynamic Item Mapping
Loop] --> DateObj[Construct new Date Instance] DateObj --> LocaleStr[Invoke
toLocaleDateString] Loop --> Condition{Is Status Pending} end %% UI Render
Layer subgraph Target_DOM [Virtualized Interface Nodes] LocaleStr --> Node1[Update
dateTextNode text] Condition -->|True| Node2[Expand statusBadgePending]
Condition -->|False| Node3[Collapse statusBadgePending] end JSON --> Loop
</div>
<div class="combo-divider">
</div>
<p class="combo-observation">
Observation: Dynamically resolving raw array payloads inside the component
parsing loop allows the renderer to inject real-time conditional state
flags without DOM-clogging layout thrashing.
</p>
<div class="combo-divider">
</div>
<pre>
<code class="language-javascript">
// Dynamic array parsing loop for repeating tracking cards listRepeater.onItemReady(($item,
rowData) => { const dateInstance = new Date(rowData._createdDate); $item('#dateTextNode').text
= dateInstance.toLocaleDateString('pt-BR'); $item('#statusBadgePending').collapse();
if (rowData.status === 'Pendente') { $item('#statusBadgePending').expand();
} });
</code>
</pre>
</div>
<h3>
Dynamic Ledger
</h3>
<p class="p1">
The application uses reactive list-rendering hooks to convert array data
objects straight into virtualized interface components. The parsing callback
converts raw ISO datetimes into explicit localized string outputs while
continuously validating row state keys to smoothly change sub-component
node visibilities.
</p>
<div class="combo-asset-card">
<div class="live-mermaid-container" data-a11y-title="Outbound Interception Sequence Flow">
sequenceDiagram autonumber participant App as UI Viewport Layer participant
Interceptor as Interceptor Middleware participant Modal as Async Promise
Modal participant Runtime as Isolated Web Container App->>Interceptor:
Outbound Navigation Attempt Note over Interceptor: Intercepts routing thread
Interceptor->>Modal: system.triggerModalAlert Note over Modal: Halts event
lifecycle loops Modal-->>Interceptor: User interaction response alt Confirm
Option Interceptor->>Runtime: launchExternalURL Note over Runtime: Mounts
external URL target else Cancel Option Interceptor-->>App: Resets queue
and handles cleanup end
</div>
<div class="combo-divider">
</div>
<p class="combo-observation">
Observation: Evaluating outbound deep links via promise-based confirmation
steps intercepts arbitrary sandbox escapes, protecting internal client
instances.
</p>
<div class="combo-divider">
</div>
<pre>
<code class="language-javascript">
// Outbound link interception and alert check routing const actionResult
= await system.triggerModalAlert(title, contextMessage, configurationFlags);
if (actionResult && actionResult.key === 'confirm') { nativeRuntime.launchExternalURL(SIMULATED_GOOGLE_PROFILE);
}
</code>
</pre>
</div>
<h3>
Sandbox Control
</h3>
<p class="p1">
To isolate the local application layer from unverified external contexts,
outbound redirect instructions pass through strict control flow interceptors
that demand user affirmation via non-blocking asynchronous alerts. Secondary
input metrics—such as qualitative satisfaction surveys—are isolated to
independent web containers to prevent untrusted remote variables from corrupting
local system tables.
</p>`, `
<p class="p1">Esta arquitetura de sistema full-stack foi projetada individualmente dentro de um ambiente laboratorial de P&D aplicado. A solução customizada separa visualizações interativas no front-end dos registros assíncronos do banco de dados, otimizando as velocidades de execução e o desempenho da thread principal durante testes de alta concorrência.</p>

<div class="combo-asset-card"> 
<div class="live-mermaid-container" data-a11y-title="System Architecture Matrix">
graph TD
%% Client Layer
subgraph Client_Runtime [Client Runtime Framework]
    UI[Camada Viewport de UI] --> Router[Roteador Abstrato]
    Router --> Ctrl[Controlador Central da Aplicação]
    Ctrl --> VirtualDOM[DOM Virtual com Repetidor de Lista]
end

%% Security Layer
subgraph Sandbox_Guardrails [Proteções da Sandbox]
    Ctrl --> Interceptor[Interceptor Baseado em Promessas]
    Interceptor --> Webview[Contêiner Webview Isolado]
end

%% Core Backend Layer
subgraph Cloud_Infrastructure [Infraestrutura Cloud]
    Ctrl --> API[API Gateway Relacional na Nuvem]
    API --> Concurrency[Camada de Restrição de UUID e Fase]
    Concurrency --> SQL[(Tabelas Relacionais do BD Cloud)]
    API --> Notion[(Matriz de Estado de Projeto Externa)]
end
</div>
<div class="combo-divider"></div> 
<p class="combo-observation">Observação: O pipeline de inicialização intercepta conjuntos de queries vazios para mapear parâmetros de layout diretamente para contêineres de fallback seguros, prevenindo anomalias de renderização nulas não tratadas.</p> 
<div class="combo-divider"></div> 
<pre><code class="language-javascript">// Loop de inicialização do controlador da aplicação no lado do cliente
framework.onReady(async function () {
try {
const activeRows = await dataStore.fetchActiveProjects();
if (!activeRows || activeRows.length === 0) {
displayFallbackContainer("Nenhum projeto ativo cadastrado.");
} else {
ui.select('#workspaceLayout').expand();
ui.select('#emptyStateContainer').collapse();
}
} catch (err) {
console.error("Exceção no Tempo de Execução do Motor Central:", err);
displayFallbackContainer("Erro de comunicação com o servidor.");
}
});</code></pre> 
</div>

<h3>Matriz de Estado</h3>
<p class="p1">O controlador no front-end executa checagens explícitas do ciclo de vida da aplicação para avaliar os estados de hidratação dos dados na inicialização. Quando uma exceção de projeto vazio é capturada ou um modelo de relação de usuário inválido é identificado, o manipulador de exceções muda sistematicamente a árvore de layout — colapsando nós primários do workspace e expandindo um contêiner de UI isolado para falhas.</p>

<div class="combo-asset-card"> 
<div class="telemetry-visual"> 
<div class="telemetry-overlay"> 
<span class="telemetry-pill">Latência: 42ms</span> 
<span class="telemetry-pill" data-metric="load"><span class="pulse-dot"></span> Threads: Assíncronas</span> 
</div> 
</div> 
<p class="combo-observation">Observação: Orquestrar cargas úteis de mutação assíncronas com quadros de término atrasados da janela garante a limpeza total do estado antes de descartar alocações de memória de visualização ativas.</p> 
<div class="combo-divider"></div> 
<pre><code class="language-javascript">// Loop de transação de agendamento e desconstrução automática da memória
submitAppointmentRequest(payload)
.then((booking) => {
if (booking.status === "PENDING" || booking.status === "CONFIRMED") {
ui.showToastNotification('Agendado com sucesso.', ui.ToastType.SUCCESS);
}
clearFormFields();
setTimeout(async () => { await navigation.closeScreenOverlay({ success: true }); }, 200);
});

function clearFormFields() {
ui.select('#datePickerField').value = null;
ui.select('#projectSelectionDropdown').value = null;
}</code></pre> 
</div>

<h3>Controle de Concorrência</h3>
<p class="p1">O motor de transação de agendamentos lida com vetores recebidos e os transmite para instâncias relacionais em nuvem. Para garantir a largura de banda e evitar problemas de duplicação, uma camada de restrições de back-end avalia colisões combinando UUIDs e identificadores, estabelecendo um teto rígido de um compromisso ativo por fase.</p>

<div class="combo-asset-card"> 
<div class="telemetry-visual"> 
<div class="telemetry-code-block">
<span class="telemetry-title">[Arquitetura de Interface - Mapeamento de Navegação]</span>
#actionCardContainer → navigation.routeTo() → target screen: 'marcarrequisitos'<br/>
#secondaryIconButton → navigation.routeTo() → target screen: 'marcarrequisitos'<br/>
#historyRowWrapper &nbsp; → navigation.routeTo() → target screen: 'minhasreunioes'
</div>
<div class="telemetry-overlay"> 
<span class="telemetry-pill">Vínculos: Operacionais</span> 
</div> 
</div> 
<div class="combo-divider"></div> 
<p class="combo-observation">Observação: Abstrair alvos distintos de interação em funções unificadas elimina redundâncias de script e otimiza a carga no cliente.</p> 
</div>

<h3>Lógica de Roteamento</h3>
<p class="p1">O terminal front-end usa uma rigorosa arquitetura Muitos-para-Um para manter os custos de thread principal baixíssimos. Modelos díspares de interação — incluindo cartões isolados e nós de texto aninhados — são vinculados a envelopes de roteamento abstratos que separam o estado visual da execução lógica.</p>

<div class="combo-asset-card"> 
<div class="live-mermaid-container" data-a11y-title="Data Hydration Schematic Mapping">
graph LR
%% Source Layer
subgraph Input_Dataset [Registros Brutos do Banco em Nuvem]
    JSON[Carga Útil de Item Bruto de BD]
end

%% Transformation Pipeline
subgraph Parsing_Pipeline [Loop listRepeater onItemReady]
    Loop[Loop de Mapeamento Dinâmico de Item] --> DateObj[Construir nova Instância Date]
    DateObj --> LocaleStr[Invocar toLocaleDateString]
    Loop --> Condition{Status Pendente?}
end

%% UI Render Layer
subgraph Target_DOM [Nós de Interface Virtualizados]
    LocaleStr --> Node1[Atualizar texto do dateTextNode]
    Condition -->|Verdadeiro| Node2[Expandir statusBadgePending]
    Condition -->|Falso| Node3[Colapsar statusBadgePending]
end

JSON --> Loop
</div>
<div class="combo-divider"></div> 
<p class="combo-observation">Observação: Resolver de modo dinâmico cargas brutas de arrays dentro do loop do componente permite ao motor injetar sinalizações condicionais em tempo real sem sobrecarregar o DOM.</p> 
<div class="combo-divider"></div> 
<pre><code class="language-javascript">// Loop dinâmico de análise de array para repetir cartões de rastreamento
listRepeater.onItemReady(($item, rowData) => {
const dateInstance = new Date(rowData._createdDate);
$item('#dateTextNode').text = dateInstance.toLocaleDateString('pt-BR');

$item('#statusBadgePending').collapse();
if (rowData.status === 'Pendente') {
$item('#statusBadgePending').expand();
}
});</code></pre> 
</div>

<h3>Razão Dinâmica</h3>
<p class="p1">A aplicação usa hooks reativos para converter objetos diretamente em componentes virtualizados. O callback de análise converte datas ISO cruas em strings localizadas explícitas, validando continuamente chaves de estado de linha para alterar de forma fluida a visibilidade dos sub-componentes.</p>

<div class="combo-asset-card"> 
<div class="live-mermaid-container" data-a11y-title="Outbound Interception Sequence Flow">
sequenceDiagram
autonumber
participant App as Camada Viewport de UI
participant Interceptor as Middleware Interceptor
participant Modal as Modal de Promessa Assíncrona
participant Runtime as Contêiner Web Isolado

App->>Interceptor: Tentativa de Navegação de Saída
Note over Interceptor: Intercepta thread de roteamento
Interceptor->>Modal: system.triggerModalAlert
Note over Modal: Interrompe ciclos de eventos
Modal-->>Interceptor: Resposta do usuário

alt Opção Confirmar
    Interceptor->>Runtime: launchExternalURL
    Note over Runtime: Monta alvo URL externo
else Opção Cancelar
    Interceptor-->>App: Reseta a fila e faz limpeza
end
</div>
<div class="combo-divider"></div> 
<p class="combo-observation">Observação: Avaliar links profundos de saída através de etapas de confirmação baseadas em promessas intercepta fugas arbitrárias, protegendo instâncias internas.</p> 
<div class="combo-divider"></div> 
<pre><code class="language-javascript">// Roteamento de interceptação e verificação de alertas em links de saída
const actionResult = await system.triggerModalAlert(title, contextMessage, configurationFlags);
if (actionResult && actionResult.key === 'confirm') {
nativeRuntime.launchExternalURL(SIMULATED_GOOGLE_PROFILE);
}</code></pre> 
</div>

<h3>Controle de Sandbox</h3>
<p class="p1">Para isolar a camada de aplicação local de contextos externos não verificados, instruções de redirecionamento de saída passam por restritos interceptores de fluxo que exigem a confirmação do usuário via alertas não bloqueantes. Métricas secundárias — como pesquisas qualitativas — são isoladas em contêineres independentes para evitar que variáveis remotas não confiáveis corrompam as tabelas do sistema local.</p>
`),
    credits: ["Lio Schimanko"],
    videoSrc: i18n("assets/videos/en/en-holofante.mp4", "assets/videos/pt/pt-holofante.mp4"),
    vttSrc: i18n("assets/subtitles/en/en-holofante.vtt", "assets/subtitles/pt/pt-holofante.vtt"),
    frameSrc: "assets/frames/holofante.avif",
    thumbSrc: i18n("/holofante.avif", "assets/thumbs/pt/pt-holofante.avif"),
    deviceClass: "iphone-17"
};

const testamentus = {
  logoUrl: "assets/logos/holofante/logo.jpeg",
  id: "testamentus",
  slug: "typographic-reader",
  title: i18n("Building an e-reader", "Construindo um e-reader"),
    year: i18n("2025 ∙ Testamentus.org", "2025 ∙ Testamentus.org"),
    audioSrc: i18n("assets/audio/en/testamentus/audio-testamentus-summary.mp3", "assets/audio/pt/testamentus/pt-audio-testamentus-summary.mp3"),
    audioSrcRecruiter: i18n("assets/audio/en/testamentus/audio-testamentus-dev.mp3", "assets/audio/pt/testamentus/pt-audio-testamentus-dev.mp3"),
    readTime: i18n("3 min", "3 min"),
    shortDesc: i18n("A privacy-first reading engine built for typographic focus.", "Um motor de leitura digital focado em privacidade e foco tipográfico."),
    aiSummary: i18n("Testamentus is a reading platform optimized for long-form retention. By strictly controlling line lengths and moving data to static edge delivery, it guarantees zero visual friction and instant load times.", "Testamentus é uma plataforma de leitura otimizada para retenção a longo prazo. Ao controlar estritamente comprimentos de linha e entregar os dados de forma estática, ela garante atrito visual zero e tempos de carregamento instantâneos."),
    liveUrl: "https://testamentus.org/",
    repositoryUrl: "https://github.com/schimanko/testamentus.org",
    keyIndicators: [
      { value: "+143%", label: i18n("Increase in average session duration", "Aumento na duração média da sessão") },
      { value: "US$ 5/mo", label: i18n("Fixed cost for scalable infrastructure", "Custo fixo para infraestrutura escalável") },
      { value: "0.9s", label: i18n("FCP Performance (100/100 PageSpeed)", "Desempenho FCP (100/100 no PageSpeed)") },
      { value: "92/100", label: i18n("WCAG AA Accessibility Compliance", "Conformidade de Acessibilidade WCAG AA") }
    ],
    desc: i18n(`<p class="p1">Testamentus was designed and solo-engineered to completely reinvent modern digital interaction with historical text by prioritizing extreme typographic discipline. Traditional digital reading options are heavily compromised by distracting ad networks, erratic layouts, and rigid viewports that create immediate visual friction and severe cognitive fatigue for the long-form reader.</p>

<h3>Typographic Ergonomics</h3>
<p class="p1">The core interface strips away standard web layout noise to deliver an elite, distraction-free reading column. Programmed around the tracking and fixation mechanics of human eye movement, the spatial boundaries restrict maximum line lengths, character scaling parameters, and tracking definitions. This intentional constraint eliminates subvocalization fatigue and tracking loss—where the eye loses its place moving from the end of one line to the beginning of the next—optimizing long-form reading speed.</p>

<div class="combo-asset-card"> 
  <img src="assets/cases/en/testamentus/3-2 2.png" alt="Testamentus Minimalist Interface Layout" class="case-img-rounded-full"> 
  <div class="combo-divider"></div> 
  <p class="combo-observation">Observation: Enforcing generous, intentional white space around columns shields text from side decorations, letting readers remain focused during deep reading sessions.</p> 
</div>

<h3>Frictionless Personalization</h3>
<p class="p1">To serve a broad spectrum of user reading accommodations without breaking narrative immersion, an elegant, non-disruptive configuration panel can be invoked instantly. Readers retain absolute control over text layout mechanics—adjusting font scale, line pacing, alignment, and letter spacing dynamically on the client side without triggering jarring page reflows or losing their active scroll position.</p>

<div class="combo-asset-card"> 
  <img src="assets/cases/en/testamentus/5 2.png" alt="Dynamic Typography Customization Control" class="case-img-rounded-full"> 
  <div class="combo-divider"></div> 
  <p class="combo-observation">Observation: Providing standalone, inline adjustments mutates text parameters instantly, updating legibility styles without forcing full page reloads or jumping the viewer's scroll location.</p> 
</div>

<h3>Dynamic Context Sharing (Privacy-First Growth Loop)</h3>
<p class="p1">To bridge isolated reading with word-of-mouth discovery, the application introduces an organic sharing loop activated on text selections. Instead of requiring users to manage unformatted plain text clipboard copies, selecting specific verses instantly launches an overlay module that transforms textual nodes into beautifully formatted graphic cards. By processing this entirely on the client side without forcing account registration or authentication, user privacy remains perfectly protected while removing sign-up friction entirely.</p>

<div class="combo-asset-card"> 
  <div class="combo-tabs"> 
    <button class="combo-tab active" data-target="tab-card-light">Classic Variant</button> 
    <button class="combo-tab" data-target="tab-card-dark">Contrast Variant</button> 
  </div> 

  <div class="combo-content active" data-id="tab-card-light">
    <img src="assets/cases/en/testamentus/3-2 3.png" alt="Classic Light Theme Verse Card Generation Preview" class="case-img-fluid">
    <div class="combo-divider"></div>
    <p class="combo-observation">Observation: Converting text nodes into high-fidelity image cards transforms plain text quotes into shareable visual media items, driving natural product discoverability.</p>
  </div>

  <div class="combo-content" data-id="tab-card-dark">
   <img src="assets/cases/en/testamentus/5 1.png" alt="Dark High-Contrast Interface Mode" class="case-img-fluid">
    <div class="combo-divider"></div>
    <p class="combo-observation">Observation: Packaging fluid light and dark visual states respects user ambient environments while making sure typography details maintain clean presentation bounds wherever shared.</p>
  </div>
</div>
    `, `<p class="p1">O Testamentus foi projetado e desenvolvido individualmente para reinventar completamente a interação digital moderna com textos históricos, priorizando extrema disciplina tipográfica. Opções tradicionais de leitura digital são fortemente comprometidas por redes de anúncios, layouts irregulares e viewports rígidas que criam atrito visual imediato e fadiga cognitiva severa.</p>

<h3>Ergonomia Tipográfica</h3>
<p class="p1">A interface principal remove o ruído do layout da web padrão para entregar uma coluna de leitura limpa e livre de distrações. Programada em torno das mecânicas de rastreamento e fixação ocular, os limites espaciais restringem comprimentos máximos de linha, parâmetros de dimensionamento de caracteres e definições de kerning. Essa restrição elimina a fadiga de subvocalização e a perda de rastreamento, otimizando a velocidade de leitura a longo prazo.</p>

<div class="combo-asset-card"> 
  <img src="assets/cases/pt/testamentus/3-2 2.png" alt="Layout Interface Minimalista Testamentus" class="case-img-rounded-full"> 
  <div class="combo-divider"></div> 
  <p class="combo-observation">Observação: Aplicar um espaço em branco generoso e intencional ao redor das colunas blinda o texto de decorações laterais, permitindo que os leitores mantenham o foco durante sessões profundas.</p> 
</div>

<h3>Personalização sem Atrito</h3>
<p class="p1">Para atender a um amplo espectro de necessidades de leitura sem quebrar a imersão narrativa, um painel de configuração elegante e não intrusivo pode ser acionado instantaneamente. Os leitores mantêm controle absoluto sobre a mecânica do layout, ajustando escala, ritmo, alinhamento e espaçamento das letras dinamicamente, sem recarregar a página e sem perder a posição do scroll.</p>

<div class="combo-asset-card"> 
  <img src="assets/cases/testamentus/5 2.png" alt="Controle de Personalização Dinâmica de Tipografia" class="case-img-rounded-full"> 
  <div class="combo-divider"></div> 
  <p class="combo-observation">Observação: Ajustes diretos mutam instantaneamente os parâmetros do texto, atualizando a legibilidade sem forçar recarregamentos totais da página.</p> 
</div>

<h3>Compartilhamento Dinâmico (Ciclo de Crescimento com Privacidade)</h3>
<p class="p1">Para unir a leitura isolada à  descoberta boca a boca, o aplicativo introduz um loop de compartilhamento orgânico ativado nas seleções de texto. Em vez de exigir que os usuários gerenciem cópias de texto não formatadas na área de transferência, ao selecionar versículos, um overlay instantâneo transforma nós textuais em cartões gráficos esteticamente formatados no próprio client-side. Assim, a privacidade do usuário permanece protegida, removendo completamente o atrito de inscrições e cadastros.</p>

<div class="combo-asset-card"> 
  <div class="combo-tabs"> 
    <button class="combo-tab active" data-target="tab-card-light">Variante Clássica</button> 
    <button class="combo-tab" data-target="tab-card-dark">Variante Contraste</button> 
  </div> 

  <div class="combo-content active" data-id="tab-card-light">
    <img src="assets/cases/testamentus/3-2 3.png" alt="Preview da Geração de Cartão em Tema Claro" class="case-img-fluid">
    <div class="combo-divider"></div>
    <p class="combo-observation">Observação: Converter nós de texto em cartões de alta fidelidade transforma citações planas em mídia compartilhável, impulsionando a descoberta natural do produto.</p>
  </div>

  <div class="combo-content" data-id="tab-card-dark">
   <img src="assets/cases/testamentus/5 1.png" alt="Modo Escuro de Alto Contraste" class="case-img-fluid">
    <div class="combo-divider"></div>
    <p class="combo-observation">Observação: Oferecer estados visuais claros e escuros respeita os ambientes do usuário enquanto garante que os detalhes tipográficos mantenham limites limpos onde quer que sejam compartilhados.</p>
  </div>
</div>
    `),
    descRecruiter: i18n(`
    <p class="p1">This full-stack typographic delivery engine was solo-engineered to completely bypass traditional relational database lookup bottlenecks at scale. By shifting heavy relational text content queries entirely to a background pre-compilation build stage, the architecture generates immutable, flat file structures that load instantly with near-zero RAM overhead, bypassing runtime server processing completely.</p>

<div class="combo-asset-card"> 
  <div class="live-mermaid-container" data-a11y-title="Pre-Render Static Compilation Flow">
  flowchart LR
Row_1 --> Row_2

subgraph Row_1 [Offline Build Loop]
    direction TB
    MySQL[(MySQL Core Database)] --> Script[PHP Compiler Engine] --> Buffer[Memory Buffer Scope]
end

subgraph Row_2 [Edge Delivery Pipeline]
    direction TB
    DiskIO[Directory System Writer] --> FlatHTML[Compiled Flat HTML Directory Tree] --> Viewport[Client Reading Viewport]
end
  </div>
  <div class="combo-divider"></div> 
  <p class="combo-observation">Observation: Moving relational lookup operations to an offline build loop flattens hierarchical structural inputs into decentralized static paths, allowing the server to absorb heavy traffic spikes with 0ms database latency.</p> 
  <div class="combo-divider"></div> 
  <pre><code class="language-php">// Pre-compilation loop organizing raw relational records directly into clean directory structures
$dirReader = $dirChapterList . "$chapter/";
if (!is_dir($dirReader)) {
    mkdir($dirReader, 0777, true);
}
// Outputs structural text payloads straight to disk as atomic entrypoints
file_put_contents($dirReader . "index.html", $htmlReader);</code></pre> 
</div>

<h3>State Control & Storage Hydration</h3>
<p class="p1">Typographic preferences execute entirely via non-blocking operational pathways, utilizing browser storage trees to persist selections across reading sessions. Rather than relying on remote network lookups or server-side session tracking, configuration objects hydrate state directly into the DOM tree during initial parsing loops, guaranteeing an instantaneous rendering sequence.</p>

<div class="combo-asset-card"> 
  <div class="telemetry-visual"> 
    <div class="storage-card">
      <div class="storage-card-title">âš¡ Client Local Storage Hydration Interface</div>
      <div class="storage-card-bar-bg">
        <div class="storage-card-bar-fill"></div>
      </div>
    </div>
    <div class="telemetry-overlay mt-12"> 
      <span class="telemetry-pill" data-metric="load"><span class="pulse-dot"></span> Hydration Latency: 0ms</span> 
      <span class="telemetry-pill" data-metric="memory"><span class="pulse-dot bg-blue"></span> Execution Context: Isolated Client Loop</span> 
    </div> 
  </div> 
  <div class="combo-divider"></div> 
  <p class="combo-observation">Observation: Initializing system parameters from client-side configurations skips remote handshakes, maintaining smooth presentation transformations between viewports.</p> 
  <div class="combo-divider"></div> 
  <pre><code class="language-javascript">// Synchronous state retrieval and typography property hydration logic from overlayreader.js
function loadSettings() {
  const savedSettings = JSON.parse(localStorage.getItem('textSettings'));
  if (savedSettings) return savedSettings;
  // Fail-safe engineering defaults preserving typographic discipline
  return { fontSize: 22, lineHeight: 1.5, letterSpacing: 0, fontFamily: 'Times New Roman' };
}</code></pre> 
</div>

<h3>Layout Reflow Containment (60fps Rendering Guard)</h3>
<p class="p1">To completely eliminate browser stuttering or visual flickering when adjusting text parameters, configuration values scale cleanly via target element mutations. By scoping dynamic adjustments strictly to individual text container CSS variables rather than triggering global document invalidations, runtime style modifications bypass heavy layout recalculations, securing an un-throttled 60fps frame rate even on lower-end mobile chipsets.</p>

<div class="combo-asset-card"> 
  <div class="telemetry-visual"> 
    <div class="telemetry-code-block">
      <span class="telemetry-title">[Typographic Variable Mappings - Scoped Mutations]</span>
      #font-increase &nbsp; → layoutController.apply() → selector: '--reader-font-size' += 2px<br/>
      #line-increase → layoutController.apply() → selector: '--reader-line-height' += 0.1<br/>
      #reset-btn &nbsp; &nbsp; → layoutController.purge() &nbsp; → state: clear localStorage textSettings
    </div>
    <div class="telemetry-overlay"> 
      <span class="telemetry-pill">Status: Style Thread Reflow Guard active</span> 
    </div> 
  </div> 
  <div class="combo-divider"></div> 
  <p class="combo-observation">Observation: Confining dynamic font properties to scoped structural elements eliminates expensive layout invalidation cycles, preventing full-page element repaints.</p> 
</div>

<h3>Asynchronous Canvas Graphics Pipeline</h3>
<p class="p1">The social export subsystem converts dynamic text nodes on the fly into high-density rasterized graphics using an HTML5 2D canvas layer. The architecture manages word wrapping boundaries, multi-line paragraph offsets, padding boundaries, and themes internally on the main thread, outputting highly compressed binary image blocks directly to the browser viewport. This design pattern completely unloads image compilation tasks from your infrastructure.</p>

<div class="combo-asset-card"> 
  <div class="live-mermaid-container" data-a11y-title="Canvas Rendering Pipeline Sequence">
  sequenceDiagram
      autonumber
      participant App as User Gesture Interface
      participant Engine as Canvas Graphic Compiler
      participant Canvas as 2D Context Surface
      participant Target as Native System Share

      App->>Engine: Select Verse Node (Trigger Selection Overlay)
      Note over Engine: Extracts verse string parameters & textual payload
      Engine->>Canvas: Instantiate workspace layer & apply theme parameters
      Canvas->>Canvas: Calculate multi-line string bounds & stitch layout
      Canvas-->>Engine: Output rasterized data matrix
      Engine->>Target: Resolve binary PNG Blob & call Web Share API
      Note over Target: Launches native OS file distribution layer
  </div>
  <div class="combo-divider"></div> 
  <p class="combo-observation">Observation: Rendering textual assets inside client contexts unloads graphic compute tasks from your infrastructure, ensuring graphic creation remains instant, highly scalable, and private.</p> 
  <div class="combo-divider"></div> 
  <pre><code class="language-javascript">// Asynchronous canvas rendering and compressed image block production pipeline from sharing-overlay.js
canvas.toBlob(function(blob) {
  generatedImageBlob = blob;
  generatedImageUrl = URL.createObjectURL(blob);
  resolve({ blob: generatedImageBlob, url: generatedImageUrl });
}, 'image/png');</code></pre> 
</div>

<h3>Defensive Data Governance & Security Controls</h3>
<p class="p1">To guard the flat-file directory infrastructure from path-traversal mechanics or injection vectors, all query parameters pass through strict validation blocks at the application boundary. By validating array keys and running input sequences through explicit string matching configurations, the application neutralizes malicious script insertion attempts before any template construction happens. Furthermore, compiling content to static structures completely removes dynamic runtime SQL injection vectors from the production attack surface.</p>

<div class="combo-asset-card">
  <pre><code class="language-php">// Type-safe argument isolation and input sanitization checking loops from reader.php
$book = isset($_GET['book']) ? preg_replace("/[^a-zA-Z0-9s-_]/", "", $_GET['book']) : '';
$chapter = isset($_GET['chapter']) ? (int)$_GET['chapter'] : 1;

// Strict whitelist testing against pre-compiled schema lists to isolate directory execution paths
if (!in_array($book, $validBooksArray)) {
    header("HTTP/1.1 404 Not Found");
    exit("Invalid Book Boundary Request.");
}</code></pre>
  <div class="combo-divider"></div>
  <p class="combo-observation">Observation: Filtering inbound parameters via strict scalar type coercion and regular expression filters prevents malicious path manipulation or local directory traversal injections.</p>
</div>`, `
    <p class="p1">Este motor de entrega tipográfica full-stack foi desenvolvido para contornar gargalos tradicionais de banco de dados relacional em escala. Movendo pesadas queries para um estágio de compilação em background, a arquitetura gera arquivos estáticos imutáveis que carregam instantaneamente, dispensando o processamento do servidor em tempo de execução.</p>

<div class="combo-asset-card"> 
  <div class="live-mermaid-container" data-a11y-title="Fluxo de Compilação Estática">
  flowchart LR
Row_1 --> Row_2

subgraph Row_1 [Loop de Compilação Offline]
    direction TB
    MySQL[(Banco de Dados Central)] --> Script[Motor Compilador PHP] --> Buffer[Escopo do Buffer de Memória]
end

subgraph Row_2 [Pipeline de Entrega de Borda]
    direction TB
    DiskIO[Escritor do Sistema de Diretório] --> FlatHTML[Árvore Compilada de Arquivos HTML Estáticos] --> Viewport[Viewport de Leitura do Cliente]
end
  </div>
  <div class="combo-divider"></div> 
  <p class="combo-observation">Observação: Mover operações relacionais para um loop offline nivela entradas hierárquicas em caminhos estáticos, permitindo que o servidor absorva picos pesados com 0ms de latência.</p> 
  <div class="combo-divider"></div> 
  <pre><code class="language-php">// Loop de compilação organizando registros brutos diretamente em estruturas de diretório
$dirReader = $dirChapterList . "$chapter/";
if (!is_dir($dirReader)) {
    mkdir($dirReader, 0777, true);
}
// Gera os dados para o disco como pontos de entrada
file_put_contents($dirReader . "index.html", $htmlReader);</code></pre> 
</div>

<h3>Controle de Estado e Hidratação</h3>
<p class="p1">As preferências tipográficas são executadas através de caminhos operacionais não-bloqueantes, utilizando o armazenamento do navegador para persistir seleções. Em vez de depender de consultas de rede, objetos de configuração hidratam o estado diretamente na árvore DOM durante a análise inicial, garantindo uma renderização instantânea.</p>

<div class="combo-asset-card"> 
  <div class="telemetry-visual"> 
    <div class="storage-card">
      <div class="storage-card-title">âš¡ Interface de Hidratação Local (Client Storage)</div>
      <div class="storage-card-bar-bg">
        <div class="storage-card-bar-fill"></div>
      </div>
    </div>
    <div class="telemetry-overlay mt-12"> 
      <span class="telemetry-pill" data-metric="load"><span class="pulse-dot"></span> Latência de Hidratação: 0ms</span> 
      <span class="telemetry-pill" data-metric="memory"><span class="pulse-dot bg-blue"></span> Contexto de Execução: Loop Isolado</span> 
    </div> 
  </div> 
  <div class="combo-divider"></div> 
  <p class="combo-observation">Observação: Inicializar os parâmetros do sistema a partir de configurações client-side evita os 'handshakes' remotos, mantendo transições suaves de estilo.</p> 
  <div class="combo-divider"></div> 
  <pre><code class="language-javascript">// Recuperação síncrona do estado e hidratação da tipografia via overlayreader.js
function loadSettings() {
  const savedSettings = JSON.parse(localStorage.getItem('textSettings'));
  if (savedSettings) return savedSettings;
  // Padrões tolerantes a falhas preservando a disciplina
  return { fontSize: 22, lineHeight: 1.5, letterSpacing: 0, fontFamily: 'Times New Roman' };
}</code></pre> 
</div>

<h3>Contenção de Reflow e Garantia de 60fps</h3>
<p class="p1">Para eliminar instabilidades ou cintilações no navegador, os valores dimensionam via mutações de elementos alvo. Escopando ajustes dinâmicos apenas para variáveis CSS de contêineres e evitando reflows custosos do DOM inteiro, modificações de estilo em tempo real funcionam em fluidos 60 quadros por segundo, mesmo em hardwares mais antigos.</p>

<div class="combo-asset-card"> 
  <div class="telemetry-visual"> 
    <div class="telemetry-code-block">
      <span class="telemetry-title">[Mapeamento - Mutações no Escopo]</span>
      #font-increase &nbsp; → layoutController.apply() → selector: '--reader-font-size' += 2px<br/>
      #line-increase → layoutController.apply() → selector: '--reader-line-height' += 0.1<br/>
      #reset-btn &nbsp; &nbsp; → layoutController.purge() &nbsp; → state: limpar textSettings
    </div>
    <div class="telemetry-overlay"> 
      <span class="telemetry-pill">Status: Contenção Ativa de Thread</span> 
    </div> 
  </div> 
  <div class="combo-divider"></div> 
  <p class="combo-observation">Observação: Restringir a manipulação no DOM previne repinturas pesadas, o que poderia inviabilizar o processamento em mobile.</p> 
</div>

<h3>Pipeline Gráfico de Canvas Assíncrono</h3>
<p class="p1">O subsistema de exportação social converte texto em gráficos 2D em tempo real. A arquitetura gerencia quebra de linhas, preenchimentos e temas internamente na thread principal, gerando diretamente blobs de imagens comprimidas sem depender da infraestrutura em nuvem, garantindo um sistema nativo instantâneo e livre de custos.</p>

<div class="combo-asset-card"> 
  <div class="live-mermaid-container" data-a11y-title="Sequência de Pipeline Gráfico no Canvas">
  sequenceDiagram
      autonumber
      participant App as Interface Gestual
      participant Engine as Compilador Gráfico
      participant Canvas as Contexto de Tela 2D
      participant Target as Interface Nativa de Sistema

      App->>Engine: Seleciona Versículo (Aciona Sobreposição)
      Note over Engine: Extrai dados textuais e parâmetros
      Engine->>Canvas: Instancia o Canvas e aplica Tema
      Canvas->>Canvas: Calcula cordenadas e renderiza as strings multi-linhas
      Canvas-->>Engine: Retorna dados na matriz Rasterizada
      Engine->>Target: Resolve o Blob PNG e invoca a API Web Share nativa
  </div>
  <div class="combo-divider"></div> 
  <p class="combo-observation">Observação: Descarregar funções gráficas da nuvem reduz latências e custos com servidores, mantendo as criações rápidas e escaláveis.</p> 
  <div class="combo-divider"></div> 
  <pre><code class="language-javascript">// Renderização no Canvas e conversão de bloco de imagem no sharing-overlay.js
canvas.toBlob(function(blob) {
  generatedImageBlob = blob;
  generatedImageUrl = URL.createObjectURL(blob);
  resolve({ blob: generatedImageBlob, url: generatedImageUrl });
}, 'image/png');</code></pre> 
</div>

<h3>Controles de Governança e Segurança</h3>
<p class="p1">Para resguardar a infraestrutura de diretório de arquivos planos de ataques de travessia e vetores de injeção, todos os dados consultados passam por bloqueios rigorosos. Com restrições severas sobre padrões RegExp e filtragens condicionais, injeções maliciosas não processam templates, garantindo também blindagem total contra manipulação SQL por conta de serem arquivos totalmente estáticos.</p>

<div class="combo-asset-card">
  <pre><code class="language-php">// Verificação forte contra coerção escalar para segurança estática do reader.php
$book = isset($_GET['book']) ? preg_replace("/[^a-zA-Z0-9s-_]/", "", $_GET['book']) : '';
$chapter = isset($_GET['chapter']) ? (int)$_GET['chapter'] : 1;

// Validação implacável contra manipulação de caminhos via Whitelists pré-compiladas
if (!in_array($book, $validBooksArray)) {
    header("HTTP/1.1 404 Not Found");
    exit("Invalid Book Boundary Request.");
}</code></pre>
  <div class="combo-divider"></div>
  <p class="combo-observation">Observação: Limpar os dados antes de servirem de índice para alvos de roteamento barra a criação de injeções de diretório via web root.</p>
</div>`),
    credits: ["Lio Schimanko"],
    videoSrc: i18n("assets/videos/en/en-testamentus.mp4", "assets/videos/pt/pt-testamentus.mp4"),
    vttSrc: i18n("assets/subtitles/en/en-testamentus.vtt", "assets/subtitles/pt/pt-testamentus.vtt"),
    frameSrc: "assets/frames/holofante.avif",
    thumbSrc: "assets/thumbs/en/testamentus.avif",
    deviceClass: "iphone-17",
    customGap: "0px"
};

const cassiwatch = {
  logoUrl: "assets/logos/cassi.jpeg",
  id: "cassiwatch",
  slug: "ux-on-wrist",
  year: "2023 ∙ CASSI",
    audioSrc: i18n("assets/audio/en/cassiwatch/audio-cassiwatch-summary.mp3", "assets/audio/pt/cassiwatch/pt-audio-cassiwatch-summary.mp3"),
    employer: "CASSI",
    readTime: i18n("3 min", "3 min"),
    title: i18n("UX on Wrist ", "UX no Pulso"),
    shortDesc: i18n("Translating healthcare metrics to Apple Watch constraints.", "Traduzindo métricas de saúde para as restrições do Apple Watch."),
    aiSummary: i18n("An experimental port of CASSI's mobile app to watchOS. Focused purely on emergency data and authorization glances, relying on native Apple Wallet integrations to maintain glanceability under 3 seconds.", "Uma versão experimental do aplicativo da CASSI para o watchOS. Focado estritamente em visualizações rápidas de autorizações e carteira médica, integrando-se via Apple Wallet nativo para tempos de consulta menores que 3 segundos."),
    keyIndicators: [
      { value: i18n("2 Core", "2 Core"), label: i18n("Features focused on retention", "Recursos focados em retenção") },
      { value: i18n("1 Gesture", "1 Gesto"), label: i18n("Emergency access via Apple Wallet", "Acesso emergencial via Apple Wallet") },
      { value: "< 3s", label: i18n("Time to comprehension", "Tempo de compreensão cognitiva") },
      { value: "100%", label: i18n("Compliance with Apple HIG", "Conformidade com a Apple HIG") }
    ],
    desc: i18n(`
<p class="p1">
<strong>Note on experimental nature:</strong> This is an experimental design and proof of concept. It was not implemented in production, thus it has no measured real-world impact. The project demonstrates the application of Apple Human Interface Guidelines for watchOS 10 in a healthcare context.
</p>

<h3>Design Challenge</h3>

<p class="p1">
Based on projects developed at CASSI, identify which mobile features would add maximum value in a wearable context. Constraints: 40-45mm screen, interactions <5s, glanceability.
</p>

<p class="p1">
<strong>Core Problem:</strong> How to adapt critical health plan features (authorization view, emergency card) for a wearable interface with sub-5 second interactions?
</p>

<p class="p1">
<strong>Platform Constraints:</strong><br>
- Limited screen: 324×394px or 368×448px<br>
- Brief interactions: users consult on the go<br>
- Critical info hierarchy: max 3-5 data points per screen<br>
- Apple HIG watchOS 9 compliance
</p>

<p class="p1"><strong>Project Members:</strong> Lio Schimanko, Illa Penha, Felipe Pires & Luís Aragão</p>

<div class="case-asset-wrapper">
   <div class="case-asset-box is-image">
      <img src="assets/cases/en/watch/2.avif" alt="Medical authorization visualization">
   </div>
   <p class="case-caption">Medical authorization visualization — critical information prioritized for <3s glanceability.</p>
</div>

<h3>Research & Design Decisions</h3>

<p class="p1">
<strong>Methods Used:</strong><br>
- Analysis of previous CASSI projects<br>
- Identification of most-accessed mobile features (internal analytics)<br>
- User flow mapping for wearables<br>
- Study of Apple watchOS 10 Human Interface Guidelines
</p>

<p class="p1">
<strong>Design & Prototyping:</strong> Figma, Apple watchOS UI Kit, SF Compact Typography<br>
<strong>Ecosystem & Compliance:</strong> Apple HIG, Apple Wallet integration (PassKit)<br>
<strong>Product Strategy:</strong> Mobile-to-Wearable translation
</p>

<p class="p1">
<strong>Critical Decision #1: Which Features to Port?</strong>
</p>

<p class="p1">
<strong>Tradeoff Chosen:</strong> 2 core features (authorizations + emergency card)<br>
<strong>Reason:</strong> Analysis showed authorizations (monitoring expenses) and emergency cards are the most critical use cases. Authorizations = passive daily use; card = active emergency use.<br>
<strong>Impact:</strong> Aligned with Apple's philosophy of radical simplicity.
</p>

<p class="p1">
<strong>Critical Decision #2: Information Hierarchy in Authorizations</strong>
</p>

<p class="p1">
<strong>Tradeoff Chosen:</strong> Spaced list with radical visual hierarchy<br>
<strong>Reason:</strong> Users consult while walking or waiting. Prioritized 3 critical data points: (1) Procedure type, (2) Value, (3) Recent date.<br>
<strong>Impact:</strong> <3s glanceability.
</p>

<div class="case-asset-wrapper">
   <div class="case-asset-box is-image">
      <img src="assets/cases/en/watch/1.avif" alt="Emergency card in Apple Wallet">
   </div>
   <p class="case-caption">Emergency card — Apple Wallet integration for instant sharing via AirDrop/Messages.</p>
</div>

<p class="p1">
<strong>Critical Decision #3: Card Access — Native App vs. Apple Wallet</strong>
</p>

<p class="p1">
<strong>Tradeoff Chosen:</strong> Dual — in-app card + "Add to Wallet" button<br>
<strong>Reason:</strong> Emergency use requires maximum speed. Apple Wallet allows access in 1 gesture (double-click side button), even when locked.<br>
<strong>Impact:</strong> Velocity > Branding in emergency healthcare situations.
</p>

<h3>Design Solution</h3>

<p class="p1">
<strong>Information Architecture:</strong><br>
1. <strong>Authorization List:</strong> Spaced cards with type/value/date<br>
2. <strong>Authorization Details:</strong> Provider name, address, ANS code<br>
3. <strong>Card:</strong> QR code + essential data<br>
4. <strong>Apple Wallet Pass:</strong> Instant double-click access
</p>

<h3>Design Learnings</h3>

<p class="p1">
<strong>1. Less is more in wearables:</strong> Porting only 2 features followed HIG philosophy. Every additional screen is exponential friction.
</p>

<p class="p1">
<strong>2. Visual hierarchy saves glanceability:</strong> SF Compact Display Bold for values allowed <3s comprehension.
</p>

<p class="p1">
<strong>3. Native integration > customization:</strong> Apple Wallet sacrificed branding but gained life-saving speed.
</p>

<p class="p1">
<strong>Key learning on healthcare wearable design:</strong> Critical info in stress/motion context must be <strong>glanceable</strong> and <strong>actionable</strong>. This requires sacrificing density for radical simplicity.
</p>
        `, `
<p class="p1">
<strong>Nota sobre contexto experimental:</strong> Este é um design experimental de prova de conceito. Não foi implementado em produção, não possuindo impactos reais. O projeto demonstra a aplicação pura da Human Interface Guidelines da Apple voltadas à saúde.
</p>

<h3>Desafio de Design</h3>

<p class="p1">
Baseado em projetos móveis da CASSI, o objetivo foi extrair o máximo de valor para interfaces de pulso. Restrições: Tela de 40 a 45 mm e uso rápido de no máximo 5 segundos.
</p>

<p class="p1">
<strong>Problema Principal:</strong> Como adaptar visões complexas do plano (visualizações de autorização, carteirinha médica de emergência) em telas de wearable com um teto de interação micro-curto?
</p>

<p class="p1">
<strong>Restrições da Plataforma:</strong><br>
- Tela minúscula: 324×394px ou 368×448px<br>
- Interações Breves: Usuários agem caminhando.<br>
- Hierarquia Crítica: no máximo 3-5 dados no display.<br>
- Padrões Apple HIG para watchOS.
</p>

<p class="p1"><strong>Membros do Projeto:</strong> Lio Schimanko, Illa Penha, Felipe Pires & Luís Aragão</p>

<div class="case-asset-wrapper">
   <div class="case-asset-box is-image">
      <img src="assets/cases/watch/2.avif" alt="Medical authorization visualization">
   </div>
   <p class="case-caption">Tela de visualizações com cartões para rastreio direto e fácil da autorização médica.</p>
</div>

<h3>Pesquisa e Decisões</h3>

<p class="p1">
<strong>Métodos de Estudo:</strong><br>
- Investigação em projetos móveis da CASSI<br>
- Determinação de necessidades críticas por análise de logs internos.<br>
- Design Flow para uso diário em caminhadas.<br>
- Estudo estrito e técnico do watchOS 10 Guidelines da Apple.
</p>

<p class="p1">
<strong>Estrutura de Design & Prototipagem:</strong> UI Kits da Apple em Figma e Arquitetura Compact Typography (SF Compact).<br>
<strong>Compliance:</strong> Mapeamentos de integração PassKit na Apple Wallet nativa.
</p>

<p class="p1">
<strong>Decisão nº 1: Filtro Restritivo de Adaptação</strong>
</p>

<p class="p1">
<strong>Tradeoff Escolhido:</strong> Omitir dezenas de funcionalidades e concentrar-se em autorizações + socorro.<br>
<strong>Causa:</strong> Analisar e focar nos elementos ativos vs passivos, deixando as atividades profundas ou longas nos canais para navegadores e smartphones principais.
</p>

<p class="p1">
<strong>Decisão nº 2: Carga de Retenção</strong>
</p>

<p class="p1">
<strong>Tradeoff Escolhido:</strong> Visualização de matriz simples com radical ordenação visual.<br>
<strong>Causa:</strong> Separar e isolar as 3 frentes de urgência (1) Natureza (2) Valor e (3) Datas, para dar suporte cognitivo ágil.<br>
</p>

<div class="case-asset-wrapper">
   <div class="case-asset-box is-image">
      <img src="assets/cases/watch/1.avif" alt="Emergency card in Apple Wallet">
   </div>
   <p class="case-caption">Módulo do QR Code — acesso limpo integrando-se via PassKit do Apple Wallet nativo.</p>
</div>

<p class="p1">
<strong>Decisão nº 3: Interface no Aplicativo VS Aplicação Nativa</strong>
</p>

<p class="p1">
<strong>Tradeoff Escolhido:</strong> Integração dupla — Acesso restrito a um duplo-clique nativo Apple.<br>
<strong>Causa:</strong> A emergência demanda velocidade insana, sem telas de carregamento do app. Pressionar o pino em 1 toque na tranca poupa muito atrito no estresse da hora.<br>
<strong>Impacto:</strong> A Velocidade importa mais do que uma tela bem desenhada na marca CASSI sob circunstâncias adversas de dor.
</p>

<h3>Soluções Estruturais e Aprendizados</h3>

<p class="p1">
<strong>Arquitetura da Informação:</strong><br>
1. <strong>Lista Principal de Solicitações:</strong> Dados de alta visibilidade e data.<br>
2. <strong>Detalhes Completos:</strong> Provedor, Hospital e código final regulamentar ANS.<br>
3. <strong>Card Pessoal:</strong> Códigos de QR de urgência do dependente.<br>
4. <strong>PassKit:</strong> O suporte emergencial completo sem destravar o aparelho de relógio.
</p>

<h3>Resumo de Design (Insights)</h3>

<p class="p1">
<strong>1. Menos é infinitamente mais na usabilidade Wearable:</strong> Mapear tudo para 2 micro funcionalidades respeitou a diretriz Apple HIG e eliminou telas inúteis de complexidade pesada.
</p>

<p class="p1">
<strong>2. Retenção Hierárquica salva vidas cognitivamente falando:</strong> Escalas precisas nas fontes (SF Compact BOLD) reduziram as perdas e erros do utilizador.
</p>

<p class="p1">
<strong>3. Padrões Nativos sobrepujam as customizações de vaidade da marca:</strong> Colar-se ao Apple Wallet nativo entregou muito mais poder do usuário sob crise de saúde do que mantê-lo bloqueado em uma interface esteticamente controlada pela CASSI.
</p>

<p class="p1">
<strong>Aprendizados reais de UI em Healthcare wearable:</strong> Dados urgentes importam, simplicidade domina a dor do momento, sacrificando-se o resto.
</p>
        `),
    credits: ["Lio Schimanko", "Illa Penha", "Felipe Pires", "Luís Aragão"],
    videoSrc: i18n("assets/videos/en/en-cassiwatch.mp4", "assets/videos/pt/pt-cassiwatch.mp4"),
    vttSrc: i18n("assets/subtitles/en/en-cassiwatch.vtt", "assets/subtitles/pt/pt-cassiwatch.vtt"),
    thumbSrc: "assets/thumbs/en/cassiwatch.avif",
    deviceClass: "apple-watch",
    customGap: "0px"
};

const cassi = {
  logoUrl: "assets/logos/cassi.jpeg",
  id: "cassi",
  slug: "us400k-redesign",
  year: i18n("2022 ∙ CASSI", "2022 ∙ CASSI"),
    audioSrc: i18n("assets/audio/en/cassi/audio-cassi-summary.mp3", "assets/audio/pt/cassi/pt-audio-cassi-summary.mp3"),
    password: "123",
    employer: "CASSI",
    readTime: i18n("2 min", "2 min"),
    title: i18n("US$400k Redesign", "Redesign de US$400k"),
    shortDesc: i18n("Mobile redesign saving $400k in mismanaged medical expenses.", "Redesign móvel economizando $400k em despesas médicas indevidas."),
    aiSummary: i18n("By transforming a dense 20-item regulatory list into an intuitive card hierarchy, this redesign allowed 229,000 families to easily spot and dispute incorrect healthcare charges natively within the app.", "Ao transformar uma densa lista de 20 itens regulatórios em uma hierarquia de cards intuitiva, esse redesign permitiu que 229.000 famílias identificassem e contestassem facilmente cobranças incorretas de saúde nativamente dentro do aplicativo."),
    keyIndicators: [
      { value: "USD 400,000", label: i18n("Annual savings in avoided expenses", "Economia anual em despesas evitadas") },
      { value: "13,000", label: i18n("Proactively disputed authorizations", "Autorizações contestadas proativamente") },
      { value: "15s", label: i18n("Search time reduced from 3min", "Tempo de busca reduzido de 3 minutos") },
      { value: "30,000", label: i18n("Unrecognized procedures caught", "Procedimentos não reconhecidos bloqueados") }
    ],
    desc: i18n(`
        <p class="p1"> 
<strong>NDA Note:</strong> This project is protected by compliance and non-disclosure agreements. This case presents a sanitized overview focusing on methods and public results from the 2022 Annual Report. 
</p> 

<p class="p1">
<strong>Once upon a time,</strong> the CASSI health insurance app served 229,000 mobile users. The company faced a huge systemic problem: medical providers were submitting incorrect or fake procedures, creating massive unexpected expenses for patients and the institution.
</p>

<p class="p1">
<strong>Every day,</strong> these wrong charges went completely unnoticed. The old app crammed over 20 mandatory regulatory items into a single dense list with zero visual order. Finding a specific doctor visit took up to three minutes. To make things worse, parents had to log out completely and log back in under a different username just to see their children's medical bills.
</p>

<p class="p1">
<strong>One day,</strong> we set out to build an intuitive multi-platform system to empower users to spot and dispute these wrong charges instantly.
</p>

<p class="p1">
<strong>Because of this,</strong> we negotiated with regulatory focal points and discovered that while displaying all 20+ items was mandatory, their layout order was flexible. We broke the dense list down into clear, collapsible groups like Consultations, Exams, and Therapies, highlighting vital data at the very top.
</p>


<div class="combo-asset-card"> 
<div class="before-after-slider"> 
<img src="assets/thumbs/consulta.avif" class="img-after" alt="New Design"> 
<img src="assets/thumbs/holofante.avif" class="img-before" alt="Old Design"> 
<div class="slider-handle"></div> 
</div> 
<div class="combo-divider"></div> 
<p class="combo-observation">Observation: Shifting from a dense tabular list to a categorical hierarchy reduced visual noise by 40%.</p> 
</div> 


<p class="p1">
<strong>Because of that,</strong> we re-engineered the account architecture to remove family friction. We introduced a quick side-swipe gesture that lets users securely toggle between policyholder and dependent views in a single shared session. We also launched direct phone alerts that notify users the moment a bill is registered, letting them tap an "I don't recognize this" button while their memory is still fresh.
</p>

<div class="combo-asset-card"> 
<img src="assets/cases/en/consulta/6.avif" alt="Dependent Switch Motion" class="case-img-rounded-full"> 
<div class="combo-divider"></div> 
<p class="combo-observation">Observation: Side swipe gesture switches the family data context in 1 second without a painful logout-login loop.</p> 
</div>

<p class="p1">
<strong>Until finally,</strong> the time it took to find a specific procedure fell from three minutes to just 15 seconds, causing search abandonment rates to drop by 47%. Users successfully flagged thousands of unrecognized charges directly through the app.
</p>

<p class="p1">
<strong>And ever since then,</strong> user dispute data flows directly into an automated quality matrix for healthcare providers. Incorrect charges now count negatively against clinics and hospitals in their annual evaluations, keeping providers honest and protecting institutional finances.
</p>

<div class="combo-asset-card"> 
<img src="assets/cases/en/consulta/7.avif" alt="Results" class="case-img-rounded-full"> 
<div class="combo-divider"></div> 
<p class="combo-observation">Translation & Business Outcome: 13,000 disputed items and 30,000 unrecognized procedures saved R$ 2.5 million (USD 400,000) in avoided healthcare expenses in 2022.</p> 
</div>
        `, `
        <p class="p1"> 
<strong>Nota de Privacidade:</strong> Este projeto é protegido por acordos de confidencialidade (NDA). Este caso apresenta um resumo sanitizado focado em metodologias e resultados públicos de 2022. 
</p> 

<p class="p1">
<strong>Era uma vez,</strong> o aplicativo da CASSI que atendia a cerca de 229.000 perfis familiares em uso ativo. Contudo, o plano sofria com o descontrole: grandes centros e provedores médicos lançavam autorizações incorretas para exames duplicados que nunca aconteceram no mundo físico. Essa sangria criava perdas avassaladoras anuais de capital do plano.
</p>

<p class="p1">
<strong>Todos os dias,</strong> por anos, essas cargas ilegais e faturas fantasmas permaneciam sem revisão do beneficiário final, por um motivo trágico de UI e Experiência. O modelo em layout antigo forçava +20 chaves de metadados listadas e enlatadas em campos longos e ilegíveis que exauriam cognitivamente os usuários. Encontrar consultas específicas consumia três minutos estressantes.
A pior parte era que um pai deveria sempre se desconectar do app central para depois ter que logar a sessão isoladamente na credencial do filho menor para avaliar as perdas, aumentando as chances de nunca ser verificado.
</p>

<p class="p1">
<strong>Um dia,</strong> começamos o mapeamento para sanar de forma contundente e intuitiva os vazamentos.
</p>

<p class="p1">
<strong>Por conta disso,</strong> fizemos mesas de conciliação de regras de negócios entre áreas de Tecnologia, Jurídico e Compliance Regulatório ANS. Confirmamos que embora a Agência (ANS) exija legalmente os 20 dados, ela não restringe a ordem ou agrupamento visual de como o cliente os consome no Mobile. Separamos e explodimos o modelo de lista contínua em pastas (Cartões Retráteis), categorizadas (Consulta, Exame e Terapia), iluminando o valor monetário como pivô de reconhecimento na tela e permitindo leitura limpa sob navegação acelerada e progressiva do usuário.
</p>


<div class="combo-asset-card"> 
<div class="before-after-slider"> 
<img src="assets/thumbs/consulta.avif" class="img-after" alt="Novo Design Hierarquizado"> 
<img src="assets/thumbs/holofante.avif" class="img-before" alt="Antigo Layout Tabular"> 
<div class="slider-handle"></div> 
</div> 
<div class="combo-divider"></div> 
<p class="combo-observation">Observação: Evoluir da estrutura relacional plana de tabelas pesadas de texto diminuiu a sobrecarga na visão de busca orgânica manual em mais de 40%.</p> 
</div> 


<p class="p1">
<strong>Ainda por causa disso,</strong> redesenhamos o login arquitetural das credenciais seguras de toda a família. Implantamos gestos de deslizamento lateral simples. Este novo fluxo transfere temporariamente a sessão para a visão de faturas do filho sem nunca quebrar o login primário ou comprometer a API Backend central. Por cima dessa correção fundamental, acoplamos disparo Push transacional no exato instante em que hospitais passavam os exames no faturamento, garantindo que membros de confiança clicassem nativamente no botão (Não Reconheço Isso!) e recusassem de imediato fraudes nos extratos enquanto o dia e momento da ida ao médico estavam ativos mentalmente no paciente.
</p>

<div class="combo-asset-card"> 
<img src="assets/cases/consulta/6.avif" alt="Deslize de Dependente" class="case-img-rounded-full"> 
<div class="combo-divider"></div> 
<p class="combo-observation">Observação: O componente em carrossel de dependente troca os extratos de visualização e perfil familiar em 1 único segundo, neutralizando para sempre a dor dos infinitos loops passados de login e logouts estressantes nas filas médicas.</p> 
</div>

<p class="p1">
<strong>Até que finalmente,</strong> com as modificações estruturais o teto temporal de buscas manuais dos próprios pacientes por itens nas telas regrediu maravilhosamente dos absurdos três minutos para simples e efetivos 15 segundos. Isso derrubou a taxa de desistência nos cliques por irritação na pesquisa geral em margens vertiginosas de -47%. 
Nossos pais de família finalmente encontraram rapidamente registros e puderam estornar e cancelar por iniciativa de seus celulares uma contagem colossal e volumétrica de cobranças errôneas na ponta digital do aplicativo.
</p>

<p class="p1">
<strong>E desde então,</strong> essa massa bruta de dados oriunda de milhões de bloqueios das próprias mãos dos cidadãos do aplicativo, irriga hoje a espinha dorsal corporativa das Matrizes Inteligentes de Qualidade dos provedores médicos da Sede da CASSI. As faturas fantasmas erradas agora descontam pontuações no repasse anual de reajuste financeiro dos hospitais em escopo nacional, o que garante e sela definitivamente a proteção dos cofres institucionais contra provedores duvidosos em favor exclusivo do beneficiário.
</p>

<div class="combo-asset-card"> 
<img src="assets/cases/consulta/7.avif" alt="Resultado Final do Processo" class="case-img-rounded-full"> 
<div class="combo-divider"></div> 
<p class="combo-observation">Fechamento do Impacto Operacional & Negócios: A soma de 13 mil cliques ativados de Disputa Proativa do Usuário com a interceptação e interrupção das métricas em +30.000 Procedimentos Fantasmas Não Reconhecidos pouparam diretamente cerca de R$ 2.5 milhões de Reais puros na instituição por cobranças em 2022.</p> 
</div>
        `),
    credits: ["Lio Schimanko", "Illa Penha", "Felipe Pires", "Luís Aragão"],
    videoSrc: i18n("assets/videos/en/en-consulta.mp4", "assets/videos/pt/pt-consulta.mp4"),
    vttSrc: i18n("assets/subtitles/en/en-consulta.vtt", "assets/subtitles/pt/pt-consulta.vtt"),
    thumbSrc: "assets/thumbs/en/consulta.avif",
    deviceClass: "iphone-12"
};

// Now we export an array of the correctly defined constants.
export const portfolioCases = [
  holofante,
  testamentus,
  cassiwatch,
  cassi
];