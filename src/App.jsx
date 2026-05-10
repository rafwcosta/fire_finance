import { useState, useEffect, useCallback } from 'react'

// ─── Utilitários ──────────────────────────────────────────────────────────────
const fmt = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

const parseBRL = (s) =>
  parseFloat(String(s).replace(/[R$\s.]/g, '').replace(',', '.')) || 0

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho', 'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

// ─── Dados iniciais ───────────────────────────────────────────────────────────
const INITIAL = {
  lancamentos: {
    fixo:          [{ nome:'Internet', valor:30 },{ nome:'Academia', valor:149.9 },
                    { nome:'Cabelo', valor:30 },{ nome:'Seguro', valor:81.94 },
                    { nome:'Gasolina', valor:0 },{ nome:'Spotify', valor:12.9 },
                    { nome:'Streaming', valor:0 },{ nome:'Conta de luz', valor:95 }],
    credito:       [{ nome:'Fatura', valor:1113.57 },{ nome:'Internet', valor:-30 },
                    { nome:'Academia', valor:-149.9 },{ nome:'Streaming', valor:0 },
                    { nome:'Seguro', valor:0 },{ nome:'Gasolina', valor:0 },
                    { nome:'Spotify', valor:-12.9 }],
    pix:           [{ nome:'Gas. Carro', valor:14 },{ nome:'99', valor:4.8 },{ nome:'99', valor:8.91 }],
    debito:        [{ nome:'Coca', valor:12.5 },{ nome:'Ifood', valor:22.89 },
                    { nome:'Não sei', valor:11.5 },{ nome:'Almoço', valor:17 }],
    boleto:        [],
    valeAlim:      [],
  },
  pagarReceber: {
    pagar:   [],
    receber: [{ nome:'Su', valor:558, motivo:'Vale alimentação', status:'Pendente' }],
  },
  investimentos: [
    { tipo:'Reserva de emergência', valor:500, status:'Pendente' },
    { tipo:'Revisão da moto', valor:85, status:'Pendente' },
  ],
  projecoes: {
    receitas: [
      { nome:'Salário líquido', valor:1768.79 },
      { nome:'Vale transporte', valor:180 },
      { nome:'Vale alimentação', valor:558 },
      { nome:'Motorista de aplicativo', valor:0 },
    ],
  },
  resumo: {
    historico: [
      { mes:'Janeiro', valor:2255.02 },{ mes:'Fevereiro', valor:2435.74 },
      { mes:'Março', valor:2765.10 },{ mes:'Abril', valor:2395.68 },
      { mes:'Maio', valor:2440.15 },
    ],
    atual: {
      mes:'Junho', limite:2400, totalGastos:1997.11, disponivel:402.89,
      saldoReserva:250, fechamento:'04/06/2026', vencimento:'11/06/2026',
      dataPagamento:'05/06/2026', status:'Em aberto',
    },
  },
}

// ─── Hook localStorage ────────────────────────────────────────────────────────
function useLocalStorage(key, init) {
  const [val, setVal] = useState(() => {
    try {
      const saved = localStorage.getItem(key)
      return saved ? JSON.parse(saved) : init
    } catch { return init }
  })
  const set = useCallback((v) => {
    setVal(v)
    try { localStorage.setItem(key, JSON.stringify(v)) } catch {}
  }, [key])
  return [val, set]
}

// ─── Ícones SVG ───────────────────────────────────────────────────────────────
const Ico = {
  Home:   () => <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>,
  List:   () => <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/></svg>,
  Heart:  () => <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>,
  Pay:    () => <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg>,
  Invest: () => <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/></svg>,
  Chart:  () => <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg>,
  Plus:   () => <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>,
  Trash:  () => <svg viewBox="0 0 24 24" fill="currentColor" width="17" height="17"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>,
  Edit:   () => <svg viewBox="0 0 24 24" fill="currentColor" width="17" height="17"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>,
  Save:   () => <svg viewBox="0 0 24 24" fill="currentColor" width="17" height="17"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>,
  Close:  () => <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>,
  Download: () => <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>,
  Upload: () => <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/></svg>,
}

// ─── Estilos globais ──────────────────────────────────────────────────────────
const G = {
  card:  { background:'#1a1f2e', borderRadius:16, border:'1px solid #252b3b', padding:'18px 20px', marginBottom:14 },
  input: { width:'100%', background:'#0f1420', border:'1px solid #2a3048', borderRadius:10, color:'#fff', padding:'11px 14px', fontSize:15, outline:'none', boxSizing:'border-box', fontFamily:'inherit' },
  label: { color:'#8892a4', fontSize:12, display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:1 },
  btn:   (bg) => ({ width:'100%', background:bg, border:'none', borderRadius:12,
                    color:'#fff', padding:'14px', fontSize:15, fontWeight:700, cursor:'pointer' }),
}

