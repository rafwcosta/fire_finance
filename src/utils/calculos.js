// ─── Formatação ───────────────────────────────────────────────────────────────

/**
 * Formata um número como moeda BRL (R$ 1.234,56)
 * @param {number} valor
 * @returns {string}
 */
export const fmt = (valor) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0)

/**
 * Formata um número como percentual (ex: 0.35 → "35,0%")
 * @param {number} valor - entre 0 e 1
 * @returns {string}
 */
export const fmtPct = (valor) =>
  new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 1 }).format(valor || 0)

/**
 * Converte string no formato BRL para número
 * Aceita: "1.234,56" | "R$ 1.234,56" | "-500"
 * @param {string} str
 * @returns {number}
 */
export const parseBRL = (str) =>
  parseFloat(String(str).replace(/[R$\s.]/g, '').replace(',', '.')) || 0

// ─── Totais por categoria ─────────────────────────────────────────────────────

/**
 * Soma todos os valores de uma lista (incluindo negativos/estornos)
 * @param {Array<{valor: number}>} itens
 * @returns {number}
 */
export const totalCategoria = (itens = []) =>
  itens.reduce((soma, item) => soma + item.valor, 0)

/**
 * Soma apenas os valores positivos de uma lista
 * (valores negativos são descontos/estornos e não entram no gasto real)
 * @param {Array<{valor: number}>} itens
 * @returns {number}
 */
export const totalPositivo = (itens = []) =>
  itens.filter((i) => i.valor > 0).reduce((soma, i) => soma + i.valor, 0)

// ─── Gastos totais ────────────────────────────────────────────────────────────

/**
 * Total de GASTOS FIXOS: fixo + crédito + boleto (apenas valores positivos)
 * Equivale a SOMA('Lançamentos'!A20:B20) da planilha
 * @param {Object} lancamentos
 * @returns {number}
 */
export const calcGastosFixos = ({ fixo = [], credito = [], boleto = [] } = {}) =>
  totalPositivo(fixo) + totalPositivo(credito) + totalPositivo(boleto)

/**
 * Total de GASTOS VARIÁVEIS: pix + débito + valeAlim (apenas valores positivos)
 * Equivale a SOMA('Lançamentos'!D20:E20; G20:H20; J20:K20; M20:N20; P20:Q20) da planilha
 * @param {Object} lancamentos
 * @returns {number}
 */
export const calcGastosVariaveis = ({ pix = [], debito = [], valeAlim = [] } = {}) =>
  totalPositivo(pix) + totalPositivo(debito) + totalPositivo(valeAlim)

/**
 * Total de todos os gastos (fixos + variáveis)
 * @param {Object} lancamentos
 * @returns {number}
 */
export const calcTotalGastos = (lancamentos = {}) =>
  calcGastosFixos(lancamentos) + calcGastosVariaveis(lancamentos)

// ─── Receitas ─────────────────────────────────────────────────────────────────

/**
 * Soma todas as receitas
 * Equivale a SOMA('Projeções'!A19:B19) da planilha
 * @param {Array<{valor: number}>} receitas
 * @returns {number}
 */
export const calcTotalReceitas = (receitas = []) =>
  receitas.reduce((soma, r) => soma + r.valor, 0)

// ─── Saldo e disponível ───────────────────────────────────────────────────────

/**
 * Calcula o saldo disponível (receitas - gastos totais)
 * @param {number} totalReceitas
 * @param {number} totalGastos
 * @returns {number}
 */
export const calcDisponivel = (totalReceitas, totalGastos) =>
  totalReceitas - totalGastos

/**
 * Calcula o saldo da reserva: soma dos investimentos com status "Concluído"
 * @param {Array<{valor: number, status: string}>} investimentos
 * @returns {number}
 */
export const calcSaldoReserva = (investimentos = []) =>
  investimentos
    .filter((i) => i.status === 'Concluído')
    .reduce((soma, i) => soma + i.valor, 0)

/**
 * Percentual do limite usado no mês (limitado a 100%)
 * @param {number} totalGastos
 * @param {number} limite
 * @returns {number} 0–100
 */
export const calcPercentualLimite = (totalGastos, limite) => {
  if (!limite || limite <= 0) return 0
  return Math.min((totalGastos / limite) * 100, 100)
}

/**
 * Cor da barra de progresso baseada no percentual de uso
 * @param {number} pct - 0 a 100
 * @returns {string}
 */
