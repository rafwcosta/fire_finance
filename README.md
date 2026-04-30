# 💰 Gestão Financeira Pessoal

Aplicativo completo de controle financeiro pessoal desenvolvido em **Python + Streamlit**.

---

## 📦 Instalação

### 1. Pré-requisitos
- Python 3.10 ou superior instalado
- Terminal (Prompt de Comando, PowerShell ou terminal do VS Code)

### 2. Instalar as dependências
Abra o terminal na pasta do projeto e execute:

```bash
pip install -r requirements.txt
```

### 3. Rodar o aplicativo
```bash
streamlit run app.py
```

O app abrirá automaticamente no navegador em `http://localhost:8501`

---

## 🗂️ Seções do Aplicativo

| # | Seção | Descrição |
|---|-------|-----------|
| 1 | **📋 Lançamentos** | Gastos por tipo: Fixos, Crédito, Pix, Débito, Boleto |
| 2 | **📈 Investimentos** | Aportes mensais em cada investimento |
| 3 | **💵 A Receber** | Valores que ainda serão recebidos |
| 4 | **💸 A Pagar** | Compromissos financeiros pendentes |
| 5 | **🔮 Projeções** | Receitas, saldo e saúde financeira (Regra 50/30/20) |
| 6 | **📊 Renda Anual** | Histórico de receitas e gastos por mês |
| 7 | **📝 Resumo** | Limite, disponível, reserva, datas e geração de PDF |

---

## 💡 Como usar

1. **Selecione o mês** na barra lateral (Ano + Mês)
2. **Registre seus gastos** na aba Lançamentos, separados por tipo
3. **Adicione suas receitas** na aba Projeções
4. **Configure o resumo** com limite de gastos e saldo da reserva
5. **Marque como Pago** na aba Resumo quando a fatura for quitada
6. **Gere o relatório PDF** — disponível apenas após marcar como Pago

---

## 💾 Armazenamento de dados

Os dados são salvos automaticamente em arquivos JSON dentro da pasta `dados_financeiros/`, 
um arquivo por mês (ex: `2026-04.json`). Não é necessário banco de dados.

---

## 📄 Relatório PDF

O relatório inclui todas as 7 seções com:
- Todos os lançamentos por categoria com subtotais
- Análise de saúde financeira (Regra 50/30/20)
- Projeção de reserva para 1 ano
- Comparativo da renda anual
- Resumo completo com datas e médias

---

## 🛠️ Tecnologias

- **[Streamlit](https://streamlit.io/)** — Interface web interativa
- **[Pandas](https://pandas.pydata.org/)** — Manipulação de dados em tabelas
- **[FPDF2](https://py-pdf.github.io/fpdf2/)** — Geração de relatórios PDF
- **JSON** — Persistência de dados local