// ─── Componentes base ─────────────────────────────────────────────────────────
function Field({ label, value, onChange, type='text', placeholder }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={G.label}>{label}</label>
      <input type={type} value={value} onChange={onChange}
        placeholder={placeholder} style={G.input} />
    </div>
  )
}

function Select({ label, value, onChange, options }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={G.label}>{label}</label>
      <select value={value} onChange={onChange}
        style={{ ...G.input, appearance:'none' }}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

function Sheet({ title, onClose, children }) {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,0.75)',
                  display:'flex', alignItems:'flex-end', justifyContent:'center' }}
                  onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background:'#1a1f2e', borderRadius:'20px 20px 0 0',
                    width:'100%', maxWidth:430, padding:'24px 20px 40px',
                    animation:'slideUp .25s ease', maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <span style={{ color:'#fff', fontSize:18, fontWeight:700 }}>{title}</span>
          <button onClick={onClose} style={{ background:'#252b3b', border:'none',
            borderRadius:8, color:'#aaa', padding:'6px 12px', cursor:'pointer', display:'flex' }}>
            <Ico.Close />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function FAB({ color, onClick }) {
  return (
    <button onClick={onClick} style={{
      position:'fixed', bottom:90, right:'calc(50% - 200px)',
      background:color, border:'none', borderRadius:'50%',
      width:54, height:54, display:'flex', alignItems:'center', justifyContent:'center',
      cursor:'pointer', boxShadow:`0 4px 20px ${color}70`, color:'#fff', zIndex:50
    }}><Ico.Plus /></button>
  )
}

function Tag({ children, color }) {
  return (
    <span style={{ background:color+'22', color, borderRadius:99, padding:'2px 10px', fontSize:11, fontWeight:700 }}>
      {children}
    </span>
  )
}

