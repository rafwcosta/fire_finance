# 💰 Fire Finance

> Gestor financeiro pessoal para uso no celular e desktop, com deploy automático via GitHub Pages.

![Deploy](https://img.shields.io/github/actions/workflow/status/rafwcosta/fire_finance/deploy.yml?label=deploy&style=flat-square)
![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-live-10b981?style=flat-square)
![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react)
![Vite](https://img.shields.io/badge/Vite-5-646cff?style=flat-square&logo=vite)

**Acesse:** [rafwcosta.github.io/fire_finance](https://rafwcosta.github.io/fire_finance/)

---

## 📋 Funcionalidades

| Tela | Descrição |
|------|-----------|
| **Resumo** | Saldo disponível, barra de limite mensal, datas de pagamento e histórico por mês |
| **Lançamentos** | Gastos por categoria: Fixo, Crédito, Pix, Débito, Boleto e Vale Alimentação |
| **Saúde Financeira** | Regra 30/40/30 aplicada sobre a renda real (Fixos / Variáveis / Poupança) |
| **Pagar e Receber** | Controle de dívidas e valores a receber, com status (Pendente, Pago, Cancelado) |
| **Investimentos** | Reservas e metas financeiras com status de conclusão |
| **Projeções** | Receitas vs. saídas com saldo projetado do mês |

---

## 🛠️ Tecnologias

- [React 18](https://react.dev/) — interface declarativa com hooks
- [Vite 5](https://vitejs.dev/) — build tool rápido para desenvolvimento e produção
- [GitHub Actions](https://docs.github.com/en/actions) — CI/CD para deploy automático
- [GitHub Pages](https://pages.github.com/) — hospedagem gratuita
- `localStorage` — persistência dos dados no navegador, sem backend

---

## 🚀 Rodando localmente

### Pré-requisitos

- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- npm (já vem junto com o Node.js)

> **No Fedora/RHEL:**
> ```bash
> sudo dnf install nodejs -y
> ```
> **No Ubuntu/Debian:**
> ```bash
> sudo apt install nodejs npm -y
> ```

### Instalação e execução

```bash
# 1. Clone o repositório
git clone https://github.com/rafwcosta/fire_finance.git
cd fire_finance

# 2. Instale as dependências
npm install

# 3. Rode o servidor de desenvolvimento
npm run dev
```

Abra [http://localhost:5173](http://localhost:5173) no navegador.

### Outros comandos úteis

```bash
# Gerar build de produção
npm run build

# Visualizar o build localmente antes de publicar
npm run preview
```

---

## 📦 Deploy no GitHub Pages

O deploy é automático via GitHub Actions — toda vez que você fizer `git push` na branch `main`, o site é atualizado.

### Configuração inicial (uma única vez)

**1. Verifique o `vite.config.js`**

O campo `base` deve ser igual ao nome do seu repositório:

```js
export default defineConfig({
  plugins: [react()],
  base: '/fire_finance/', // ← nome do repositório
})
```

**2. Ative o GitHub Pages no repositório**

- Acesse **Settings → Pages**
- Em *Source*, selecione **GitHub Actions**
- Salve

**3. Faça um push para a branch `main`**

```bash
git add .
git commit -m "deploy: configuração inicial"
git push origin main
```

O workflow em `.github/workflows/deploy.yml` vai executar automaticamente, fazer o build e publicar.

**4. Aguarde ~1 minuto e acesse:**

```
https://rafwcosta.github.io/fire_finance/
```

---

## 💾 Dados e backup

Os dados são salvos automaticamente no `localStorage` do navegador — não precisam de servidor ou banco de dados.

Para não perder os dados ao trocar de dispositivo ou navegador, use o botão **R** no canto superior direito do app:

- **Exportar backup** — baixa um arquivo `.json` com todos os seus dados
- **Importar backup** — restaura a partir de um arquivo `.json` salvo anteriormente
- **Resetar dados** — apaga tudo e volta ao estado inicial

---

## 📁 Estrutura do projeto

```
fire_finance/
├── .github/
│   └── workflows/
│       └── deploy.yml       # Pipeline de deploy automático
├── public/
│   └── favicon.svg
├── src/
│   ├── App.jsx              # Componente principal e todas as telas
│   └── main.jsx             # Ponto de entrada da aplicação
├── index.html
├── package.json
├── vite.config.js           # Configuração do Vite (base path aqui!)
└── README.md
```

---

## 🤝 Contribuindo

Projeto pessoal, mas sugestões são bem-vindas! Abra uma [issue](https://github.com/rafwcosta/fire_finance/issues) ou um Pull Request.

---

## 📄 Licença

Uso pessoal e livre. Sem licença formal.