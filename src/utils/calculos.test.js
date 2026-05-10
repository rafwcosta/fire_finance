import { describe, it, expect } from 'vitest'
import {
  fmt,
  parseBRL,
  totalCategoria,
  totalPositivo,
  calcTotalGastos,
  calcTotalReceitas,
  calcDisponivel,
  calcSaldoReserva,
  calcPercentualLimite,
  corLimite,
  calcSaude,
  calcTotalContas,
  calcTotalPorStatus,
  calcTotalInvestimentos,
  calcInvestimentosConcluidos,
  calcMediaGastosAnual,
} from './calculos'

// ─── fmt ─────────────────────────────────────────────────────────────────────
describe('fmt', () => {
  it('formata número como moeda BRL', () => {
    expect(fmt(1234.56)).toBe('R$\u00a01.234,56')
  })
  it('formata zero corretamente', () => {
    expect(fmt(0)).toBe('R$\u00a00,00')
  })
  it('trata undefined como zero', () => {
    expect(fmt(undefined)).toBe('R$\u00a00,00')
  })
  it('formata valor negativo', () => {
    expect(fmt(-100)).toBe('-R$\u00a0100,00')
  })
})

// ─── parseBRL ─────────────────────────────────────────────────────────────────
describe('parseBRL', () => {
  it('converte string BRL para número', () => {
    expect(parseBRL('1.234,56')).toBe(1234.56)
  })
  it('converte string com prefixo R$', () => {
    expect(parseBRL('R$ 500,00')).toBe(500)
  })
  it('converte número negativo', () => {
    expect(parseBRL('-149,90')).toBe(-149.9)
  })
  it('trata ponto como separador de milhar (padrão BRL)', () => {
    // Em BRL, ponto é separador de milhar: '1.234' = 1234
    expect(parseBRL('1.234')).toBe(1234)
  })
  it('converte decimal com vírgula', () => {
    expect(parseBRL('1234,56')).toBe(1234.56)
  })
  it('retorna 0 para string inválida', () => {
    expect(parseBRL('')).toBe(0)
    expect(parseBRL('abc')).toBe(0)
  })
})

// ─── totalCategoria ───────────────────────────────────────────────────────────
describe('totalCategoria', () => {
  it('soma todos os valores incluindo negativos', () => {
    const itens = [{ valor: 100 }, { valor: -30 }, { valor: 50 }]
    expect(totalCategoria(itens)).toBe(120)
  })
  it('retorna 0 para lista vazia', () => {
    expect(totalCategoria([])).toBe(0)
  })
  it('retorna 0 para undefined', () => {
    expect(totalCategoria(undefined)).toBe(0)
  })
})

// ─── totalPositivo ────────────────────────────────────────────────────────────
describe('totalPositivo', () => {
  it('ignora valores negativos (descontos/estornos)', () => {
    const itens = [{ valor: 200 }, { valor: -50 }, { valor: 100 }]
    expect(totalPositivo(itens)).toBe(300)
  })
  it('ignora valores zero', () => {
    const itens = [{ valor: 0 }, { valor: 150 }]
    expect(totalPositivo(itens)).toBe(150)
  })
  it('retorna 0 para lista vazia', () => {
    expect(totalPositivo([])).toBe(0)
  })
})

// ─── calcTotalGastos ──────────────────────────────────────────────────────────
describe('calcTotalGastos', () => {
  it('soma valores positivos de todas as categorias', () => {
    const lancamentos = {
      fixo:    [{ valor: 100 }, { valor: 50 }],
      credito: [{ valor: 200 }, { valor: -30 }], // -30 é desconto, não conta
      pix:     [{ valor: 20 }],
      debito:  [],
      boleto:  [],
      valeAlim:[],
    }
    // 100 + 50 + 200 + 20 = 370 (o -30 é ignorado)
    expect(calcTotalGastos(lancamentos)).toBe(370)
  })
  it('retorna 0 para lançamentos vazios', () => {
    expect(calcTotalGastos({})).toBe(0)
  })
  it('retorna 0 se todos os valores são negativos', () => {
    const lancamentos = { fixo: [{ valor: -100 }, { valor: -50 }] }
    expect(calcTotalGastos(lancamentos)).toBe(0)
  })
})

// ─── calcTotalReceitas ────────────────────────────────────────────────────────
describe('calcTotalReceitas', () => {
  it('soma todas as receitas', () => {
    const receitas = [{ valor: 1768.79 }, { valor: 180 }, { valor: 558 }]
    expect(calcTotalReceitas(receitas)).toBeCloseTo(2506.79, 2)
  })
  it('retorna 0 para lista vazia', () => {
    expect(calcTotalReceitas([])).toBe(0)
  })
  it('inclui receitas zeradas', () => {
    const receitas = [{ valor: 1000 }, { valor: 0 }]
    expect(calcTotalReceitas(receitas)).toBe(1000)
  })
})

// ─── calcDisponivel ───────────────────────────────────────────────────────────
describe('calcDisponivel', () => {
  it('calcula disponível corretamente', () => {
    expect(calcDisponivel(2500, 1997)).toBeCloseTo(503, 0)
  })
  it('retorna negativo quando gastos superam receitas', () => {
    expect(calcDisponivel(1000, 1500)).toBe(-500)
  })
  it('retorna zero quando receitas = gastos', () => {
    expect(calcDisponivel(1000, 1000)).toBe(0)
  })
})

