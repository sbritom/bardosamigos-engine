import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Clock3, FileText, Gift, PartyPopper, ScrollText, Sparkles, Star, Trophy } from 'lucide-react'
import { bingoBanner, rankingBanner } from '../../../assets/events/eventBanners'
import { Button, HeroCard } from '../../../design-system'
import { PortalWorkspace, WorkspaceEmptyState, WorkspaceSkeleton } from '../../../shared/workspace'
import { getEventRecurrenceLabel, getEventSummary, getEventTimeLabel, getEventType, getParticipationRule, listPublishedEvents } from '../services/eventsService'
import { EventCard } from './EventCard'
import { EventDetails } from './EventDetails'
import { EventHighlightBanner } from './EventHighlightBanner'
import './eventsPage.css'

const HERO_TEXT = 'Bingos, rankings, brincadeiras e momentos especiais do Bar dos Amigos.'

const RANKING_RULES = [
  'Apenas 1 conta por participante.',
  'Proibido utilizar scripts, bots ou qualquer tipo de automacao.',
  'Necessario estar ativo no xat.com/BarDosAmigos.',
  'As BarCoins sao pessoais e intransferiveis.',
  'Fraudes ou tentativa de manipulacao resultarao em desclassificacao.',
  'A decisao da equipe do Bar dos Amigos e soberana.',
]
const BINGO_RULES = [
  'Apenas 1 conta por participante.',
  'O vencedor devera responder dentro do tempo informado.',
  'Contas alternativas nao poderao receber premiacao.',
  'Em caso de fraude ou descumprimento das regras, o premio sera cancelado.',
]

const JULY_RANKING = {
  id: 'ranking-barcoins-2026-07', title: 'Ranking de BarCoins', slug: 'ranking-de-barcoins-julho-2026', status: 'ended', banner: rankingBanner, location: 'xat.com/BarDosAmigos',
  metadata: { type: 'Competicao', timeLabel: '23/07/2026 → 06/08/2026', summary: 'Primeira edicao do Ranking de BarCoins, encerrada apos 15 dias.' },
}
const BINGO_EVENT = {
  id: 'configured-bingo-do-bar-dos-amigos', title: 'Bingo do Bar dos Amigos', slug: 'bingo-do-bar-dos-amigos', status: 'published', banner: bingoBanner, location: 'xat.com/BarDosAmigos',
  metadata: { type: 'Bingo', timeLabel: 'Todos os dias às 20:30', summary: 'Bingo oficial do Bar dos Amigos com premiacoes variadas.' },
}
const HIGHLIGHT = {
  slug: 'bingo-do-bar-dos-amigos', eyebrow: 'Evento em destaque', title: 'Bingo do Bar dos Amigos', description: 'Participe do bingo diario e concorra a premiacoes variadas.', period: 'Todos os dias às 20:30', prizeLabel: 'Premiacoes variadas', prizes: ['Bingo diario', 'Premios variados'], actionLabel: 'Ver Regulamento',
}

const DETAILS = {
  'ranking-de-barcoins-julho-2026': { title: 'Ranking de BarCoins — Julho/Agosto 2026', banner: rankingBanner, status: 'ended', period: '23/07/2026 → 06/08/2026', prizes: ['1º 2.000 xats', '2º 1.500 xats', '3º 1.000 xats'], howToParticipate: 'Colete BarCoins participando das atividades do Bar dos Amigos durante o periodo do evento.', rules: RANKING_RULES, rankingTitle: 'Ranking Oficial', ranking: 'O Ranking de BarCoins foi contabilizado automaticamente pelo EVOX Bot.' },
  'bingo-do-bar-dos-amigos': { title: 'Bingo do Bar dos Amigos', banner: bingoBanner, status: 'active', period: 'Todos os dias às 20:30', prizes: 'Premiacoes variadas.', howToParticipate: 'Aguarde o inicio do bingo e siga as instrucoes da equipe.', rules: BINGO_RULES },
}