export const corLimite = (pct) => {
  if (pct > 90) return '#ef4444'
  if (pct > 70) return '#f59e0b'
  return '#10b981'
}

// ─── Saúde Financeira (regra 30/40/30) ───────────────────────────────────────
// Baseado nas fórmulas da planilha:
//   Fixos %    = SOMA(fixos)     / SOMA(receitas)
//   Variáveis% = SOMA(variáveis) / SOMA(receitas)
//   Poupança%  = (receitas - fixos - variáveis) / SOMA(receitas)
//   Média ideal fixos     = 0,3 * receitas
//   Média ideal variáveis = 0,4 * receitas
//   Média ideal poupança  = 0,3 * receitas

/**
 * Calcula os grupos da saúde financeira com percentuais reais e metas ideais
 * @param {Object} lancamentos
 * @param {number} totalReceitas
 * @returns {{ fixos, variaveis, poupanca, pctFixos, pctVariaveis, pctPoupanca,
 *             idealFixos, idealVariaveis, idealPoupanca }}
 */
export const calcSaude = (lancamentos = {}, totalReceitas) => {
  const fixos    = calcGastosFixos(lancamentos)
  const variaveis = calcGastosVariaveis(lancamentos)
  const poupanca = Math.max(totalReceitas - fixos - variaveis, 0)

  // Percentuais reais (fórmula da planilha: valor / receitas)
  const pctFixos    = totalReceitas > 0 ? fixos    / totalReceitas : 0
  const pctVariaveis = totalReceitas > 0 ? variaveis / totalReceitas : 0
  const pctPoupanca  = totalReceitas > 0 ? poupanca  / totalReceitas : 0

  // Médias ideais (fórmula da planilha)
  const idealFixos    = 0.3 * totalReceitas
  const idealVariaveis = 0.4 * totalReceitas
  const idealPoupanca  = 0.3 * totalReceitas

  return {
    fixos, variaveis, poupanca,
    pctFixos, pctVariaveis, pctPoupanca,
    idealFixos, idealVariaveis, idealPoupanca,
  }
}

// ─── Projeção 1 ano de reserva de emergência ─────────────────────────────────
// Fórmula da planilha: =VF(0; 12; -(Investimentos!B3 + Projeções!D19); 0)
// VF com taxa 0%: valor_futuro = nper * pgto = 12 * (reservaAtual + poupancaMensal)
// Onde poupancaMensal = Projeções!D19 = disponível após gastos

/**
 * Projeção de reserva de emergência para 1 ano
 * VF(taxa=0%, nper=12, pgto=-(reservaAtual + poupancaMensal))
 * @param {number} reservaAtual - saldo já investido/guardado (Investimentos!B3)
 * @param {number} poupancaMensal - sobra mensal (receitas - gastos)
 * @returns {number}
 */
export const calcProjecaoReserva1Ano = (reservaAtual, poupancaMensal) =>
  12 * (reservaAtual + Math.max(poupancaMensal, 0))

// ─── Contas (pagar / receber) ─────────────────────────────────────────────────

/**
 * Soma todos os valores de uma lista de contas
 * @param {Array<{valor: number}>} lista
 * @returns {number}
 */
export const calcTotalContas = (lista = []) =>
  lista.reduce((soma, item) => soma + item.valor, 0)

/**
 * Soma contas por status específico
 * @param {Array<{valor: number, status: string}>} lista
 * @param {string} status
 * @returns {number}
 */
export const calcTotalPorStatus = (lista = [], status) =>
  lista.filter((i) => i.status === status).reduce((soma, i) => soma + i.valor, 0)

// ─── Investimentos ────────────────────────────────────────────────────────────

/**
 * Soma todos os investimentos (independente do status)
 * @param {Array<{valor: number}>} investimentos
 * @returns {number}
 */
export const calcTotalInvestimentos = (investimentos = []) =>
  investimentos.reduce((soma, i) => soma + i.valor, 0)

/**
 * Soma apenas os investimentos concluídos
 * @param {Array<{valor: number, status: string}>} investimentos
 * @returns {number}
 */
export const calcInvestimentosConcluidos = (investimentos = []) =>
  calcSaldoReserva(investimentos)

// ─── Histórico ────────────────────────────────────────────────────────────────

/**
 * Média dos gastos mensais do histórico
 * @param {Array<{valor: number}>} historico
 * @returns {number}
 */
export const calcMediaGastosAnual = (historico = []) => {
  if (historico.length === 0) return 0
  return historico.reduce((soma, h) => soma + h.valor, 0) / historico.length
}
