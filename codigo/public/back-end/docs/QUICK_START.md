# 🚀 Guia Rápido - Sabiaa Backend

## 1️⃣ Configuração Inicial (5 minutos)

### Instalar dependências
```bash
npm install
```

### Configurar variáveis de ambiente
```bash
# Copiar arquivo de exemplo
cp .env.example .env
```

Editar `.env`:
```env
PORT=3000
JWT_SECRET=minha-chave-super-secreta-123456789
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app-gmail
FRONTEND_URL=http://localhost:5500
```

## 2️⃣ Iniciar Servidor

```bash
# Modo desenvolvimento (com auto-reload)
npm run dev

# Modo produção
npm start
```

Servidor rodando em: **http://localhost:3000**

## 3️⃣ Testar Endpoints

### 1. Cadastrar Usuário

```bash
POST http://localhost:3000/api/auth/cadastro
Content-Type: application/json

{
  "nome": "Maria Silva",
  "email": "maria@exemplo.com",
  "senha": "Senha123",
  "tipo": "aluno",
  "data_nascimento": "2005-03-20",
  "genero": "feminino",
  "telefone": "31999999999"
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Usuário cadastrado com sucesso",
  "data": {
    "token": "eyJhbGciOiJI...",
    "usuario": { ... }
  }
}
```

### 2. Fazer Login

```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "maria@exemplo.com",
  "senha": "Senha123"
}
```

**Copie o `token` da resposta!**

### 3. Ver Perfil

```bash
GET http://localhost:3000/api/usuario/perfil
Authorization: Bearer SEU_TOKEN_AQUI
```

### 4. Atualizar Perfil

```bash
PUT http://localhost:3000/api/usuario/perfil
Authorization: Bearer SEU_TOKEN_AQUI
Content-Type: application/json

{
  "telefone": "31988888888",
  "endereco": {
    "cidade": "Belo Horizonte",
    "estado": "MG"
  }
}
```

### 5. Recuperar Senha

```bash
POST http://localhost:3000/api/auth/recuperar-senha
Content-Type: application/json

{
  "email": "maria@exemplo.com"
}
```

**Verificar email** → código de 6 dígitos

```bash
POST http://localhost:3000/api/auth/alterar-senha
Content-Type: application/json

{
  "token": "token-recebido-no-passo-anterior",
  "codigo": "123456",
  "nova_senha": "NovaSenha123"
}
```

## 4️⃣ Tipos de Usuário

### Aluno
```json
{
  "tipo": "aluno",
  "referencias_academicas": {
    "aluno": {
      "escola": "Escola Municipal",
      "serie": "9º ano",
      "turma": "A"
    }
  }
}
```

### Professor
```json
{
  "tipo": "professor",
  "referencias_academicas": {
    "professor": {
      "disciplinas": ["Matemática", "Física"],
      "formacao": "Licenciatura em Matemática"
    }
  }
}
```

### Administrador
```json
{
  "tipo": "administrador",
  "referencias_academicas": {
    "administrador": {
      "escola": "Escola Estadual XYZ",
      "cargo": "Diretor"
    }
  }
}
```

## 5️⃣ Estrutura de Pastas

```
src/
├── config/         → Configurações (DB, JWT, Email)
├── controllers/    → Lógica dos endpoints
├── middlewares/    → Autenticação e permissões
├── routes/         → Definição de rotas
├── services/       → Lógica de negócio
├── utils/          → Funções auxiliares
└── validators/     → Validações de dados
```

## 6️⃣ Comandos Úteis

```bash
# Instalar dependência
npm install nome-pacote

# Verificar vulnerabilidades
npm audit

# Corrigir vulnerabilidades
npm audit fix

# Limpar node_modules
rm -rf node_modules package-lock.json
npm install
```

## 7️⃣ Endpoints Principais

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/api/auth/cadastro` | Cadastrar usuário | ❌ |
| POST | `/api/auth/login` | Login | ❌ |
| POST | `/api/auth/recuperar-senha` | Recuperar senha | ❌ |
| POST | `/api/auth/alterar-senha` | Alterar senha com código | ❌ |
| GET | `/api/auth/verificar` | Verificar token | ✅ |
| GET | `/api/usuario/perfil` | Ver perfil | ✅ |
| PUT | `/api/usuario/perfil` | Atualizar perfil | ✅ |
| PUT | `/api/usuario/alterar-senha` | Alterar senha logado | ✅ |
| DELETE | `/api/usuario/conta` | Desativar conta | ✅ |
| GET | `/api/usuario` | Listar usuários | ✅ Admin |
| POST | `/api/usuario/favoritos` | Adicionar favorito | ✅ |
| DELETE | `/api/usuario/favoritos/:tipo/:id` | Remover favorito | ✅ |

## 8️⃣ Códigos de Resposta

- **200** - OK
- **201** - Criado
- **400** - Dados inválidos
- **401** - Não autenticado
- **403** - Sem permissão
- **404** - Não encontrado
- **409** - Conflito (email já existe)
- **500** - Erro do servidor

## 9️⃣ Testando com JavaScript

```javascript
// Cadastro
const cadastro = await fetch('http://localhost:3000/api/auth/cadastro', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    nome: 'João Silva',
    email: 'joao@exemplo.com',
    senha: 'Senha123',
    tipo: 'aluno',
    data_nascimento: '2005-05-15',
    genero: 'masculino'
  })
});

const data = await cadastro.json();
const token = data.data.token;

// Ver perfil
const perfil = await fetch('http://localhost:3000/api/usuario/perfil', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const usuario = await perfil.json();
console.log(usuario);
```

## 🔟 Configurar Email Gmail

1. Acessar: https://myaccount.google.com/security
2. Ativar **Verificação em duas etapas**
3. Acessar: https://myaccount.google.com/apppasswords
4. Criar senha de app para "Outro (nome personalizado)"
5. Copiar senha gerada e colocar no `.env`

```env
SMTP_USER=seu-email@gmail.com
SMTP_PASS=senha-gerada-aqui
```

## 💡 Dicas

- ✅ Sempre use HTTPS em produção
- ✅ Altere `JWT_SECRET` para uma chave longa e aleatória
- ✅ Configure CORS adequadamente
- ✅ Adicione rate limiting
- ✅ Faça backup do `db.json` regularmente
- ✅ Use variáveis de ambiente para dados sensíveis
- ✅ Valide todos os dados de entrada
- ✅ Implemente logs adequados

## 🆘 Problemas Comuns

### Erro: "Cannot find module"
```bash
npm install
```

### Erro: "Port 3000 already in use"
```bash
# Mudar PORT no .env
PORT=3001
```

### Email não envia
- Verificar senha de app do Gmail
- Verificar se 2FA está ativo
- Verificar logs do console

### Token inválido
- Verificar se token está sendo enviado corretamente
- Verificar header: `Authorization: Bearer TOKEN`
- Token expira em 7 dias

---

✅ **API pronta para uso!** 🎉