function key(value=''){return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')}
function isBingo(event={}){return key(`${event.slug||''} ${event.title||''} ${getEventType(event)||''}`).includes('bingo')}
function isRanking(event={}){return key(`${event.slug||''} ${event.title||''}`).includes('ranking')}
function statusOf(event={}){const s=String(event.status||'').toLowerCase();if(['archived','ended','finished','closed'].includes(s))return'ended';if(s==='draft')return'upcoming';return'active'}
function detailOf(event={}){const preset=DETAILS[event.slug]||{};const recurrence=getEventRecurrenceLabel(event);const time=getEventTimeLabel(event);return{id:event.id,slug:event.slug,title:preset.title||event.title||'Evento',description:getEventSummary(event)||event.description||null,banner:preset.banner||event.banner||event.metadata?.banner||null,status:preset.status||statusOf(event),period:preset.period||[recurrence,time].filter(Boolean).join(' - ')||'Periodo a definir',howToParticipate:preset.howToParticipate||getParticipationRule(event)||'Acompanhe as instrucoes da equipe.',prizes:preset.prizes||'Premiacao sera informada pela equipe.',rules:preset.rules||['Respeite as orientacoes da equipe.'],rankingTitle:preset.rankingTitle||null,ranking:preset.ranking||null,type:getEventType(event)}}

function CompactList({events,onSelect,emptyTitle}){if(!events.length)return <WorkspaceEmptyState title={emptyTitle}/>;return <div className="grid gap-[var(--bds-space-8)]">{events.map(event=>{const d=detailOf(event);return <button key={event.id||event.slug} type="button" onClick={()=>onSelect(event)} className="flex flex-wrap items-center justify-between gap-[var(--bds-space-10)] rounded-[var(--bds-radius-md)] border border-[var(--bds-color-border)] bg-[var(--bds-color-surface)] p-[var(--bds-space-12)] text-left"><span className="grid gap-1"><strong>{d.title}</strong><small>{d.period}</small></span><span className="bds-events-status bds-events-status--active">{d.status==='ended'?'Encerrado':d.status==='upcoming'?'Em breve':'Ativo'}</span></button>})}</div>}
function SingleCard({event,onOpen,empty}){return event?<EventCard event={event} onSelect={onOpen}/>:<WorkspaceEmptyState title={empty}/>}
function RankingPanel({event,onOpen}){if(!event)return <WorkspaceEmptyState title="Nenhum Ranking de BarCoins ativo no momento."/>;const d=detailOf(event);return <div className="grid gap-[var(--bds-space-14)]"><EventCard event={event} onSelect={onOpen}/><section className="bds-events-detail__section"><h3><Trophy size={18}/>Periodo</h3><div className="bds-events-detail__body"><p>{d.period}</p></div></section><section className="bds-events-detail__section"><h3><Gift size={18}/>Premiacao</h3><div className="bds-events-detail__body">{Array.isArray(d.prizes)?<ul>{d.prizes.map(x=><li key={x}>{x}</li>)}</ul>:<p>{d.prizes}</p>}</div></section></div>}
function Regulations({events}){return <div className="grid gap-[var(--bds-space-14)]">{events.map(event=>{const d=detailOf(event);return <section key={event.id||event.slug} className="bds-events-detail__section"><h3><ScrollText size={18}/>{d.title}</h3><div className="bds-events-detail__body"><p><strong>Periodo:</strong> {d.period}</p><p><strong>Como participar:</strong> {d.howToParticipate}</p>{Array.isArray(d.prizes)?<><strong>Premiacao</strong><ul>{d.prizes.map(x=><li key={x}>{x}</li>)}</ul></>:<p><strong>Premiacao:</strong> {d.prizes}</p>}<strong>Regras</strong><ul>{d.rules.map((rule,index)=><li key={rule}><strong>{index===0?'Importante: ':''}</strong>{rule}</li>)}</ul></div></section>})}</div>}

export default function EventsPage(){
  const [remote,setRemote]=useState([]);const [loading,setLoading]=useState(true);const [activeView,setActiveView]=useState('featured');const [selected,setSelected]=useState(null)
  useEffect(()=>{let active=true;(async()=>{setLoading(true);const result=await listPublishedEvents();if(active){setRemote(Array.isArray(result.data)?result.data:[]);setLoading(false)}})();return()=>{active=false}},[])
  const events=useMemo(()=>{const cleaned=remote.filter(e=>!isRanking(e)&&!isBingo(e));return[BINGO_EVENT,JULY_RANKING,...cleaned]},[remote])
  const bingo=events.find(e=>e.slug===BINGO_EVENT.slug);const activeRanking=events.find(e=>isRanking(e)&&statusOf(e)==='active')||null
  const activeEvents=events.filter(e=>statusOf(e)==='active');const upcoming=events.filter(e=>statusOf(e)==='upcoming');const ended=events.filter(e=>statusOf(e)==='ended');const selectedDetail=selected?detailOf(selected):null
  const open=e=>setSelected(e);const choose=item=>{setActiveView(item.id);setSelected(null)}
  const content=()=>{if(selectedDetail)return <EventDetails event={selectedDetail} onBack={()=>setSelected(null)}/>;if(loading)return <WorkspaceSkeleton rows={5}/>;if(activeView==='featured')return <EventHighlightBanner highlight={HIGHLIGHT} event={bingo} onOpen={open}/>;if(activeView==='ranking')return <RankingPanel event={activeRanking} onOpen={open}/>;if(activeView==='bingo')return <SingleCard event={bingo} onOpen={open} empty="Nenhum bingo ativo."/>;if(activeView==='active')return <CompactList events={activeEvents} onSelect={open} emptyTitle="Nenhum evento ativo."/>;if(activeView==='upcoming')return <CompactList events={upcoming} onSelect={open} emptyTitle="O proximo Ranking de BarCoins sera adicionado assim que as datas e premiacoes forem definidas."/>;if(activeView==='ended')return <CompactList events={ended} onSelect={open} emptyTitle="Nenhum evento encerrado."/>;return <Regulations events={[bingo,JULY_RANKING,...events.filter(e=>e!==bingo&&e!==JULY_RANKING)]}/>} 
  const items=[{id:'featured',icon:Star,name:'Destaques',badge:1},{id:'ranking',icon:Trophy,name:'Ranking BarCoins',status:activeRanking?'ATIVO':undefined},{id:'bingo',icon:PartyPopper,name:'Bingos',badge:bingo?1:undefined},{id:'active',icon:Sparkles,name:'Eventos Ativos',badge:activeEvents.length||undefined},{id:'upcoming',icon:Clock3,name:'Proximos Eventos',badge:upcoming.length||undefined},{id:'ended',icon:CheckCircle2,name:'Eventos Encerrados',badge:ended.length||undefined},{id:'rules',icon:FileText,name:'Regulamentos',badge:events.length||undefined}]
  const titles={featured:'Destaques',ranking:'Ranking BarCoins',bingo:'Bingos',active:'Eventos Ativos',upcoming:'Proximos Eventos',ended:'Eventos Encerrados',rules:'Regulamentos'}
  return <main className="bds-events-page"><HeroCard className="bds-events-hero" title="EVENTOS DO BAR" subtitle={HERO_TEXT}/><PortalWorkspace className="bds-portal-workspace--compact" sidebar={{title:'Eventos',items,selectedId:activeView,onSelect:choose}} content={{title:selectedDetail?selectedDetail.title:titles[activeView],description:selectedDetail?'Detalhes do evento selecionado.':''}}>{content()}</PortalWorkspace></main>
}
