// ─── Formatação ───────────────────────────────────────────────────────────────

/**
 * Formata um número como moeda BRL (R$ 1.234,56)
 * @param {number} valor
 * @returns {string}
 */
export const fmt = (valor) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0)

/**
 * Converte string no formato BRL para número
 * Aceita: "1.234,56" | "R$ 1.234,56" | "1234.56" | "-500"
 * @param {string} str
 * @returns {number}
 */
export const parseBRL = (str) =>
  parseFloat(String(str).replace(/[R$\s.]/g, '').replace(',', '.')) || 0

// ─── Lançamentos ──────────────────────────────────────────────────────────────

/**
 * Soma todos os valores de uma lista de itens
 * @param {Array<{valor: number}>} itens
 * @returns {number}
 */
export const totalCategoria = (itens = []) =>
  itens.reduce((soma, item) => soma + item.valor, 0)

/**
 * Soma apenas os valores positivos de uma categoria
 * (valores negativos são descontos/estornos e não entram no gasto real)
 * @param {Array<{valor: number}>} itens
 * @returns {number}
 */
export const totalPositivo = (itens = []) =>
  itens.filter((i) => i.valor > 0).reduce((soma, item) => soma + item.valor, 0)

/**
 * Calcula o total de gastos de todos os lançamentos
 * Soma apenas valores positivos de todas as categorias
 * @param {Object} lancamentos
 * @returns {number}
 */
export const calcTotalGastos = (lancamentos = {}) =>
  Object.values(lancamentos)
    .flat()
    .filter((i) => i.valor > 0)
    .reduce((soma, item) => soma + item.valor, 0)

// ─── Receitas ─────────────────────────────────────────────────────────────────

/**
 * Soma todas as receitas
 * @param {Array<{valor: number}>} receitas
 * @returns {number}
 */
export const calcTotalReceitas = (receitas = []) =>
  receitas.reduce((soma, r) => soma + r.valor, 0)

// ─── Saldo e disponível ───────────────────────────────────────────────────────

/**
 * Calcula o saldo disponível (receitas - gastos)
 * @param {number} totalReceitas
 * @param {number} totalGastos
 * @returns {number}
 */
export const calcDisponivel = (totalReceitas, totalGastos) =>
  totalReceitas - totalGastos

/**
 * Calcula o saldo da reserva de emergência
 * Soma apenas os investimentos com status "Concluído"
 * @param {Array<{valor: number, status: string}>} investimentos
 * @returns {number}
 */
export const calcSaldoReserva = (investimentos = []) =>
  investimentos
    .filter((i) => i.status === 'Concluído')
    .reduce((soma, i) => soma + i.valor, 0)

/**
 * Calcula o percentual usado do limite mensal
 * Limitado a 100% para a barra de progresso
 * @param {number} totalGastos
 * @param {number} limite
 * @returns {number} valor entre 0 e 100
 */
export const calcPercentualLimite = (totalGastos, limite) => {
  if (!limite || limite <= 0) return 0
  return Math.min((totalGastos / limite) * 100, 100)
}

/**
 * Retorna a cor da barra de progresso baseada no percentual
 * @param {number} pct - valor entre 0 e 100
 * @returns {string} cor hex
 */
export const corLimite = (pct) => {
  if (pct > 90) return '#ef4444' // vermelho: crítico
  if (pct > 70) return '#f59e0b' // amarelo: atenção
  return '#10b981'               // verde: saudável
}

// ─── Saúde financeira (regra 30/40/30) ───────────────────────────────────────

/**
 * Calcula os valores reais de cada grupo da regra 30/40/30
 * - Fixos (30%): categorias fixo + crédito + boleto
 * - Variáveis (40%): pix + débito + vale alimentação
 * - Poupança (30%): o que sobra (receitas - todos os gastos)
 * @param {Object} lancamentos
 * @param {number} totalReceitas
 * @returns {{ fixos: number, variaveis: number, poupanca: number }}
 */
export const calcSaude = (lancamentos = {}, totalReceitas) => {
  const { fixo = [], credito = [], pix = [], debito = [], boleto = [], valeAlim = [] } = lancamentos

  const fixos = totalPositivo(fixo) + totalPositivo(credito) + totalPositivo(boleto)
  const variaveis = totalPositivo(pix) + totalPositivo(debito) + totalPositivo(valeAlim)
  const totalGastos = fixos + variaveis
  const poupanca = Math.max(totalReceitas - totalGastos, 0)

  return { fixos, variaveis, poupanca }
}

// ─── Totais de pagar/receber ──────────────────────────────────────────────────

/**
 * Soma todos os valores de uma lista de contas (pagar ou receber)
 * @param {Array<{valor: number}>} lista
 * @returns {number}
 */
export const calcTotalContas = (lista = []) =>
  lista.reduce((soma, item) => soma + item.valor, 0)

/**
 * Soma apenas as contas com determinado status
 * @param {Array<{valor: number, status: string}>} lista
 * @param {string} status
 * @returns {number}
 */
export const calcTotalPorStatus = (lista = [], status) =>
  lista.filter((i) => i.status === status).reduce((soma, i) => soma + i.valor, 0)

// ─── Investimentos ────────────────────────────────────────────────────────────

/**
 * Soma todos os investimentos
 * @param {Array<{valor: number}>} investimentos
 * @returns {number}
 */
export const calcTotalInvestimentos = (investimentos = []) =>
  investimentos.reduce((soma, i) => soma + i.valor, 0)

/**
 * Soma os investimentos já concluídos
 * @param {Array<{valor: number, status: string}>} investimentos
 * @returns {number}
 */
export const calcInvestimentosConcluidos = (investimentos = []) =>
  calcSaldoReserva(investimentos) // mesmo cálculo, alias semântico

// ─── Média histórica ──────────────────────────────────────────────────────────

/**
 * Calcula a média dos gastos do histórico mensal
 * @param {Array<{valor: number}>} historico
 * @returns {number}
 */
export const calcMediaGastosAnual = (historico = []) => {
  if (historico.length === 0) return 0
  const total = historico.reduce((soma, h) => soma + h.valor, 0)
  return total / historico.length
}