// ─── Tela Resumo ──────────────────────────────────────────────────────────────
function TelaResumo({ data, setData }) {
  const { atual, historico } = data.resumo
  const totalRec = data.projecoes.receitas.reduce((s,r) => s+r.valor, 0)
  const pct = Math.min((atual.totalGastos / atual.limite) * 100, 100)
  const barColor = pct>90 ? '#ef4444' : pct>70 ? '#f59e0b' : '#10b981'
  const [editResumo, setEditResumo] = useState(false)
  const [form, setForm] = useState({ ...atual })

  const salvar = () => {
    const u = { ...data }
    u.resumo.atual = { ...form, limite:parseBRL(String(form.limite)),
      totalGastos:parseBRL(String(form.totalGastos)),
      disponivel:parseBRL(String(form.disponivel)),
      saldoReserva:parseBRL(String(form.saldoReserva)) }
    setData(u); setEditResumo(false)
  }

  return (
    <div style={{ padding:'0 16px 16px' }}>
      {/* Saldo principal */}
      <div style={{ background:'linear-gradient(135deg,#0f3460,#16213e)', borderRadius:20,
                    padding:'28px 24px', marginBottom:16, border:'1px solid #1e3a5f', position:'relative' }}>
        <div style={{ position:'absolute', top:-20, right:-20, width:100, height:100,
                      borderRadius:'50%', background:'rgba(16,185,129,.07)' }} />
        <p style={{ color:'#8892a4', fontSize:11, textTransform:'uppercase', letterSpacing:2, margin:'0 0 6px' }}>
          Saldo disponível · {atual.mes}
        </p>
        <p style={{ color:'#10b981', fontSize:38, fontWeight:700, margin:'0 0 4px' }}>{fmt(atual.disponivel)}</p>
        <p style={{ color: atual.status==='Em aberto' ? '#f59e0b' : '#10b981', fontSize:13, margin:0 }}>
          {atual.status}
        </p>
        <div style={{ marginTop:20, display:'flex', gap:20 }}>
          {[['Receitas',totalRec,'#10b981'],['Gastos',atual.totalGastos,'#f59e0b'],['Reserva',atual.saldoReserva,'#60a5fa']].map(([l,v,c]) => (
            <div key={l}><p style={{ color:'#6b7280', fontSize:10, margin:'0 0 2px', textTransform:'uppercase' }}>{l}</p>
              <p style={{ color:c, fontSize:15, fontWeight:700, margin:0 }}>{fmt(v)}</p></div>
          ))}
        </div>
        <button onClick={() => { setForm({ ...atual }); setEditResumo(true) }}
          style={{ position:'absolute', top:16, right:16, background:'rgba(255,255,255,.08)', border:'none', borderRadius:8, color:'#aaa', padding:8, cursor:'pointer', display:'flex' }}>
          <Ico.Edit />
        </button>
      </div>

      {/* Barra limite */}
      <div style={G.card}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
          <span style={{ color:'#cdd5e0', fontSize:14, fontWeight:600 }}>Limite do mês</span>
          <span style={{ color:'#8892a4', fontSize:13 }}>{fmt(atual.totalGastos)} / {fmt(atual.limite)}</span>
        </div>
        <div style={{ background:'#0f1420', borderRadius:99, height:8 }}>
          <div style={{ width:`${pct}%`, height:'100%', borderRadius:99, background:barColor, transition:'width .5s' }} />
        </div>
        <p style={{ color:'#6b7280', fontSize:12, margin:'6px 0 0' }}>{(100-pct).toFixed(0)}% do limite disponível</p>
      </div>

      {/* Datas */}
      <div style={G.card}>
        <p style={{ color:'#cdd5e0', fontSize:14, fontWeight:600, margin:'0 0 12px' }}>📅 Pagamento</p>
        {[['Fechamento',atual.fechamento],['Vencimento',atual.vencimento],['Data do pagamento',atual.dataPagamento]].map(([l,v]) => (
          <div key={l} style={{ display:'flex', justifyContent:'space-between', marginBottom:7 }}>
            <span style={{ color:'#8892a4', fontSize:13 }}>{l}</span>
            <span style={{ color:'#60a5fa', fontSize:13, fontWeight:600 }}>{v}</span>
          </div>
        ))}
      </div>

      {/* Histórico */}
      <div style={G.card}>
        <p style={{ color:'#cdd5e0', fontSize:14, fontWeight:600, margin:'0 0 14px' }}>📊 Histórico</p>
        {historico.map(h => {
          const w = Math.min((h.valor/3200)*100,100)
          return (
            <div key={h.mes} style={{ marginBottom:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                <span style={{ color:'#8892a4', fontSize:12 }}>{h.mes}</span>
                <span style={{ color:'#cdd5e0', fontSize:12, fontWeight:600 }}>{fmt(h.valor)}</span>
              </div>
              <div style={{ background:'#0f1420', borderRadius:99, height:5 }}>
                <div style={{ width:`${w}%`, height:'100%', borderRadius:99, background:'#3b82f6' }} />
              </div>
            </div>
          )
        })}
      </div>

      {editResumo && (
        <Sheet title="Editar resumo" onClose={() => setEditResumo(false)}>
          {[['mes','Mês atual'],['limite','Limite (R$)'],['totalGastos','Total gastos (R$)'],
            ['disponivel','Disponível (R$)'],['saldoReserva','Saldo reserva (R$)'],
            ['fechamento','Fechamento'],['vencimento','Vencimento'],
            ['dataPagamento','Data pagamento']].map(([k,l]) => (
            <Field key={k} label={l} value={form[k]}
              onChange={e => setForm({ ...form, [k]:e.target.value })} />
          ))}
          <Select label="Status" value={form.status}
            onChange={e => setForm({ ...form, status:e.target.value })}
            options={['Em aberto','Pago','Parcial']} />
          <button onClick={salvar} style={G.btn('#3b82f6')}>Salvar</button>
        </Sheet>
      )}
    </div>
  )
}

// ─── Tela Lançamentos ─────────────────────────────────────────────────────────
const CATS = [
  { key:'fixo',    label:'Fixo',       color:'#10b981', emoji:'🔒' },
  { key:'credito', label:'Crédito',    color:'#f59e0b', emoji:'💳' },
  { key:'pix',     label:'Pix',        color:'#8b5cf6', emoji:'📱' },
  { key:'debito',  label:'Débito',     color:'#ef4444', emoji:'🏧' },
  { key:'boleto',  label:'Boleto',     color:'#6b7280', emoji:'📄' },
  { key:'valeAlim',label:'Vale Alim.', color:'#f97316', emoji:'🍽️' },
]

function TelaLancamentos({ data, setData }) {
  const [cat, setCat] = useState('fixo')
  const [modal, setModal] = useState(null) // null | 'add' | index(edit)
  const [form, setForm] = useState({ nome:'', valor:'' })

  const catInfo = CATS.find(c => c.key === cat)
  const itens = data.lancamentos[cat] || []
  const total = itens.reduce((s,i) => s+i.valor, 0)

  const abrirAdd = () => { setForm({ nome:'', valor:'' }); setModal('add') }
  const abrirEdit = (i) => { setForm({ nome:itens[i].nome, valor:String(itens[i].valor) }); setModal(i) }

  const salvar = () => {
    if (!form.nome) return
    const u = { ...data }
    const novo = { nome:form.nome, valor:parseBRL(form.valor) }
    if (modal === 'add') u.lancamentos[cat] = [...itens, novo]
    else { const arr = [...itens]; arr[modal] = novo; u.lancamentos[cat] = arr }
    setData(u); setModal(null)
  }

  const remover = (i) => {
    const u = { ...data }
    u.lancamentos[cat] = itens.filter((_,idx) => idx!==i)
    setData(u)
  }

  return (
    <div style={{ padding:'0 16px 16px' }}>
      {/* Tabs categorias */}
      <div style={{ display:'flex', gap:8, overflowX:'auto', marginBottom:18, paddingBottom:2 }}>
        {CATS.map(c => (
          <button key={c.key} onClick={() => setCat(c.key)} style={{
            background: cat===c.key ? c.color : '#1a1f2e',
            border:`1px solid ${cat===c.key ? c.color : '#252b3b'}`,
            borderRadius:99, color: cat===c.key ? '#fff' : '#8892a4',
            padding:'7px 14px', fontSize:12, fontWeight:600,
            whiteSpace:'nowrap', cursor:'pointer', flexShrink:0
          }}>{c.emoji} {c.label}</button>
        ))}
      </div>

      {/* Total */}
      <div style={{ ...G.card, background:`linear-gradient(135deg,${catInfo.color}15,#1a1f2e)`,
                    border:`1px solid ${catInfo.color}35` }}>
        <p style={{ color:'#8892a4', fontSize:11, textTransform:'uppercase', margin:'0 0 4px' }}>
          Total {catInfo.label}
        </p>
        <p style={{ color:catInfo.color, fontSize:30, fontWeight:700, margin:0 }}>{fmt(total)}</p>
      </div>

      {/* Lista */}
      {itens.length === 0
        ? <p style={{ color:'#4b5563', textAlign:'center', padding:'36px 0' }}>Nenhum lançamento</p>
        : itens.map((item,i) => (
          <div key={i} style={{ ...G.card, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, flex:1 }}>
              <div style={{ width:8, height:8, borderRadius:'50%',
                background: item.valor<0 ? '#ef4444' : catInfo.color, flexShrink:0 }} />
              <span style={{ color:'#cdd5e0', fontSize:14 }}>{item.nome}</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ color: item.valor<0?'#ef4444': item.valor===0?'#4b5563':catInfo.color, fontSize:14, fontWeight:700 }}>{fmt(item.valor)}</span>
              <button onClick={() => abrirEdit(i)}
                style={{ background:'none', border:'none', cursor:'pointer', color:'#8892a4', padding:4, display:'flex' }}>
                <Ico.Edit />
              </button>
              <button onClick={() => remover(i)}
                style={{ background:'none', border:'none', cursor:'pointer', color:'#4b5563', padding:4, display:'flex' }}>
                <Ico.Trash />
              </button>
            </div>
          </div>
        ))
      }

      <FAB color={catInfo.color} onClick={abrirAdd} />

      {modal !== null && (
        <Sheet title={modal==='add' ? `Adicionar em ${catInfo.label}` : 'Editar lançamento'} onClose={() => setModal(null)}>
          <Field label="Nome" value={form.nome} onChange={e => setForm({ ...form, nome:e.target.value })} placeholder="Ex: Mercado" />
          <Field label="Valor (use - para desconto)" value={form.valor}
            onChange={e => setForm({ ...form, valor:e.target.value })} placeholder="0,00" />
          <button onClick={salvar} style={G.btn(catInfo.color)}>
            {modal==='add' ? 'Adicionar' : 'Salvar'}
          </button>
        </Sheet>
      )}
    </div>
  )
}

