# ============================================================
# GESTÃO FINANCEIRA PESSOAL
# Aplicativo desenvolvido com Python e Streamlit
# ============================================================

import streamlit as st
import pandas as pd
import json
import os
from datetime import datetime

# ── Configuração da página ────────────────────────────────────
st.set_page_config(
    page_title="Gestão Financeira",
    page_icon="💰",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ── Estilos globais ───────────────────────────────────────────
st.markdown("""
<style>
    /* Remove padding excessivo no topo */
    .block-container { padding-top: 1.5rem; }

    /* Cards de métrica com borda colorida */
    [data-testid="metric-container"] {
        background: #1a1a2e;
        border-radius: 8px;
        padding: 12px 16px;
        border-left: 4px solid #7c3aed;
    }

    /* Títulos das seções */
    h2 { color: #a78bfa !important; }
    h3 { color: #c4b5fd !important; }

    /* Tabelas com fundo escuro */
    [data-testid="stDataFrame"] { border-radius: 8px; }

    /* Botão primário customizado */
    .stButton > button[kind="primary"] {
        background: linear-gradient(135deg, #7c3aed, #4f46e5);
        border: none;
        font-weight: bold;
    }

    /* Badge de status */
    .badge-pago   { background:#166534; color:#86efac; padding:4px 12px; border-radius:20px; font-weight:bold; }
    .badge-pendente { background:#7f1d1d; color:#fca5a5; padding:4px 12px; border-radius:20px; font-weight:bold; }
</style>
""", unsafe_allow_html=True)


# ════════════════════════════════════════════════════════════
#  GERENCIAMENTO DE DADOS
# ════════════════════════════════════════════════════════════

DATA_DIR = "dados_financeiros"
os.makedirs(DATA_DIR, exist_ok=True)


def get_filepath(mes_ano: str) -> str:
    """Retorna o caminho do arquivo JSON do mês."""
    return os.path.join(DATA_DIR, f"{mes_ano}.json")


def dados_padrao() -> dict:
    """Estrutura inicial vazia para um mês."""
    return {
        "limite_gastos": 0.0,
        "saldo_reserva": 0.0,
        "data_fechamento": "",
        "data_vencimento": "",
        "data_pagamento": "",
        "status_fatura": "Pendente",
        "lancamentos": {
            "Fixos":   [],
            "Crédito": [],
            "Pix":     [],
            "Débito":  [],
            "Boleto":  [],
        },
        "investimentos":   [],
        "valores_receber": [],
        "valores_pagar":   [],
        "receitas":        [],
    }


def carregar_dados(mes_ano: str) -> dict:
    """Carrega os dados do JSON ou retorna estrutura padrão."""
    fp = get_filepath(mes_ano)
    if os.path.exists(fp):
        with open(fp, "r", encoding="utf-8") as f:
            dados = json.load(f)
        # Garante compatibilidade se novos campos foram adicionados
        padrao = dados_padrao()
        for chave, valor in padrao.items():
            dados.setdefault(chave, valor)
        return dados
    return dados_padrao()


def salvar_dados(mes_ano: str, dados: dict):
    """Persiste os dados no arquivo JSON."""
    fp = get_filepath(mes_ano)
    with open(fp, "w", encoding="utf-8") as f:
        json.dump(dados, f, ensure_ascii=False, indent=2)


def listar_meses_salvos() -> list:
    """Retorna lista de meses (YYYY-MM) com dados salvos, ordenada."""
    if not os.path.exists(DATA_DIR):
        return []
    return sorted(
        arq.replace(".json", "")
        for arq in os.listdir(DATA_DIR)
        if arq.endswith(".json")
    )


# ════════════════════════════════════════════════════════════
#  FUNÇÕES AUXILIARES
# ════════════════════════════════════════════════════════════

def fmt_brl(valor: float) -> str:
    """Formata número para Real Brasileiro. Ex: R$ 1.234,56"""
    sinal = "-" if valor < 0 else ""
    return f"{sinal}R$ {abs(valor):,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def total_lista(lista: list, campo: str = "valor") -> float:
    """Soma os valores de uma lista de dicionários."""
    return sum(item.get(campo, 0.0) for item in lista)


def total_gastos(dados: dict) -> float:
    """Soma todos os lançamentos de gastos."""
    return sum(total_lista(cat) for cat in dados["lancamentos"].values())


def total_receitas(dados: dict) -> float:
    return total_lista(dados["receitas"])


def nome_mes(mes_ano: str) -> str:
    """Converte 'YYYY-MM' → 'Janeiro/2026'."""
    MESES = [
        "Janeiro", "Fevereiro", "Março", "Abril",
        "Maio", "Junho", "Julho", "Agosto",
        "Setembro", "Outubro", "Novembro", "Dezembro",
    ]
    try:
        ano, mes = mes_ano.split("-")
        return f"{MESES[int(mes) - 1]}/{ano}"
    except Exception:
        return mes_ano


# ════════════════════════════════════════════════════════════
#  COMPONENTE GENÉRICO: LISTA COM ADICIONAR / REMOVER
# ════════════════════════════════════════════════════════════

def componente_lista(
    chave: str,
    lista: list,
    campos: list,
    mes_ano: str,
    dados: dict,
    salvar_fn,
):
    """
    Renderiza um formulário para adicionar itens e uma tabela com opção de remoção.

    Parâmetros:
        chave    – identificador único para widgets do Streamlit
        lista    – referência à lista dentro de 'dados'
        campos   – lista de dicts com {label, placeholder, tipo}
        mes_ano  – mês atual
        dados    – dicionário completo de dados
        salvar_fn – função de persistência
    """
    # Formulário de adição
    with st.form(key=f"form_{chave}"):
        cols = st.columns([*[3 if c["tipo"] == "text" else 2 for c in campos], 1])
        valores_form = {}
        for i, campo in enumerate(campos):
            with cols[i]:
                if campo["tipo"] == "text":
                    valores_form[campo["key"]] = st.text_input(
                        campo["label"], placeholder=campo.get("placeholder", "")
                    )
                elif campo["tipo"] == "number":
                    valores_form[campo["key"]] = st.number_input(
                        campo["label"], min_value=0.0, step=0.01, format="%.2f"
                    )
                elif campo["tipo"] == "date":
                    val = st.date_input(campo["label"])
                    valores_form[campo["key"]] = str(val)
        with cols[-1]:
            st.markdown("<br>", unsafe_allow_html=True)
            submitted = st.form_submit_button("➕ Adicionar")

        if submitted:
            # Valida que o campo texto principal foi preenchido
            primeiro_texto = next(
                (v for c, v in zip(campos, valores_form.values()) if c["tipo"] == "text"), ""
            )
            if primeiro_texto:
                lista.append(valores_form)
                salvar_fn(mes_ano, dados)
                st.success("✅ Item adicionado!")
                st.rerun()
            else:
                st.error("Preencha ao menos o nome/descrição.")

    # Tabela de itens
    if lista:
        df = pd.DataFrame(lista)
        df_fmt = df.copy()
        # Formata colunas numéricas
        for col in df.columns:
            if df[col].dtype in ["float64", "int64"]:
                df_fmt[col] = df[col].apply(fmt_brl)
        df_fmt.index = range(1, len(df_fmt) + 1)
        st.dataframe(df_fmt, use_container_width=True)

        # Total se houver coluna "valor"
        if "valor" in df.columns:
            total = total_lista(lista)
            st.markdown(f"**Total: {fmt_brl(total)}**")

        # Remoção
        with st.expander("🗑️ Remover item"):
            nome_col = campos[0]["key"]
            opcoes = [f"{j + 1}. {item.get(nome_col, '—')}" for j, item in enumerate(lista)]
            sel = st.selectbox("Selecione o item:", opcoes, key=f"sel_del_{chave}")
            if st.button("🗑️ Remover selecionado", key=f"btn_del_{chave}"):
                idx = int(sel.split(".")[0]) - 1
                lista.pop(idx)
                salvar_fn(mes_ano, dados)
                st.rerun()
    else:
        st.info("Nenhum item cadastrado.")


# ════════════════════════════════════════════════════════════
#  GERADOR DE RELATÓRIO PDF
# ════════════════════════════════════════════════════════════

def gerar_relatorio_pdf(mes_ano: str, dados: dict) -> bytes | None:
    """
    Gera um relatório PDF completo com todas as seções.
    Requer a biblioteca fpdf2 instalada.
    """
    try:
        from fpdf import FPDF
    except ImportError:
        return None

    # ── Paleta de cores ──────────────────────────────────────
    COR_ROXA    = (124, 58, 237)
    COR_VERDE   = (22, 163, 74)
    COR_VERMELHA = (220, 38, 38)
    COR_CINZA   = (107, 114, 128)
    COR_FUNDO   = (245, 243, 255)

    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    # ── Helpers de renderização ───────────────────────────────
    def cabecalho_secao(titulo: str):
        pdf.set_font("Helvetica", "B", 13)
        pdf.set_text_color(*COR_ROXA)
        pdf.set_fill_color(*COR_FUNDO)
        pdf.cell(0, 9, titulo, fill=True, new_x="LMARGIN", new_y="NEXT")
        pdf.set_draw_color(*COR_ROXA)
        pdf.set_line_width(0.5)
        pdf.line(10, pdf.get_y(), 200, pdf.get_y())
        pdf.ln(2)
        pdf.set_text_color(30, 30, 30)
        pdf.set_font("Helvetica", "", 10)

    def linha(descricao: str, valor_str: str, negativo: bool = False, negrito: bool = False):
        estilo = "B" if negrito else ""
        pdf.set_font("Helvetica", estilo, 10)
        cor = COR_VERMELHA if negativo else (30, 30, 30)
        pdf.set_text_color(*cor)
        pdf.cell(130, 6, str(descricao))
        pdf.cell(0, 6, valor_str, align="R", new_x="LMARGIN", new_y="NEXT")
        pdf.set_text_color(30, 30, 30)

    def linha_total(descricao: str, valor: float, positivo: bool = True):
        pdf.set_font("Helvetica", "B", 11)
        cor = COR_VERDE if positivo else COR_VERMELHA
        pdf.set_text_color(*cor)
        pdf.set_fill_color(235, 230, 255)
        pdf.cell(130, 7, descricao, fill=True)
        pdf.cell(0, 7, fmt_brl(valor), align="R", fill=True, new_x="LMARGIN", new_y="NEXT")
        pdf.set_text_color(30, 30, 30)
        pdf.ln(1)

    def texto(txt: str, cor=None):
        pdf.set_font("Helvetica", "", 10)
        if cor:
            pdf.set_text_color(*cor)
        pdf.multi_cell(0, 6, txt)
        pdf.set_text_color(30, 30, 30)

    # ════════════════════════════════════════════════
    #  CAPA
    # ════════════════════════════════════════════════
    pdf.set_font("Helvetica", "B", 22)
    pdf.set_text_color(*COR_ROXA)
    pdf.ln(10)
    pdf.cell(0, 14, "RELATÓRIO FINANCEIRO", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 14)
    pdf.set_text_color(*COR_CINZA)
    pdf.cell(0, 8, nome_mes(mes_ano), align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_text_color(*COR_CINZA)
    pdf.set_font("Helvetica", "I", 9)
    pdf.cell(0, 6, f"Gerado em {datetime.now().strftime('%d/%m/%Y às %H:%M')}", align="C",
             new_x="LMARGIN", new_y="NEXT")
    pdf.ln(8)

    # ════════════════════════════════════════════════
    #  SEÇÃO 1 — LANÇAMENTOS
    # ════════════════════════════════════════════════
    cabecalho_secao("1. LANÇAMENTOS")

    total_geral = 0.0
    for cat_nome, itens in dados["lancamentos"].items():
        if not itens:
            continue
        pdf.set_font("Helvetica", "B", 10)
        pdf.set_text_color(*COR_ROXA)
        pdf.cell(0, 7, f"  {cat_nome}:", new_x="LMARGIN", new_y="NEXT")
        pdf.set_text_color(30, 30, 30)
        for item in itens:
            linha(f"    • {item.get('nome', '—')}", fmt_brl(item.get("valor", 0.0)), negativo=True)
        subtotal = total_lista(itens)
        total_geral += subtotal
        linha_total(f"  Subtotal {cat_nome}", subtotal, positivo=False)

    linha_total("▶ TOTAL GERAL DE GASTOS", total_geral, positivo=False)
    pdf.ln(4)

    # ════════════════════════════════════════════════
    #  SEÇÃO 2 — INVESTIMENTOS
    # ════════════════════════════════════════════════
    cabecalho_secao("2. INVESTIMENTOS")
    if dados["investimentos"]:
        for item in dados["investimentos"]:
            linha(f"  • {item.get('nome', '—')}", fmt_brl(item.get("valor", 0.0)))
        linha_total("▶ Total Investimentos/mês", total_lista(dados["investimentos"]))
    else:
        texto("  Nenhum investimento cadastrado.", cor=COR_CINZA)
    pdf.ln(4)

    # ════════════════════════════════════════════════
    #  SEÇÃO 3 — VALORES A RECEBER
    # ════════════════════════════════════════════════
    cabecalho_secao("3. VALORES A RECEBER")
    if dados["valores_receber"]:
        for item in dados["valores_receber"]:
            desc = f"  • {item.get('nome', '—')}  (Prev: {item.get('data_prevista', '—')})"
            linha(desc, fmt_brl(item.get("valor", 0.0)))
        linha_total("▶ Total a Receber", total_lista(dados["valores_receber"]))
    else:
        texto("  Nenhum valor a receber cadastrado.", cor=COR_CINZA)
    pdf.ln(4)

    # ════════════════════════════════════════════════
    #  SEÇÃO 4 — VALORES A PAGAR
    # ════════════════════════════════════════════════
    cabecalho_secao("4. VALORES A PAGAR")
    if dados["valores_pagar"]:
        for item in dados["valores_pagar"]:
            desc = f"  • {item.get('nome', '—')}  (Venc: {item.get('data_vencimento', '—')})"
            linha(desc, fmt_brl(item.get("valor", 0.0)), negativo=True)
        linha_total("▶ Total a Pagar", total_lista(dados["valores_pagar"]), positivo=False)
    else:
        texto("  Nenhum valor a pagar cadastrado.", cor=COR_CINZA)
    pdf.ln(4)

    # ════════════════════════════════════════════════
    #  SEÇÃO 5 — PROJEÇÕES
    # ════════════════════════════════════════════════
    cabecalho_secao("5. PROJEÇÕES FINANCEIRAS")

    rec_total  = total_receitas(dados)
    gast_total = total_gastos(dados)
    inv_total  = total_lista(dados["investimentos"])
    saida_tot  = gast_total + inv_total
    saldo      = rec_total - saida_tot
    reserva_m  = max(saldo, 0.0)

    # Receitas
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_text_color(*COR_ROXA)
    pdf.cell(0, 7, "  Receitas:", new_x="LMARGIN", new_y="NEXT")
    pdf.set_text_color(30, 30, 30)
    for item in dados["receitas"]:
        linha(f"    • {item.get('nome', '—')}", fmt_brl(item.get("valor", 0.0)))
    linha_total("▶ Total Receitas", rec_total)

    # Saldo
    linha("  Gastos + Investimentos (Saídas)", fmt_brl(saida_tot), negativo=True)
    linha_total("▶ Saldo Líquido (Receitas - Saídas)", saldo, positivo=(saldo >= 0))

    # Saúde financeira
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_text_color(*COR_ROXA)
    pdf.cell(0, 7, "  Saúde Financeira — Regra 50/30/20:", new_x="LMARGIN", new_y="NEXT")
    pdf.set_text_color(30, 30, 30)

    gastos_fixos   = total_lista(dados["lancamentos"]["Fixos"])
    gastos_var     = saida_tot - gastos_fixos
    ideal_fixo     = rec_total * 0.50
    ideal_var      = rec_total * 0.30
    ideal_poupc    = rec_total * 0.20
    proj_1_ano     = reserva_m * 12

    dados_sf = [
        ("Fixo (50%)",    gastos_fixos, ideal_fixo),
        ("Variável (30%)", gastos_var,  ideal_var),
        ("Poupança (20%)", inv_total,   ideal_poupc),
    ]
    for tipo, atual, ideal in dados_sf:
        pct_atual = f"{(atual / rec_total * 100):.1f}%" if rec_total > 0 else "—"
        linha(
            f"    • {tipo}: Atual {fmt_brl(atual)} ({pct_atual}) | Ideal {fmt_brl(ideal)}",
            ""
        )
    linha("  Projeção de reserva em 1 ano", fmt_brl(proj_1_ano), negrito=True)
    pdf.ln(4)

    # ════════════════════════════════════════════════
    #  SEÇÃO 6 — RENDA ANUAL (nova página)
    # ════════════════════════════════════════════════
    pdf.add_page()
    cabecalho_secao("6. RENDA ANUAL")

    meses_salvos = listar_meses_salvos()
    total_rec_anual   = 0.0
    total_gast_anual  = 0.0

    for m in meses_salvos:
        d   = carregar_dados(m)
        rec = total_receitas(d)
        gt  = total_gastos(d)
        total_rec_anual  += rec
        total_gast_anual += gt
        linha(f"  {nome_mes(m)}", fmt_brl(rec))

    linha_total("▶ Total Anual Receitas", total_rec_anual)
    linha_total("▶ Total Anual Gastos",   total_gast_anual, positivo=False)
    n = len(meses_salvos)
    if n > 0:
        linha(f"  Média mensal de gastos ({n} meses)", fmt_brl(total_gast_anual / n), negrito=True)
    pdf.ln(4)

    # ════════════════════════════════════════════════
    #  SEÇÃO 7 — RESUMO
    # ════════════════════════════════════════════════
    cabecalho_secao("7. RESUMO")

    limite    = dados.get("limite_gastos", 0.0)
    disponiv  = limite - gast_total
    reserva   = dados.get("saldo_reserva", 0.0)
    status    = dados.get("status_fatura", "Pendente")

    linha("  Limite de Gastos",              fmt_brl(limite))
    linha("  Total de Gastos (Saída)",       fmt_brl(gast_total), negativo=True)
    linha_total("▶ Disponível na Conta",     disponiv, positivo=(disponiv >= 0))
    linha("  Saldo Reserva de Emergência",   fmt_brl(reserva))
    pdf.ln(2)

    # Datas
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_text_color(*COR_ROXA)
    pdf.cell(0, 7, "  Datas da Fatura:", new_x="LMARGIN", new_y="NEXT")
    pdf.set_text_color(30, 30, 30)
    linha("    Fechamento", dados.get("data_fechamento", "—"))
    linha("    Vencimento", dados.get("data_vencimento", "—"))
    linha("    Pagamento",  dados.get("data_pagamento", "—"))

    # Status
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(*(COR_VERDE if status == "Pago" else COR_VERMELHA))
    pdf.cell(130, 8, "  Status da Fatura:")
    pdf.cell(0, 8, status, align="R", new_x="LMARGIN", new_y="NEXT")
    pdf.set_text_color(30, 30, 30)
    pdf.ln(4)

    # Gastos anteriores
    outros = [m for m in meses_salvos if m != mes_ano]
    if outros:
        pdf.set_font("Helvetica", "B", 10)
        pdf.set_text_color(*COR_ROXA)
        pdf.cell(0, 7, "  Gastos Meses Anteriores:", new_x="LMARGIN", new_y="NEXT")
        pdf.set_text_color(30, 30, 30)
        for m in outros[-6:]:
            d = carregar_dados(m)
            linha(f"    {nome_mes(m)}", fmt_brl(total_gastos(d)), negativo=True)
    pdf.ln(4)

    # Média anual
    if n > 0:
        pdf.set_font("Helvetica", "B", 11)
        linha_total(
            f"▶ Média de Gastos Anual ({n} meses)",
            total_gast_anual / n,
            positivo=False,
        )

    # ── Rodapé ────────────────────────────────────────────────
    pdf.ln(10)
    pdf.set_font("Helvetica", "I", 8)
    pdf.set_text_color(*COR_CINZA)
    pdf.cell(0, 6, "Gestão Financeira Pessoal · Relatório gerado automaticamente", align="C")

    return bytes(pdf.output())


# ════════════════════════════════════════════════════════════
#  SIDEBAR — SELEÇÃO DE MÊS
# ════════════════════════════════════════════════════════════

with st.sidebar:
    st.markdown("## 💰 Gestão Financeira")
    st.divider()

    st.markdown("### 📅 Mês de Referência")
    ANOS = list(range(2023, 2031))
    MESES_NOMES = [
        "Janeiro", "Fevereiro", "Março", "Abril",
        "Maio", "Junho", "Julho", "Agosto",
        "Setembro", "Outubro", "Novembro", "Dezembro",
    ]
    hoje = datetime.now()

    col_a, col_m = st.columns(2)
    with col_a:
        ano_sel = st.selectbox("Ano", ANOS, index=ANOS.index(hoje.year))
    with col_m:
        mes_sel = st.selectbox(
            "Mês", range(1, 13),
            format_func=lambda x: MESES_NOMES[x - 1],
            index=hoje.month - 1,
        )

    mes_ano = f"{ano_sel}-{mes_sel:02d}"
    st.info(f"📆 {nome_mes(mes_ano)}")
    st.divider()

    # Histórico salvo
    meses_salvos = listar_meses_salvos()
    if meses_salvos:
        st.markdown("### 📁 Histórico")
        for m in reversed(meses_salvos[-8:]):
            d_tmp = carregar_dados(m)
            status_ico = "✅" if d_tmp.get("status_fatura") == "Pago" else "⏳"
            st.caption(f"{status_ico} {nome_mes(m)}")
    st.divider()
    st.caption("Dados salvos automaticamente em JSON por mês.")


# ════════════════════════════════════════════════════════════
#  CARREGA DADOS DO MÊS SELECIONADO
# ════════════════════════════════════════════════════════════

dados = carregar_dados(mes_ano)

# Cabeçalho principal
st.title(f"💰 Gestão Financeira — {nome_mes(mes_ano)}")

# Banner de status
status_atual = dados.get("status_fatura", "Pendente")
if status_atual == "Pago":
    st.markdown(
        f'<span class="badge-pago">✅ Fatura Paga em {dados.get("data_pagamento", "—")}</span>',
        unsafe_allow_html=True,
    )
else:
    st.markdown(
        '<span class="badge-pendente">⏳ Fatura Pendente</span>',
        unsafe_allow_html=True,
    )

st.divider()


# ════════════════════════════════════════════════════════════
#  TABS PRINCIPAIS
# ════════════════════════════════════════════════════════════

TAB_LABELS = [
    "📋 Lançamentos",
    "📈 Investimentos",
    "💵 A Receber",
    "💸 A Pagar",
    "🔮 Projeções",
    "📊 Renda Anual",
    "📝 Resumo",
]
tabs = st.tabs(TAB_LABELS)


# ────────────────────────────────────────────────────────────
#  TAB 1 · LANÇAMENTOS
# ────────────────────────────────────────────────────────────
with tabs[0]:
    st.markdown("## 📋 Lançamentos")
    st.markdown("Registre todos os seus gastos organizados por tipo de pagamento.")

    CATEGORIAS = ["Fixos", "Crédito", "Pix", "Débito", "Boleto"]
    ICONES_CAT = {"Fixos": "🏠", "Crédito": "💳", "Pix": "⚡", "Débito": "🏦", "Boleto": "📄"}

    cat_tabs = st.tabs([f"{ICONES_CAT[c]} {c}" for c in CATEGORIAS])

    for i, categoria in enumerate(CATEGORIAS):
        with cat_tabs[i]:
            st.markdown(f"### {ICONES_CAT[categoria]} {categoria}")

            lista_cat = dados["lancamentos"][categoria]

            with st.form(key=f"form_lanc_{categoria}"):
                c1, c2, c3 = st.columns([3, 2, 1])
                with c1:
                    nome_item = st.text_input("Descrição", placeholder="Ex: Aluguel, Netflix...")
                with c2:
                    valor_item = st.number_input(
                        "Valor (R$)", min_value=0.0, step=0.01, format="%.2f",
                        key=f"val_{categoria}",
                    )
                with c3:
                    st.markdown("<br>", unsafe_allow_html=True)
                    add_btn = st.form_submit_button("➕ Add")

                if add_btn:
                    if nome_item.strip():
                        lista_cat.append({"nome": nome_item.strip(), "valor": valor_item})
                        salvar_dados(mes_ano, dados)
                        st.success(f"✅ '{nome_item}' adicionado!")
                        st.rerun()
                    else:
                        st.error("Preencha a descrição.")

            if lista_cat:
                df = pd.DataFrame(lista_cat)
                df.index = range(1, len(df) + 1)
                df_fmt = df.copy()
                df_fmt["valor"] = df_fmt["valor"].apply(fmt_brl)
                df_fmt.columns = ["Nome", "Valor"]
                st.dataframe(df_fmt, use_container_width=True)

                subtotal = total_lista(lista_cat)
                st.metric(f"💸 Total {categoria}", fmt_brl(subtotal))

                with st.expander("🗑️ Remover item"):
                    opcoes = [f"{j+1}. {it['nome']}" for j, it in enumerate(lista_cat)]
                    sel = st.selectbox("Item:", opcoes, key=f"sel_del_{categoria}")
                    if st.button("Remover", key=f"btn_rem_{categoria}"):
                        idx = int(sel.split(".")[0]) - 1
                        lista_cat.pop(idx)
                        salvar_dados(mes_ano, dados)
                        st.rerun()
            else:
                st.info(f"Nenhum lançamento em {categoria}.")

    # ── Resumo total de gastos ───────────────────────────────
    st.divider()
    total_g = total_gastos(dados)
    c1, c2, c3, c4, c5 = st.columns(5)
    for col, cat in zip([c1, c2, c3, c4, c5], CATEGORIAS):
        with col:
            st.metric(cat, fmt_brl(total_lista(dados["lancamentos"][cat])))
    st.metric("💸 **Total Geral de Gastos**", fmt_brl(total_g))


# ────────────────────────────────────────────────────────────
#  TAB 2 · INVESTIMENTOS
# ────────────────────────────────────────────────────────────
with tabs[1]:
    st.markdown("## 📈 Investimentos")
    st.markdown("Registre seus aportes mensais em cada tipo de investimento.")

    with st.form("form_invest"):
        c1, c2, c3 = st.columns([3, 2, 1])
        with c1:
            nome_inv = st.text_input("Investimento", placeholder="Ex: CDB, Tesouro Direto, Ações")
        with c2:
            valor_inv = st.number_input(
                "Aporte Mensal (R$)", min_value=0.0, step=0.01, format="%.2f"
            )
        with c3:
            st.markdown("<br>", unsafe_allow_html=True)
            add_inv = st.form_submit_button("➕ Add")

        if add_inv:
            if nome_inv.strip():
                dados["investimentos"].append({"nome": nome_inv.strip(), "valor": valor_inv})
                salvar_dados(mes_ano, dados)
                st.success("✅ Investimento adicionado!")
                st.rerun()
            else:
                st.error("Preencha o nome do investimento.")

    if dados["investimentos"]:
        df_inv = pd.DataFrame(dados["investimentos"])
        df_inv.index = range(1, len(df_inv) + 1)
        df_fmt = df_inv.copy()
        df_fmt["valor"] = df_fmt["valor"].apply(fmt_brl)
        df_fmt.columns = ["Investimento", "Aporte Mensal"]
        st.dataframe(df_fmt, use_container_width=True)

        total_inv = total_lista(dados["investimentos"])
        st.metric("📈 Total Investido no Mês", fmt_brl(total_inv))

        with st.expander("🗑️ Remover investimento"):
            opcoes = [f"{j+1}. {it['nome']}" for j, it in enumerate(dados["investimentos"])]
            sel = st.selectbox("Investimento:", opcoes, key="sel_del_inv")
            if st.button("Remover", key="btn_rem_inv"):
                idx = int(sel.split(".")[0]) - 1
                dados["investimentos"].pop(idx)
                salvar_dados(mes_ano, dados)
                st.rerun()
    else:
        st.info("Nenhum investimento cadastrado.")


# ────────────────────────────────────────────────────────────
#  TAB 3 · VALORES A RECEBER
# ────────────────────────────────────────────────────────────
with tabs[2]:
    st.markdown("## 💵 Valores a Receber")
    st.markdown("Registre valores que você ainda vai receber neste mês.")

    with st.form("form_receber"):
        c1, c2, c3, c4 = st.columns([3, 2, 2, 1])
        with c1:
            nome_rec = st.text_input("Descrição", placeholder="Ex: Freelance, Aluguel recebido")
        with c2:
            valor_rec = st.number_input(
                "Valor (R$)", min_value=0.0, step=0.01, format="%.2f", key="val_rec"
            )
        with c3:
            data_rec = st.date_input("Data Prevista")
        with c4:
            st.markdown("<br>", unsafe_allow_html=True)
            add_rec = st.form_submit_button("➕ Add")

        if add_rec:
            if nome_rec.strip():
                dados["valores_receber"].append({
                    "nome": nome_rec.strip(),
                    "valor": valor_rec,
                    "data_prevista": str(data_rec),
                })
                salvar_dados(mes_ano, dados)
                st.success("✅ Adicionado!")
                st.rerun()
            else:
                st.error("Preencha a descrição.")

    if dados["valores_receber"]:
        df_rec = pd.DataFrame(dados["valores_receber"])
        df_rec.index = range(1, len(df_rec) + 1)
        df_fmt = df_rec.copy()
        df_fmt["valor"] = df_fmt["valor"].apply(fmt_brl)
        df_fmt.columns = ["Descrição", "Valor", "Data Prevista"]
        st.dataframe(df_fmt, use_container_width=True)

        st.metric("💵 Total a Receber", fmt_brl(total_lista(dados["valores_receber"])))

        with st.expander("🗑️ Remover"):
            opcoes = [f"{j+1}. {it['nome']}" for j, it in enumerate(dados["valores_receber"])]
            sel = st.selectbox("Item:", opcoes, key="sel_del_rec")
            if st.button("Remover", key="btn_rem_rec"):
                idx = int(sel.split(".")[0]) - 1
                dados["valores_receber"].pop(idx)
                salvar_dados(mes_ano, dados)
                st.rerun()
    else:
        st.info("Nenhum valor a receber cadastrado.")


# ────────────────────────────────────────────────────────────
#  TAB 4 · VALORES A PAGAR
# ────────────────────────────────────────────────────────────
with tabs[3]:
    st.markdown("## 💸 Valores a Pagar")
    st.markdown("Registre compromissos financeiros que ainda precisam ser pagos.")

    with st.form("form_pagar"):
        c1, c2, c3, c4 = st.columns([3, 2, 2, 1])
        with c1:
            nome_pag = st.text_input("Descrição", placeholder="Ex: Conta de água, Mensalidade")
        with c2:
            valor_pag = st.number_input(
                "Valor (R$)", min_value=0.0, step=0.01, format="%.2f", key="val_pag"
            )
        with c3:
            data_pag = st.date_input("Vencimento")
        with c4:
            st.markdown("<br>", unsafe_allow_html=True)
            add_pag = st.form_submit_button("➕ Add")

        if add_pag:
            if nome_pag.strip():
                dados["valores_pagar"].append({
                    "nome": nome_pag.strip(),
                    "valor": valor_pag,
                    "data_vencimento": str(data_pag),
                })
                salvar_dados(mes_ano, dados)
                st.success("✅ Adicionado!")
                st.rerun()
            else:
                st.error("Preencha a descrição.")

    if dados["valores_pagar"]:
        df_pag = pd.DataFrame(dados["valores_pagar"])
        df_pag.index = range(1, len(df_pag) + 1)
        df_fmt = df_pag.copy()
        df_fmt["valor"] = df_fmt["valor"].apply(fmt_brl)
        df_fmt.columns = ["Descrição", "Valor", "Vencimento"]
        st.dataframe(df_fmt, use_container_width=True)

        st.metric("💸 Total a Pagar", fmt_brl(total_lista(dados["valores_pagar"])))

        with st.expander("🗑️ Remover"):
            opcoes = [f"{j+1}. {it['nome']}" for j, it in enumerate(dados["valores_pagar"])]
            sel = st.selectbox("Item:", opcoes, key="sel_del_pag")
            if st.button("Remover", key="btn_rem_pag"):
                idx = int(sel.split(".")[0]) - 1
                dados["valores_pagar"].pop(idx)
                salvar_dados(mes_ano, dados)
                st.rerun()
    else:
        st.info("Nenhum valor a pagar cadastrado.")


# ────────────────────────────────────────────────────────────
#  TAB 5 · PROJEÇÕES
# ────────────────────────────────────────────────────────────
with tabs[4]:
    st.markdown("## 🔮 Projeções Financeiras")

    # ── Cadastro de Receitas ─────────────────────────────────
    st.markdown("### 💰 Receitas do Mês")
    with st.form("form_receitas"):
        c1, c2, c3 = st.columns([3, 2, 1])
        with c1:
            nome_rce = st.text_input("Fonte de Renda", placeholder="Ex: Salário, Freelance, Dividendos")
        with c2:
            valor_rce = st.number_input(
                "Valor (R$)", min_value=0.0, step=0.01, format="%.2f", key="val_rce"
            )
        with c3:
            st.markdown("<br>", unsafe_allow_html=True)
            add_rce = st.form_submit_button("➕ Add")

        if add_rce:
            if nome_rce.strip():
                dados["receitas"].append({"nome": nome_rce.strip(), "valor": valor_rce})
                salvar_dados(mes_ano, dados)
                st.success("✅ Receita adicionada!")
                st.rerun()
            else:
                st.error("Preencha o nome da fonte de renda.")

    if dados["receitas"]:
        df_rce = pd.DataFrame(dados["receitas"])
        df_rce.index = range(1, len(df_rce) + 1)
        df_fmt = df_rce.copy()
        df_fmt["valor"] = df_fmt["valor"].apply(fmt_brl)
        df_fmt.columns = ["Fonte", "Valor"]
        st.dataframe(df_fmt, use_container_width=True)

        with st.expander("🗑️ Remover receita"):
            opcoes = [f"{j+1}. {it['nome']}" for j, it in enumerate(dados["receitas"])]
            sel = st.selectbox("Receita:", opcoes, key="sel_del_rce")
            if st.button("Remover", key="btn_rem_rce"):
                idx = int(sel.split(".")[0]) - 1
                dados["receitas"].pop(idx)
                salvar_dados(mes_ano, dados)
                st.rerun()

    st.divider()

    # ── Cálculos ─────────────────────────────────────────────
    rec_total  = total_receitas(dados)
    gast_total = total_gastos(dados)
    inv_total  = total_lista(dados["investimentos"])
    saida_tot  = gast_total + inv_total
    saldo      = rec_total - saida_tot
    reserva_m  = max(saldo, 0.0)

    st.markdown("### ⚖️ Balanço do Mês")
    c1, c2, c3, c4 = st.columns(4)
    with c1:
        st.metric("💰 Receitas",        fmt_brl(rec_total))
    with c2:
        st.metric("💸 Gastos",          fmt_brl(gast_total))
    with c3:
        st.metric("📈 Investimentos",   fmt_brl(inv_total))
    with c4:
        cor_delta = "✅ Positivo" if saldo >= 0 else "❌ Negativo"
        st.metric("⚖️ Saldo Líquido",  fmt_brl(saldo), delta=cor_delta)

    st.divider()

    # ── Saúde Financeira (50/30/20) ──────────────────────────
    st.markdown("### 🏥 Saúde Financeira — Regra 50/30/20")
    st.markdown("""
    A **Regra 50/30/20** é uma das estratégias de orçamento mais usadas no mundo:
    - 🏠 **50%** para gastos **fixos** (moradia, alimentação básica, transporte)
    - 🎯 **30%** para gastos **variáveis** (lazer, roupas, extras)
    - 💰 **20%** para **poupança e investimentos**
    """)

    gastos_fixos = total_lista(dados["lancamentos"]["Fixos"])
    gastos_var   = (
        total_lista(dados["lancamentos"]["Crédito"]) +
        total_lista(dados["lancamentos"]["Pix"])     +
        total_lista(dados["lancamentos"]["Débito"])  +
        total_lista(dados["lancamentos"]["Boleto"])
    )
    ideal_fixo  = rec_total * 0.50
    ideal_var   = rec_total * 0.30
    ideal_poupe = rec_total * 0.20

    def pct(valor):
        return f"{(valor / rec_total * 100):.1f}%" if rec_total > 0 else "—"

    def status_icone(atual, ideal):
        if ideal == 0:
            return "—"
        return "✅" if atual <= ideal else "⚠️ Acima"

    df_saude = pd.DataFrame([
        {
            "Tipo":         "🏠 Fixo",
            "Gasto Atual":  fmt_brl(gastos_fixos),
            "% Atual":      pct(gastos_fixos),
            "Ideal (R$)":   fmt_brl(ideal_fixo),
            "% Ideal":      "50%",
            "Status":       status_icone(gastos_fixos, ideal_fixo),
        },
        {
            "Tipo":         "🎯 Variável",
            "Gasto Atual":  fmt_brl(gastos_var),
            "% Atual":      pct(gastos_var),
            "Ideal (R$)":   fmt_brl(ideal_var),
            "% Ideal":      "30%",
            "Status":       status_icone(gastos_var, ideal_var),
        },
        {
            "Tipo":         "💰 Poupança",
            "Gasto Atual":  fmt_brl(inv_total),
            "% Atual":      pct(inv_total),
            "Ideal (R$)":   fmt_brl(ideal_poupe),
            "% Ideal":      "20%",
            "Status":       status_icone(ideal_poupe, inv_total),  # invertido: ideal < atual é bom
        },
    ])
    st.dataframe(df_saude, use_container_width=True, hide_index=True)

    st.divider()
    proj_1_ano = reserva_m * 12
    c1, c2 = st.columns(2)
    with c1:
        st.metric("📆 Reserva Gerada Neste Mês", fmt_brl(reserva_m))
    with c2:
        st.metric("🚀 Projeção de Reserva em 1 Ano", fmt_brl(proj_1_ano))


# ────────────────────────────────────────────────────────────
#  TAB 6 · RENDA ANUAL
# ────────────────────────────────────────────────────────────
with tabs[5]:
    st.markdown("## 📊 Renda Anual")
    st.markdown("Visão geral de receitas, gastos e saldo de todos os meses registrados.")

    meses_salvos = listar_meses_salvos()

    if meses_salvos:
        registros = []
        for m in meses_salvos:
            d   = carregar_dados(m)
            rec = total_receitas(d)
            gt  = total_gastos(d)
            inv = total_lista(d["investimentos"])
            sal = rec - gt - inv
            registros.append({
                "Mês":           nome_mes(m),
                "Receitas":      rec,
                "Gastos":        gt,
                "Investimentos": inv,
                "Saldo":         sal,
            })

        df_anual = pd.DataFrame(registros)

        # Gráfico de barras
        st.bar_chart(df_anual.set_index("Mês")[["Receitas", "Gastos"]])

        # Tabela formatada
        df_fmt = df_anual.copy()
        for col in ["Receitas", "Gastos", "Investimentos", "Saldo"]:
            df_fmt[col] = df_anual[col].apply(fmt_brl)
        df_fmt.index = range(1, len(df_fmt) + 1)
        st.dataframe(df_fmt, use_container_width=True)

        # Totais e médias
        st.divider()
        total_rec_a  = df_anual["Receitas"].sum()
        total_gast_a = df_anual["Gastos"].sum()
        total_inv_a  = df_anual["Investimentos"].sum()
        n            = len(df_anual)

        c1, c2, c3, c4 = st.columns(4)
        with c1:
            st.metric("💰 Receita Total Anual",       fmt_brl(total_rec_a))
        with c2:
            st.metric("💸 Gastos Total Anual",        fmt_brl(total_gast_a))
        with c3:
            st.metric("📈 Investimentos Total Anual", fmt_brl(total_inv_a))
        with c4:
            st.metric(f"📊 Média Mensal de Gastos",   fmt_brl(total_gast_a / n if n else 0))
    else:
        st.info(
            "Nenhum dado histórico encontrado. "
            "Salve lançamentos em outros meses para visualizar a renda anual."
        )


# ────────────────────────────────────────────────────────────
#  TAB 7 · RESUMO
# ────────────────────────────────────────────────────────────
with tabs[6]:
    st.markdown("## 📝 Resumo Financeiro")

    col_esq, col_dir = st.columns(2)

    # ── Coluna Esquerda: Configurações ───────────────────────
    with col_esq:
        st.markdown("### ⚙️ Configurações do Mês")

        novo_limite = st.number_input(
            "💳 Limite de Gastos (R$)",
            min_value=0.0,
            value=float(dados.get("limite_gastos", 0.0)),
            step=50.0,
            format="%.2f",
        )
        nova_reserva = st.number_input(
            "🏦 Saldo Reserva de Emergência (R$)",
            min_value=0.0,
            value=float(dados.get("saldo_reserva", 0.0)),
            step=50.0,
            format="%.2f",
        )

        st.markdown("### 📅 Datas da Fatura")
        c1, c2, c3 = st.columns(3)
        with c1:
            dt_fech = st.text_input("Fechamento", value=dados.get("data_fechamento", ""), placeholder="DD/MM")
        with c2:
            dt_venc = st.text_input("Vencimento", value=dados.get("data_vencimento", ""), placeholder="DD/MM")
        with c3:
            dt_pagt = st.text_input("Pagamento",  value=dados.get("data_pagamento", ""),  placeholder="DD/MM")

        st.markdown("### 🏷️ Status da Fatura")
        c1, c2 = st.columns(2)

        def salvar_configuracoes():
            dados["limite_gastos"]   = novo_limite
            dados["saldo_reserva"]   = nova_reserva
            dados["data_fechamento"] = dt_fech
            dados["data_vencimento"] = dt_venc
            dados["data_pagamento"]  = dt_pagt
            salvar_dados(mes_ano, dados)

        with c1:
            if st.button("✅ Marcar como Pago", type="primary", use_container_width=True):
                salvar_configuracoes()
                dados["status_fatura"] = "Pago"
                if not dt_pagt:
                    dados["data_pagamento"] = datetime.now().strftime("%d/%m/%Y")
                salvar_dados(mes_ano, dados)
                st.success("✅ Fatura marcada como Paga!")
                st.rerun()
        with c2:
            if st.button("⏳ Marcar Pendente", use_container_width=True):
                salvar_configuracoes()
                dados["status_fatura"] = "Pendente"
                salvar_dados(mes_ano, dados)
                st.rerun()

        if st.button("💾 Salvar Configurações", use_container_width=True):
            salvar_configuracoes()
            st.success("✅ Configurações salvas!")
            st.rerun()

    # ── Coluna Direita: Métricas do Resumo ───────────────────
    with col_dir:
        st.markdown("### 📊 Métricas do Mês")

        gast_total = total_gastos(dados)
        limite     = dados.get("limite_gastos", 0.0)
        disponiv   = limite - gast_total
        reserva    = dados.get("saldo_reserva", 0.0)
        status     = dados.get("status_fatura", "Pendente")

        if status == "Pago":
            st.success(f"✅ Fatura **Paga** em {dados.get('data_pagamento', '—')}")
        else:
            st.warning("⏳ Fatura **Pendente**")

        st.metric("💳 Limite de Gastos",     fmt_brl(limite))
        st.metric("💸 Total de Gastos",       fmt_brl(gast_total))

        delta_disp = "✅ Dentro do limite" if disponiv >= 0 else "❌ Limite excedido!"
        st.metric("💰 Disponível na Conta",   fmt_brl(max(disponiv, 0)), delta=delta_disp)
        st.metric("🏦 Reserva de Emergência", fmt_brl(reserva))

        st.divider()
        c1, c2, c3 = st.columns(3)
        with c1:
            st.caption("📅 Fechamento")
            st.markdown(f"**{dados.get('data_fechamento', '—')}**")
        with c2:
            st.caption("📅 Vencimento")
            st.markdown(f"**{dados.get('data_vencimento', '—')}**")
        with c3:
            st.caption("📅 Pagamento")
            st.markdown(f"**{dados.get('data_pagamento', '—')}**")

        # Gastos meses anteriores
        st.divider()
        st.markdown("**📆 Gastos Meses Anteriores**")
        meses_salvos = listar_meses_salvos()
        outros = [m for m in meses_salvos if m != mes_ano]
        if outros:
            for m in outros[-5:]:
                d_tmp = carregar_dados(m)
                g_tmp = total_gastos(d_tmp)
                st.caption(f"{nome_mes(m)}: **{fmt_brl(g_tmp)}**")
        else:
            st.caption("_Nenhum mês anterior registrado._")

        # Média anual
        if meses_salvos:
            total_g_anual = sum(total_gastos(carregar_dados(m)) for m in meses_salvos)
            media_anual   = total_g_anual / len(meses_salvos)
            st.divider()
            st.metric(
                f"📊 Média de Gastos Anual ({len(meses_salvos)} mês/es)",
                fmt_brl(media_anual),
            )

    # ── Geração do Relatório PDF ──────────────────────────────
    st.divider()
    st.markdown("### 📄 Relatório Completo em PDF")

    status_fatura = dados.get("status_fatura", "Pendente")

    if status_fatura == "Pago":
        st.success("✅ Fatura paga! O relatório completo está disponível.")

        # Gerar PDF ao clicar
        if st.button("📄 Gerar Relatório PDF", type="primary", use_container_width=True):
            with st.spinner("⏳ Gerando relatório, aguarde..."):
                pdf_bytes = gerar_relatorio_pdf(mes_ano, dados)

            if pdf_bytes:
                st.download_button(
                    label="⬇️ Baixar Relatório PDF",
                    data=pdf_bytes,
                    file_name=f"relatorio_financeiro_{mes_ano}.pdf",
                    mime="application/pdf",
                    use_container_width=True,
                )
                st.balloons()
                st.success("🎉 Relatório gerado com sucesso! Clique acima para baixar.")
            else:
                st.error(
                    "❌ Erro ao gerar PDF.\n\n"
                    "Verifique se a biblioteca `fpdf2` está instalada:\n"
                    "```\npip install fpdf2\n```"
                )
    else:
        st.info(
            "ℹ️ O botão de relatório ficará disponível após a fatura ser marcada como **Paga**."
        )
        st.button("🔒 Gerar Relatório PDF (disponível após pagamento)",
                disabled=True, use_container_width=True)
