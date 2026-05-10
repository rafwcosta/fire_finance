import { describe, it, expect } from 'vitest'
import {
  fmt, fmtPct, parseBRL,
  totalCategoria, totalPositivo,
  calcGastosFixos, calcGastosVariaveis, calcTotalGastos,
  calcTotalReceitas, calcDisponivel,
  calcSaldoReserva, calcPercentualLimite, corLimite,
  calcSaude, calcProjecaoReserva1Ano,
  calcTotalContas, calcTotalPorStatus,
  calcTotalInvestimentos, calcInvestimentosConcluidos,
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

// ─── fmtPct ──────────────────────────────────────────────────────────────────
describe('fmtPct', () => {
  it('formata 0.35 como 35,0%', () => {
    expect(fmtPct(0.35)).toBe('35,0%')
  })
  it('formata undefined como 0,0%', () => {
    expect(fmtPct(undefined)).toBe('0,0%')
  })
})

// ─── parseBRL ─────────────────────────────────────────────────────────────────
describe('parseBRL', () => {
  it('converte string BRL com vírgula decimal', () => {
    expect(parseBRL('1.234,56')).toBe(1234.56)
  })
  it('converte string com prefixo R$', () => {
    expect(parseBRL('R$ 500,00')).toBe(500)
  })
  it('converte número negativo', () => {
    expect(parseBRL('-149,90')).toBe(-149.9)
  })
  it('trata ponto como separador de milhar (padrão BRL)', () => {
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
  it('soma todos os valores incluindo negativos (estornos)', () => {
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

// ─── calcGastosFixos ──────────────────────────────────────────────────────────
describe('calcGastosFixos', () => {
  it('soma fixo + crédito + boleto (apenas positivos)', () => {
    const lancamentos = {
      fixo:    [{ valor: 300 }, { valor: 100 }],
      credito: [{ valor: 500 }, { valor: -50 }], // -50 é estorno
      boleto:  [{ valor: 80 }],
    }
    // 300 + 100 + 500 + 80 = 980 (ignora -50)
    expect(calcGastosFixos(lancamentos)).toBe(980)
  })
  it('retorna 0 para objeto vazio', () => {
    expect(calcGastosFixos({})).toBe(0)
  })
})

// ─── calcGastosVariaveis ─────────────────────────────────────────────────────
describe('calcGastosVariaveis', () => {
  it('soma pix + débito + valeAlim (apenas positivos)', () => {
    const lancamentos = {
      pix:     [{ valor: 50 }],
      debito:  [{ valor: 100 }],
      valeAlim:[{ valor: 30 }],
    }
    expect(calcGastosVariaveis(lancamentos)).toBe(180)
  })
  it('retorna 0 para objeto vazio', () => {
    expect(calcGastosVariaveis({})).toBe(0)
  })
})

// ─── calcTotalGastos ──────────────────────────────────────────────────────────
describe('calcTotalGastos', () => {
  it('soma fixos + variáveis', () => {
    const lancamentos = {
      fixo:    [{ valor: 400 }],
      credito: [],
      boleto:  [],
      pix:     [{ valor: 50 }],
      debito:  [{ valor: 100 }],
      valeAlim:[{ valor: 30 }],
    }
    expect(calcTotalGastos(lancamentos)).toBe(580)
  })
  it('retorna 0 para lançamentos vazios', () => {
    expect(calcTotalGastos({})).toBe(0)
  })
})

// ─── calcTotalReceitas ────────────────────────────────────────────────────────
describe('calcTotalReceitas', () => {
  it('soma todas as receitas', () => {
    const receitas = [{ valor: 2000 }, { valor: 300 }, { valor: 500 }]
    expect(calcTotalReceitas(receitas)).toBe(2800)
  })
  it('retorna 0 para lista vazia', () => {
    expect(calcTotalReceitas([])).toBe(0)
  })
})

// ─── calcDisponivel ───────────────────────────────────────────────────────────
describe('calcDisponivel', () => {
  it('calcula receitas - gastos', () => {
    expect(calcDisponivel(2500, 1800)).toBe(700)
  })
  it('retorna negativo quando gastos superam receitas', () => {
    expect(calcDisponivel(1000, 1500)).toBe(-500)
  })
  it('retorna zero quando iguais', () => {
    expect(calcDisponivel(1000, 1000)).toBe(0)
  })
})

// ─── calcSaldoReserva ─────────────────────────────────────────────────────────
describe('calcSaldoReserva', () => {
  it('soma apenas investimentos com status Concluído', () => {
    const inv = [
      { valor: 500, status: 'Concluído' },
      { valor: 85, status: 'Pendente' },
      { valor: 200, status: 'Concluído' },
    ]
    expect(calcSaldoReserva(inv)).toBe(700)
  })
  it('retorna 0 se nenhum concluído', () => {
    expect(calcSaldoReserva([{ valor: 500, status: 'Pendente' }])).toBe(0)
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
  it('retorna verde (≤70%)', () => {
    expect(corLimite(50)).toBe('#10b981')
    expect(corLimite(70)).toBe('#10b981')
  })
  it('retorna amarelo (71–90%)', () => {
    expect(corLimite(71)).toBe('#f59e0b')
    expect(corLimite(90)).toBe('#f59e0b')
  })
  it('retorna vermelho (>90%)', () => {
    expect(corLimite(91)).toBe('#ef4444')
    expect(corLimite(100)).toBe('#ef4444')
  })
})

// ─── calcSaude ────────────────────────────────────────────────────────────────
// Fórmulas da planilha:
//   fixos%    = SOMA(fixos) / SOMA(receitas)
//   variáveis%= SOMA(variáveis) / SOMA(receitas)
//   poupança% = (receitas - fixos - variáveis) / receitas
//   ideal fixos    = 0,3 * receitas
//   ideal variáveis= 0,4 * receitas
//   ideal poupança = 0,3 * receitas
describe('calcSaude', () => {
  const lancamentos = {
    fixo:    [{ valor: 300 }],
    credito: [{ valor: 200 }],
    boleto:  [{ valor: 100 }],  // fixos total = 600
    pix:     [{ valor: 100 }],
    debito:  [{ valor: 100 }],
    valeAlim:[{ valor: 200 }],  // variáveis total = 400
  }
  const totalReceitas = 2000   // poupança = 2000 - 600 - 400 = 1000

  it('calcula fixos corretamente', () => {
    const { fixos } = calcSaude(lancamentos, totalReceitas)
    expect(fixos).toBe(600)
  })
  it('calcula variáveis corretamente', () => {
    const { variaveis } = calcSaude(lancamentos, totalReceitas)
    expect(variaveis).toBe(400)
  })
  it('calcula poupança como sobra (receitas - fixos - variáveis)', () => {
    const { poupanca } = calcSaude(lancamentos, totalReceitas)
    expect(poupanca).toBe(1000)
  })
  it('calcula percentual real dos fixos', () => {
    const { pctFixos } = calcSaude(lancamentos, totalReceitas)
    expect(pctFixos).toBe(0.3) // 600/2000
  })
  it('calcula percentual real das variáveis', () => {
    const { pctVariaveis } = calcSaude(lancamentos, totalReceitas)
    expect(pctVariaveis).toBe(0.2) // 400/2000
  })
  it('calcula percentual real da poupança', () => {
    const { pctPoupanca } = calcSaude(lancamentos, totalReceitas)
    expect(pctPoupanca).toBe(0.5) // 1000/2000
  })
  it('calcula médias ideais (0.3, 0.4, 0.3 da receita)', () => {
    const { idealFixos, idealVariaveis, idealPoupanca } = calcSaude(lancamentos, totalReceitas)
    expect(idealFixos).toBe(600)      // 0.3 * 2000
    expect(idealVariaveis).toBe(800)  // 0.4 * 2000
    expect(idealPoupanca).toBe(600)   // 0.3 * 2000
  })
  it('poupança nunca é negativa', () => {
    const { poupanca } = calcSaude(lancamentos, 100)
    expect(poupanca).toBeGreaterThanOrEqual(0)
  })
  it('retorna zeros se receita for 0', () => {
    const { pctFixos } = calcSaude(lancamentos, 0)
    expect(pctFixos).toBe(0)
  })
})

// ─── calcProjecaoReserva1Ano ──────────────────────────────────────────────────
// Fórmula da planilha: =VF(0; 12; -(Investimentos!B3 + Projeções!D19); 0)
// Com taxa=0: VF = 12 * (reservaAtual + poupancaMensal)
describe('calcProjecaoReserva1Ano', () => {
  it('projeta reserva para 1 ano com taxa 0%', () => {
    // =VF(0; 12; -(500 + 300); 0) = 12 * 800 = 9600
    expect(calcProjecaoReserva1Ano(500, 300)).toBe(9600)
  })
  it('funciona com reserva zerada', () => {
    expect(calcProjecaoReserva1Ano(0, 500)).toBe(6000)
  })
  it('ignora poupança negativa (não desconta)', () => {
    expect(calcProjecaoReserva1Ano(1000, -200)).toBe(12000)
  })
  it('retorna 0 se ambos forem zero', () => {
    expect(calcProjecaoReserva1Ano(0, 0)).toBe(0)
  })
})

// ─── calcTotalContas ─────────────────────────────────────────────────────────
describe('calcTotalContas', () => {
  it('soma todos os valores', () => {
    const lista = [{ valor: 300 }, { valor: 200 }]
    expect(calcTotalContas(lista)).toBe(500)
  })
  it('retorna 0 para lista vazia', () => {
    expect(calcTotalContas([])).toBe(0)
  })
})

// ─── calcTotalPorStatus ───────────────────────────────────────────────────────
describe('calcTotalPorStatus', () => {
  const lista = [
    { valor: 300, status: 'Pendente' },
    { valor: 100, status: 'Recebido' },
    { valor: 200, status: 'Pendente' },
  ]
  it('filtra por Pendente', () => {
    expect(calcTotalPorStatus(lista, 'Pendente')).toBe(500)
  })
  it('filtra por Recebido', () => {
    expect(calcTotalPorStatus(lista, 'Recebido')).toBe(100)
  })
  it('retorna 0 para status inexistente', () => {
    expect(calcTotalPorStatus(lista, 'Cancelado')).toBe(0)
  })
})

// ─── calcTotalInvestimentos ───────────────────────────────────────────────────
describe('calcTotalInvestimentos', () => {
  it('soma todos independente do status', () => {
    const inv = [{ valor: 500, status: 'Concluído' }, { valor: 85, status: 'Pendente' }]
    expect(calcTotalInvestimentos(inv)).toBe(585)
  })
})

// ─── calcInvestimentosConcluidos ─────────────────────────────────────────────
describe('calcInvestimentosConcluidos', () => {
  it('soma apenas os concluídos', () => {
    const inv = [{ valor: 500, status: 'Concluído' }, { valor: 85, status: 'Pendente' }]
    expect(calcInvestimentosConcluidos(inv)).toBe(500)
  })
})

// ─── calcMediaGastosAnual ─────────────────────────────────────────────────────
describe('calcMediaGastosAnual', () => {
  it('calcula a média corretamente', () => {
    const historico = [{ valor: 1800 }, { valor: 2000 }, { valor: 2200 }]
    expect(calcMediaGastosAnual(historico)).toBe(2000)
  })
  it('retorna 0 para histórico vazio', () => {
    expect(calcMediaGastosAnual([])).toBe(0)
  })
})