// ─── Tela Saúde Financeira ────────────────────────────────────────────────────
function TelaSaude({ data }) {
  const totalRec = data.projecoes.receitas.reduce((s,r) => s+r.valor, 0)
  const fixo = data.lancamentos.fixo.reduce((s,i) => s+i.valor, 0)
  const variavel = ['pix','debito','valeAlim'].reduce(
    (s,k) => s + data.lancamentos[k].reduce((ss,i) => ss+i.valor, 0), 0
  )
  const gasto = data.resumo.atual.totalGastos
  const poupanca = totalRec - gasto

  const cats30 = [
    { label:'Gastos Fixos', perc:30, real:fixo, color:'#ef4444', desc:'Contas, assinaturas, seguros' },
    { label:'Gastos Variáveis', perc:40, real:variavel, color:'#f59e0b', desc:'Lazer, alimentação, transporte' },
    { label:'Poupança', perc:30, real:Math.max(poupanca,0), color:'#10b981', desc:'Investimentos e reserva' },
  ]

  return (
    <div style={{ padding:'0 16px 16px' }}>
      <div style={G.card}>
        <p style={{ color:'#8892a4', fontSize:11, textTransform:'uppercase', margin:'0 0 6px' }}>Renda total (projeção)</p>
        <p style={{ color:'#10b981', fontSize:32, fontWeight:700, margin:0 }}>{fmt(totalRec)}</p>
        <p style={{ color:'#6b7280', fontSize:12, margin:'4px 0 0' }}>Baseado na regra 30 / 40 / 30</p>
      </div>

      {cats30.map(c => {
        const ideal = (totalRec * c.perc) / 100
        const pct = Math.min((c.real / ideal) * 100, 150)
        const ok = c.real <= ideal
        return (
          <div key={c.label} style={{ ...G.card, border:`1px solid ${ok ? '#252b3b' : c.color+'40'}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
              <div>
                <p style={{ color:'#cdd5e0', fontSize:14, fontWeight:700, margin:'0 0 2px' }}>{c.label}</p>
                <p style={{ color:'#6b7280', fontSize:11, margin:0 }}>{c.desc}</p>
              </div>
              <Tag color={ok ? '#10b981' : '#ef4444'}>{ok ? '✓ OK' : '⚠ Alto'}</Tag>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
              <span style={{ color:'#8892a4', fontSize:12 }}>Ideal: {fmt(ideal)} ({c.perc}%)</span>
              <span style={{ color:c.color, fontSize:12, fontWeight:700 }}>Real: {fmt(c.real)}</span>
            </div>
            <div style={{ background:'#0f1420', borderRadius:99, height:7 }}>
              <div style={{ width:`${Math.min(pct,100)}%`, height:'100%', borderRadius:99,
                            background: ok ? c.color : '#ef4444' }} />
            </div>
            <p style={{ color:'#6b7280', fontSize:11, margin:'6px 0 0' }}>
              Projeção reserva anual: {fmt(ideal * 12)}
            </p>
          </div>
        )
      })}
    </div>
  )
}

// ─── Tela Pagar & Receber ─────────────────────────────────────────────────────
function TelaPagarReceber({ data, setData }) {
  const [aba, setAba] = useState('receber')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ nome:'', valor:'', motivo:'', status:'Pendente' })
  const statusColor = s => s==='Pago'||s==='Recebido' ? '#10b981' : s==='Pendente' ? '#f59e0b' : '#ef4444'
  const cor = aba==='pagar' ? '#ef4444' : '#10b981'
  const lista = data.pagarReceber[aba] || []
  const total = lista.reduce((s,i) => s+i.valor, 0)

  const abrirAdd = () => { setForm({ nome:'', valor:'', motivo:'', status:'Pendente' }); setModal('add') }
  const abrirEdit = (i) => { setForm({ ...lista[i], valor:String(lista[i].valor) }); setModal(i) }

  const salvar = () => {
    if (!form.nome) return
    const u = { ...data }
    const novo = { ...form, valor:parseBRL(form.valor) }
    if (modal==='add') u.pagarReceber[aba] = [...lista, novo]
    else { const arr=[...lista]; arr[modal]=novo; u.pagarReceber[aba]=arr }
    setData(u); setModal(null)
  }

  const remover = (i) => {
    const u = { ...data }
    u.pagarReceber[aba] = lista.filter((_,idx) => idx!==i)
    setData(u)
  }

  return (
    <div style={{ padding:'0 16px 16px' }}>
      <div style={{ display:'flex', gap:8, marginBottom:18 }}>
        {['pagar','receber'].map(a => (
          <button key={a} onClick={() => setAba(a)} style={{
            flex:1, background: aba===a ? (a==='pagar'?'#ef4444':'#10b981') : '#1a1f2e',
            border:'none', borderRadius:12, color: aba===a?'#fff':'#8892a4',
            padding:12, fontSize:14, fontWeight:700, cursor:'pointer'
          }}>{a==='pagar' ? '💸 A Pagar' : '💰 A Receber'}</button>
        ))}
      </div>

      <div style={{ ...G.card, border:`1px solid ${cor}35` }}>
        <p style={{ color:'#8892a4', fontSize:11, textTransform:'uppercase', margin:'0 0 4px' }}>Total</p>
        <p style={{ color:cor, fontSize:30, fontWeight:700, margin:0 }}>{fmt(total)}</p>
      </div>

      {lista.length===0
        ? <p style={{ color:'#4b5563', textAlign:'center', padding:'36px 0' }}>Nenhum item</p>
        : lista.map((item,i) => (
          <div key={i} style={G.card}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
              <span style={{ color:'#cdd5e0', fontSize:14, fontWeight:600 }}>{item.nome}</span>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={() => abrirEdit(i)} style={{ background:'none', border:'none', cursor:'pointer', color:'#8892a4', display:'flex' }}><Ico.Edit /></button>
                <button onClick={() => remover(i)} style={{ background:'none', border:'none', cursor:'pointer', color:'#4b5563', display:'flex' }}><Ico.Trash /></button>
              </div>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <p style={{ color:'#6b7280', fontSize:12, margin:'0 0 6px' }}>{item.motivo}</p>
                <Tag color={statusColor(item.status)}>{item.status}</Tag>
              </div>
              <span style={{ color:cor, fontSize:17, fontWeight:700 }}>{fmt(item.valor)}</span>
            </div>
          </div>
        ))
      }

      <FAB color={cor} onClick={abrirAdd} />

      {modal!==null && (
        <Sheet title={modal==='add' ? (aba==='pagar'?'A Pagar':'A Receber') : 'Editar'} onClose={() => setModal(null)}>
          <Field label="Nome" value={form.nome} onChange={e => setForm({ ...form, nome:e.target.value })} />
          <Field label="Valor (R$)" value={form.valor} onChange={e => setForm({ ...form, valor:e.target.value })} />
          <Field label="Motivo" value={form.motivo} onChange={e => setForm({ ...form, motivo:e.target.value })} />
          <Select label="Status" value={form.status}
            onChange={e => setForm({ ...form, status:e.target.value })}
            options={['Pendente', aba==='pagar'?'Pago':'Recebido', 'Cancelado']} />
          <button onClick={salvar} style={G.btn(cor)}>{modal==='add'?'Adicionar':'Salvar'}</button>
        </Sheet>
      )}
    </div>
  )
}

// ─── Tela Investimentos ───────────────────────────────────────────────────────
function TelaInvestimentos({ data, setData }) {
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ tipo:'', valor:'', status:'Pendente' })
  const lista = data.investimentos
  const total = lista.reduce((s,i) => s+i.valor, 0)
  const concluido = lista.filter(i => i.status==='Concluído').reduce((s,i) => s+i.valor, 0)

  const abrirAdd = () => { setForm({ tipo:'', valor:'', status:'Pendente' }); setModal('add') }
  const abrirEdit = (i) => { setForm({ ...lista[i], valor:String(lista[i].valor) }); setModal(i) }

  const salvar = () => {
    if (!form.tipo) return
    const novo = { ...form, valor:parseBRL(form.valor) }
    if (modal==='add') setData({ ...data, investimentos:[...lista, novo] })
    else { const arr=[...lista]; arr[modal]=novo; setData({ ...data, investimentos:arr }) }
    setModal(null)
  }

  const remover = (i) => setData({ ...data, investimentos:lista.filter((_,idx) => idx!==i) })

  return (
    <div style={{ padding:'0 16px 16px' }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:18 }}>
        {[['Total separado', total, '#818cf8'],['Concluído', concluido, '#10b981']].map(([l,v,c]) => (
          <div key={l} style={{ ...G.card, margin:0 }}>
            <p style={{ color:'#8892a4', fontSize:11, textTransform:'uppercase', margin:'0 0 4px' }}>{l}</p>
            <p style={{ color:c, fontSize:20, fontWeight:700, margin:0 }}>{fmt(v)}</p>
          </div>
        ))}
      </div>

      {lista.map((item,i) => (
        <div key={i} style={G.card}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div style={{ flex:1 }}>
              <p style={{ color:'#cdd5e0', fontSize:14, fontWeight:600, margin:'0 0 8px' }}>{item.tipo}</p>
              <Tag color={item.status==='Concluído'?'#10b981':'#f59e0b'}>{item.status}</Tag>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ color:'#818cf8', fontSize:17, fontWeight:700 }}>{fmt(item.valor)}</span>
              <button onClick={() => abrirEdit(i)} style={{ background:'none', border:'none', cursor:'pointer', color:'#8892a4', display:'flex' }}><Ico.Edit /></button>
              <button onClick={() => remover(i)} style={{ background:'none', border:'none', cursor:'pointer', color:'#4b5563', display:'flex' }}><Ico.Trash /></button>
            </div>
          </div>
        </div>
      ))}

      <FAB color="#8b5cf6" onClick={abrirAdd} />

      {modal!==null && (
        <Sheet title={modal==='add'?'Novo investimento':'Editar'} onClose={() => setModal(null)}>
          <Field label="Tipo" value={form.tipo} onChange={e => setForm({ ...form, tipo:e.target.value })} />
          <Field label="Valor (R$)" value={form.valor} onChange={e => setForm({ ...form, valor:e.target.value })} />
          <Select label="Status" value={form.status}
            onChange={e => setForm({ ...form, status:e.target.value })}
            options={['Pendente','Concluído']} />
          <button onClick={salvar} style={G.btn('#8b5cf6')}>{modal==='add'?'Adicionar':'Salvar'}</button>
        </Sheet>
      )}
    </div>
  )
}

// ─── Tela Projeções ───────────────────────────────────────────────────────────
function TelaProjecoes({ data, setData }) {
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ nome:'', valor:'' })
  const receitas = data.projecoes.receitas
  const totalRec = receitas.reduce((s,r) => s+r.valor, 0)
  const totalGasto = data.resumo.atual.totalGastos
  const saldo = totalRec - totalGasto

  const abrirAdd = () => { setForm({ nome:'', valor:'' }); setModal('add') }
  const abrirEdit = (i) => { setForm({ nome:receitas[i].nome, valor:String(receitas[i].valor) }); setModal(i) }

  const salvar = () => {
    if (!form.nome) return
    const u = { ...data }
    const novo = { nome:form.nome, valor:parseBRL(form.valor) }
    if (modal==='add') u.projecoes.receitas = [...receitas, novo]
    else { const arr=[...receitas]; arr[modal]=novo; u.projecoes.receitas=arr }
    setData(u); setModal(null)
  }

  const remover = (i) => {
    const u = { ...data }
    u.projecoes.receitas = receitas.filter((_,idx) => idx!==i)
    setData(u)
  }

  return (
    <div style={{ padding:'0 16px 16px' }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:18 }}>
        {[['Receitas',totalRec,'#10b981'],['Saídas',totalGasto,'#ef4444']].map(([l,v,c]) => (
          <div key={l} style={{ ...G.card, margin:0, border:`1px solid ${c}30` }}>
            <p style={{ color:'#8892a4', fontSize:11, textTransform:'uppercase', margin:'0 0 4px' }}>{l}</p>
            <p style={{ color:c, fontSize:20, fontWeight:700, margin:0 }}>{fmt(v)}</p>
          </div>
        ))}
      </div>
      <div style={{ ...G.card, border:`1px solid ${saldo>=0?'#10b98130':'#ef444430'}` }}>
        <p style={{ color:'#8892a4', fontSize:11, textTransform:'uppercase', margin:'0 0 4px' }}>Saldo (entradas - saídas)</p>
        <p style={{ color:saldo>=0?'#10b981':'#ef4444', fontSize:30, fontWeight:700, margin:0 }}>{fmt(saldo)}</p>
      </div>

      <p style={{ color:'#8892a4', fontSize:12, textTransform:'uppercase', letterSpacing:1, margin:'4px 0 12px' }}>Receitas</p>

      {receitas.map((r,i) => (
        <div key={i} style={{ ...G.card, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ color:'#cdd5e0', fontSize:14 }}>{r.nome}</span>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ color:r.valor===0?'#4b5563':'#10b981', fontSize:14, fontWeight:700 }}>{fmt(r.valor)}</span>
            <button onClick={() => abrirEdit(i)} style={{ background:'none', border:'none', cursor:'pointer', color:'#8892a4', display:'flex' }}><Ico.Edit /></button>
            <button onClick={() => remover(i)} style={{ background:'none', border:'none', cursor:'pointer', color:'#4b5563', display:'flex' }}><Ico.Trash /></button>
          </div>
        </div>
      ))}

      <div style={{ background:'#1c1500', borderRadius:12, padding:'12px 16px', border:'1px solid #f59e0b30', marginTop:4 }}>
        <p style={{ color:'#f59e0b', fontSize:12, margin:0, lineHeight:1.5 }}>
          ⚠️ Antes da data de pagamento, os valores são somente projeções.
        </p>
      </div>

      <FAB color="#10b981" onClick={abrirAdd} />

      {modal!==null && (
        <Sheet title={modal==='add'?'Nova receita':'Editar receita'} onClose={() => setModal(null)}>
          <Field label="Nome" value={form.nome} onChange={e => setForm({ ...form, nome:e.target.value })} />
          <Field label="Valor (R$)" value={form.valor} onChange={e => setForm({ ...form, valor:e.target.value })} />
          <button onClick={salvar} style={G.btn('#10b981')}>{modal==='add'?'Adicionar':'Salvar'}</button>
        </Sheet>
      )}
    </div>
  )
}

// ─── App Root ─────────────────────────────────────────────────────────────────
const TABS = [
  { id:'resumo',       label:'Resumo',   icon:Ico.Home   },
  { id:'lancamentos',  label:'Gastos',   icon:Ico.List   },
  { id:'saude',        label:'Saúde',    icon:Ico.Heart  },
  { id:'pagarReceber', label:'Contas',   icon:Ico.Pay    },
  { id:'investimentos',label:'Invest.',  icon:Ico.Invest },
  { id:'projecoes',    label:'Projeção', icon:Ico.Chart  },
]

export default function App() {
  const [tab, setTab] = useState('resumo')
  const [data, setData] = useLocalStorage('gestor_data', INITIAL)
  const [menuBackup, setMenuBackup] = useState(false)

  // Export JSON
  const exportar = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = 'gestor_backup.json'; a.click()
  }

  // Import JSON
  const importar = (e) => {
    const file = e.target.files[0]; if (!file) return
    const r = new FileReader()
    r.onload = ev => {
      try { setData(JSON.parse(ev.target.result)); setMenuBackup(false) } catch {}
    }
    r.readAsText(file)
  }

  // Reset
  const resetar = () => {
    if (window.confirm('Tem certeza? Isso apaga todos os dados salvos.')) {
      setData(INITIAL); setMenuBackup(false)
    }
  }

  const screens = {
    resumo:        <TelaResumo        data={data} setData={setData} />,
    lancamentos:   <TelaLancamentos   data={data} setData={setData} />,
    saude:         <TelaSaude         data={data} />,
    pagarReceber:  <TelaPagarReceber  data={data} setData={setData} />,
    investimentos: <TelaInvestimentos data={data} setData={setData} />,
    projecoes:     <TelaProjecoes     data={data} setData={setData} />,
  }

  return (
    <div style={{ background:'#0f1420', minHeight:'100vh', fontFamily:"'DM Sans',system-ui,sans-serif",
                  color:'#cdd5e0', position:'relative' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap');
        *{box-sizing:border-box}
        ::-webkit-scrollbar{display:none}
        @keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}
        input::placeholder,textarea::placeholder{color:#4b5563}
        select option{background:#1a1f2e}
        input[type=file]{display:none}
      `}</style>

      {/* Header */}
      <div style={{ padding:'48px 20px 14px', background:'linear-gradient(180deg,#0a0e1a,#0f1420)',
                    borderBottom:'1px solid #1a1f2e', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <p style={{ color:'#4b5563', fontSize:10, textTransform:'uppercase', letterSpacing:2, margin:'0 0 2px' }}>
              Gestor Financeiro
            </p>
            <h1 style={{ color:'#fff', fontSize:22, fontWeight:700, margin:0 }}>
              {TABS.find(t => t.id===tab)?.label}
            </h1>
          </div>
          <button onClick={() => setMenuBackup(true)}
            style={{ background:'#10b981', borderRadius:'50%', width:38, height:38, border:'none', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:15, cursor:'pointer' }}>
            R
          </button>
        </div>
      </div>

      {/* Conteúdo */}
      <div style={{ padding:'20px 0 96px', minHeight:'calc(100vh - 130px)', overflowY:'auto' }}>
        {screens[tab]}
      </div>

      {/* Nav inferior */}
      <nav style={{ position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
                    width:'100%', maxWidth:430, background:'#0a0e1a',
                    borderTop:'1px solid #1a1f2e', display:'flex', zIndex:100,
                    padding:'8px 0 20px' }}>
        {TABS.map(t => {
          const active = tab===t.id
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex:1, background:'none', border:'none', cursor:'pointer',
              display:'flex', flexDirection:'column', alignItems:'center', gap:4,
              color: active ? '#10b981' : '#4b5563', padding:'6px 0'
            }}>
              <t.icon />
              <span style={{ fontSize:9, fontWeight: active?700:400 }}>{t.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Menu backup */}
      {menuBackup && (
        <Sheet title="Dados & Backup" onClose={() => setMenuBackup(false)}>
          <p style={{ color:'#8892a4', fontSize:13, margin:'0 0 20px', lineHeight:1.6 }}>
            Seus dados ficam salvos automaticamente no navegador. Use o backup para não perder nada.
          </p>
          <button onClick={exportar} style={{ ...G.btn('#3b82f6'), display:'flex', alignItems:'center',
            justifyContent:'center', gap:8, marginBottom:12 }}>
            <Ico.Download /> Exportar backup (JSON)
          </button>
          <label htmlFor="importFile" style={{ ...G.btn('#8b5cf6'), display:'flex', alignItems:'center',
            justifyContent:'center', gap:8, marginBottom:12, borderRadius:12, cursor:'pointer' }}>
            <Ico.Upload /> Importar backup (JSON)
          </label>
          <input id="importFile" type="file" accept=".json" onChange={importar} />
          <button onClick={resetar} style={{ ...G.btn('#ef4444') }}>
            🗑️ Resetar dados
          </button>
        </Sheet>
      )}
    </div>
  )
}
