# Finanças (versão local)

Next.js 14 · TypeScript · Tailwind · Recharts. **Sem banco de dados e sem login:** tudo fica no `localStorage` do navegador.

## Rodar no computador
1. Instale o Node.js 20 LTS (nodejs.org).
2. Abra esta pasta no VS Code e, no terminal (Ctrl + `):
```bash
npm install
npm run dev
```
3. Abra http://localhost:3000.

## Enviar ao GitHub
Crie um repositório vazio em github.com/new, copie a URL e rode:
```bash
git init
git add .
git commit -m "Primeira versão"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/financas.git
git push -u origin main
```

## Publicar na Vercel
Importe o repositório em vercel.com. Não há variáveis de ambiente para configurar. Clique em **Deploy**.

## Limitações importantes
- Os dados ficam **só no navegador e no dispositivo** em que foram criados. Outro celular, outro navegador ou o endereço da Vercel × localhost começam vazios.
- Limpar os dados do navegador apaga tudo. Use **Ajustes → Exportar** para fazer backup e **Importar** para restaurar.
- O localStorage tem cerca de 5 MB. Por isso são aceitas até 3 fotos por lançamento, reduzidas automaticamente. Se encher, o app avisa e não salva.