// ─── calcSaldoReserva ─────────────────────────────────────────────────────────
describe('calcSaldoReserva', () => {
  it('soma apenas investimentos concluídos', () => {
    const investimentos = [
      { valor: 500, status: 'Concluído' },
      { valor: 85, status: 'Pendente' },
      { valor: 200, status: 'Concluído' },
    ]
    expect(calcSaldoReserva(investimentos)).toBe(700)
  })
  it('retorna 0 se nenhum está concluído', () => {
    const investimentos = [{ valor: 500, status: 'Pendente' }]
    expect(calcSaldoReserva(investimentos)).toBe(0)
  })
  it('retorna 0 para lista vazia', () => {
    expect(calcSaldoReserva([])).toBe(0)
  })
})

// ─── calcPercentualLimite ─────────────────────────────────────────────────────
describe('calcPercentualLimite', () => {
  it('calcula percentual corretamente', () => {
    expect(calcPercentualLimite(1200, 2400)).toBe(50)
  })
  it('limita a 100% mesmo se gastos passam do limite', () => {
    expect(calcPercentualLimite(3000, 2400)).toBe(100)
  })
  it('retorna 0 se limite for 0', () => {
    expect(calcPercentualLimite(500, 0)).toBe(0)
  })
  it('retorna 0 se não houver gastos', () => {
    expect(calcPercentualLimite(0, 2400)).toBe(0)
  })
})

// ─── corLimite ────────────────────────────────────────────────────────────────
describe('corLimite', () => {
  it('retorna verde para uso saudável (≤70%)', () => {
    expect(corLimite(50)).toBe('#10b981')
    expect(corLimite(70)).toBe('#10b981')
  })
  it('retorna amarelo para atenção (71–90%)', () => {
    expect(corLimite(71)).toBe('#f59e0b')
    expect(corLimite(90)).toBe('#f59e0b')
  })
  it('retorna vermelho para crítico (>90%)', () => {
    expect(corLimite(91)).toBe('#ef4444')
    expect(corLimite(100)).toBe('#ef4444')
  })
})

// ─── calcSaude ────────────────────────────────────────────────────────────────
describe('calcSaude', () => {
  const lancamentos = {
    fixo:    [{ valor: 300 }, { valor: 100 }],       // fixos: 400
    credito: [{ valor: 200 }, { valor: -50 }],        // fixos: +200 (ignora -50)
    pix:     [{ valor: 50 }],                         // variáveis: 50
    debito:  [{ valor: 100 }],                        // variáveis: 100
    boleto:  [{ valor: 80 }],                         // fixos: 80
    valeAlim:[{ valor: 30 }],                         // variáveis: 30
  }
  const totalReceitas = 2000

  it('calcula fixos corretamente (fixo + crédito + boleto)', () => {
    const { fixos } = calcSaude(lancamentos, totalReceitas)
    expect(fixos).toBe(680) // 400 + 200 + 80
  })
  it('calcula variáveis corretamente (pix + débito + valeAlim)', () => {
    const { variaveis } = calcSaude(lancamentos, totalReceitas)
    expect(variaveis).toBe(180) // 50 + 100 + 30
  })
  it('calcula poupança como o que sobra', () => {
    const { poupanca } = calcSaude(lancamentos, totalReceitas)
    expect(poupanca).toBe(1140) // 2000 - 680 - 180
  })
  it('poupança nunca é negativa', () => {
    const { poupanca } = calcSaude(lancamentos, 100)
    expect(poupanca).toBeGreaterThanOrEqual(0)
  })
})

// ─── calcTotalContas ─────────────────────────────────────────────────────────
describe('calcTotalContas', () => {
  it('soma todos os valores', () => {
    const lista = [{ valor: 558 }, { valor: 200 }]
    expect(calcTotalContas(lista)).toBe(758)
  })
  it('retorna 0 para lista vazia', () => {
    expect(calcTotalContas([])).toBe(0)
  })
})

// ─── calcTotalPorStatus ───────────────────────────────────────────────────────
describe('calcTotalPorStatus', () => {
  const lista = [
    { valor: 558, status: 'Pendente' },
    { valor: 100, status: 'Recebido' },
    { valor: 200, status: 'Pendente' },
  ]
  it('filtra por status Pendente', () => {
    expect(calcTotalPorStatus(lista, 'Pendente')).toBe(758)
  })
  it('filtra por status Recebido', () => {
    expect(calcTotalPorStatus(lista, 'Recebido')).toBe(100)
  })
  it('retorna 0 para status inexistente', () => {
    expect(calcTotalPorStatus(lista, 'Cancelado')).toBe(0)
  })
})

// ─── calcTotalInvestimentos ───────────────────────────────────────────────────
describe('calcTotalInvestimentos', () => {
  it('soma todos independente do status', () => {
    const inv = [
      { valor: 500, status: 'Concluído' },
      { valor: 85, status: 'Pendente' },
    ]
    expect(calcTotalInvestimentos(inv)).toBe(585)
  })
})

// ─── calcInvestimentosConcluidos ─────────────────────────────────────────────
describe('calcInvestimentosConcluidos', () => {
  it('soma apenas os concluídos', () => {
    const inv = [
      { valor: 500, status: 'Concluído' },
      { valor: 85, status: 'Pendente' },
    ]
    expect(calcInvestimentosConcluidos(inv)).toBe(500)
  })
})

// ─── calcMediaGastosAnual ─────────────────────────────────────────────────────
describe('calcMediaGastosAnual', () => {
  it('calcula a média corretamente', () => {
    const historico = [
      { valor: 2255 },
      { valor: 2435 },
      { valor: 2765 },
    ]
    expect(calcMediaGastosAnual(historico)).toBeCloseTo(2485, 0)
  })
  it('retorna 0 para histórico vazio', () => {
    expect(calcMediaGastosAnual([])).toBe(0)
  })
})
