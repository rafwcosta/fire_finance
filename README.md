# 💰 Gestor Financeiro Pessoal

App mobile de gestão financeira pessoal, com deploy automático no GitHub Pages.

## 🚀 Como colocar no ar (GitHub Pages)

### 1. Suba o projeto para o GitHub

```bash
git init
git add .
git commit -m "feat: gestor financeiro pessoal"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/gestor-financeiro.git
git push -u origin main
```

### 2. Configure o nome do repositório no Vite

Abra o arquivo `vite.config.js` e troque `gestor-financeiro` pelo nome exato do seu repositório:

```js
base: '/nome-do-seu-repositorio/',
```

### 3. Ative o GitHub Pages

- Vá em **Settings → Pages** no seu repositório
- Em **Source**, selecione **GitHub Actions**
- Salve

### 4. Aguarde o deploy

Ao fazer `git push`, o GitHub Actions vai automaticamente fazer o build e publicar.
Acesse: `https://SEU_USUARIO.github.io/gestor-financeiro/`

---

## 🖥️ Rodar localmente

```bash
npm install
npm run dev
```

## 📦 Build manual

```bash
npm run build
```

---

## 🗂️ Funcionalidades

- **Resumo** — saldo disponível, barra de limite, datas de pagamento e histórico mensal
- **Lançamentos** — gastos por categoria (Fixo, Crédito, Pix, Débito, Boleto, Vale Alim.) com edição inline
- **Saúde Financeira** — regra 30/40/30 aplicada sobre sua renda real
- **Pagar e Receber** — controle de dívidas e valores a receber com status
- **Investimentos** — reservas e metas com status de conclusão
- **Projeções** — receitas vs. saídas e saldo projetado

## 💾 Dados

Os dados ficam salvos automaticamente no `localStorage` do navegador.
Use o botão **R** (canto superior direito) para exportar/importar backups em JSON.